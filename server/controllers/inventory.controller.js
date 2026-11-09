const Book = require('../models/book.model');
const Branch = require('../models/branch.model');
const Location = require('../models/location.model');
const BookCopy = require('../models/book-copy.model');
const ApiError = require('../utils/api-error');
const { inventoryQuerySchema } = require('../validators/inventory.validator');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const copyPopulate = (query) =>
  query
    .populate('book', 'title slug isbn13 purchasePrice physicalRental')
    .populate('branch', 'name code slug')
    .populate('location', 'label floor section rack shelf');

const populateCopyDocument = (copy) =>
  copy.populate([
    { path: 'book', select: 'title slug isbn13 purchasePrice physicalRental' },
    { path: 'branch', select: 'name code slug' },
    { path: 'location', select: 'label floor section rack shelf' },
  ]);

const verifyBranchAndLocation = async (branchId, locationId) => {
  const [branch, location] = await Promise.all([
    Branch.findOne({ _id: branchId, isActive: true }),
    Location.findOne({ _id: locationId, isActive: true }),
  ]);
  if (!branch) throw new ApiError('Branch not found or inactive.', 422);
  if (!location) throw new ApiError('Location not found or inactive.', 422);
  if (String(location.branch) !== String(branch._id)) {
    throw new ApiError('Selected location does not belong to the selected branch.', 422);
  }
  return { branch, location };
};

const createBranch = async (req, res, next) => {
  try {
    const existing = await Branch.findOne({ name: new RegExp(`^${escapeRegex(req.validatedBody.name)}$`, 'i'), isActive: true });
    if (existing) {
      return res.status(200).json({ success: true, data: { branch: existing, reused: true } });
    }
    const branch = await Branch.create(req.validatedBody);
    res.status(201).json({ success: true, data: { branch } });
  } catch (error) {
    next(error);
  }
};

const listBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

const createLocation = async (req, res, next) => {
  try {
    const branch = await Branch.exists({ _id: req.validatedBody.branch, isActive: true });
    if (!branch) throw new ApiError('Branch not found or inactive.', 422);
    const existing = await Location.findOne({
      branch: req.validatedBody.branch,
      floor: req.validatedBody.floor,
      section: req.validatedBody.section,
      rack: req.validatedBody.rack,
      shelf: req.validatedBody.shelf,
      isActive: true,
    }).populate('branch', 'name code slug');
    if (existing) {
      return res.status(200).json({ success: true, data: { location: existing, reused: true } });
    }
    const location = await Location.create(req.validatedBody);
    await location.populate('branch', 'name code slug');
    res.status(201).json({ success: true, data: { location } });
  } catch (error) {
    next(error);
  }
};

const listLocations = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.q) filter.$text = { $search: req.query.q };
    const locations = await Location.find(filter).populate('branch', 'name code slug').sort({ label: 1 }).lean();
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

const createCopy = async (req, res, next) => {
  try {
    const book = await Book.exists({ _id: req.validatedBody.book, isActive: true, isArchived: false });
    if (!book) throw new ApiError('Book not found or inactive.', 422);
    await verifyBranchAndLocation(req.validatedBody.branch, req.validatedBody.location);

    const copy = await BookCopy.create({
      ...req.validatedBody,
      history: [{ action: 'created', toLocation: req.validatedBody.location, toStatus: req.validatedBody.status || 'available', changedBy: req.user?._id }],
    });
    await populateCopyDocument(copy);
    res.status(201).json({ success: true, data: { copy } });
  } catch (error) {
    next(error);
  }
};

const listCopies = async (req, res, next) => {
  try {
    const parsed = inventoryQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError('One or more inventory filters are invalid.', 422);
    const { q, book, branch, location, status, page, limit } = parsed.data;
    const filter = { isActive: true };
    if (book) filter.book = book;
    if (branch) filter.branch = branch;
    if (location) filter.location = location;
    if (status) filter.status = status;
    if (q) filter.$or = [{ copyCode: new RegExp(q, 'i') }, { barcode: new RegExp(q, 'i') }];

    const [copies, total] = await Promise.all([
      copyPopulate(BookCopy.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean()),
      BookCopy.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, data: copies, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const updateCopy = async (req, res, next) => {
  try {
    const copy = await BookCopy.findById(req.params.copyId);
    if (!copy) throw new ApiError('Book copy not found.', 404);
    const previousStatus = copy.status;
    if (req.validatedBody.status) copy.status = req.validatedBody.status;
    if (req.validatedBody.condition) copy.condition = req.validatedBody.condition;
    copy.history.push({
      action: req.validatedBody.condition ? 'condition_updated' : 'status_changed',
      fromStatus: previousStatus,
      toStatus: copy.status,
      note: req.validatedBody.note,
      changedBy: req.user?._id,
    });
    await copy.save();
    await populateCopyDocument(copy);
    res.status(200).json({ success: true, data: { copy } });
  } catch (error) {
    next(error);
  }
};

const moveCopy = async (req, res, next) => {
  try {
    const copy = await BookCopy.findById(req.params.copyId);
    if (!copy) throw new ApiError('Book copy not found.', 404);
    const location = await Location.findOne({ _id: req.validatedBody.location, isActive: true });
    if (!location) throw new ApiError('Location not found or inactive.', 422);
    const previousLocation = copy.location;
    copy.location = location._id;
    copy.branch = location.branch;
    copy.history.push({
      action: 'moved',
      fromLocation: previousLocation,
      toLocation: location._id,
      note: req.validatedBody.note,
      changedBy: req.user?._id,
    });
    await copy.save();
    await populateCopyDocument(copy);
    res.status(200).json({ success: true, data: { copy } });
  } catch (error) {
    next(error);
  }
};

const getBookAvailability = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, isActive: true, isArchived: false }).select('title slug physicalRental');
    if (!book) throw new ApiError('Book not found.', 404);

    const summary = await BookCopy.aggregate([
      { $match: { book: book._id, isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = summary.reduce((result, item) => ({ ...result, [item._id]: item.count }), {});
    const availableCopies = await copyPopulate(BookCopy.find({ book: book._id, status: 'available', isActive: true }).limit(10).lean());

    res.status(200).json({
      success: true,
      data: {
        book,
        counts: {
          total: summary.reduce((sum, item) => sum + item.count, 0),
          available: counts.available || 0,
          rented: counts.rented || 0,
          reserved: counts.reserved || 0,
          sold: counts.sold || 0,
          damaged: counts.damaged || 0,
          lost: counts.lost || 0,
          maintenance: counts.maintenance || 0,
        },
        availableCopies,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBranch,
  listBranches,
  createLocation,
  listLocations,
  createCopy,
  listCopies,
  updateCopy,
  moveCopy,
  getBookAvailability,
};
