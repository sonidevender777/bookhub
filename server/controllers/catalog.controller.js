const mongoose = require('mongoose');
const Book = require('../models/book.model');
const Author = require('../models/author.model');
const Category = require('../models/category.model');
const Publisher = require('../models/publisher.model');
const ApiError = require('../utils/api-error');
const slugify = require('../utils/slug');
const { querySchema } = require('../validators/catalog.validator');
const { getDigitalKind } = require('../utils/digital-file');

const referenceModels = { authors: Author, categories: Category, publishers: Publisher };
const referenceResponseKeys = { authors: 'author', categories: 'category', publishers: 'publisher' };
const populatedBook = (query) => query
  .select('+digitalAssetKey')
  .populate('authors', 'name slug imageUrl')
  .populate('publisher', 'name slug')
  .populate('categories', 'name slug imageUrl');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const decorateBook = (book) => {
  if (!book) return book;
  const record = book.toObject ? book.toObject() : { ...book };
  record.hasDigitalEdition = Boolean(record.digitalEnabled && record.digitalAssetKey);
  record.digitalKind = record.hasDigitalEdition ? getDigitalKind(record.digitalAssetKey) : null;
  record.hasDigitalPdf = record.digitalKind === 'pdf';
  delete record.digitalAssetKey;
  return record;
};

const sendPaginated = (res, items, page, limit, total) =>
  res.status(200).json({
    success: true,
    data: items.map(decorateBook),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });

const listBooks = async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError('One or more catalog filters are invalid.', 422);
    const { q, category, author, publisher, genre, format, featured, sort, page, limit } = parsed.data;
    const filter = { isActive: true, isArchived: false };

    if (q) {
      // Text indexes do not reliably match a single typed character. Use a
      // case-insensitive partial match so search updates feel instant while
      // the customer is typing.
      const searchRegex = new RegExp(escapeRegex(q), 'i');
      const [matchingAuthors, matchingCategories, matchingPublishers] = await Promise.all([
        Author.find({ name: searchRegex, isActive: true }).select('_id').lean(),
        Category.find({ name: searchRegex, isActive: true }).select('_id').lean(),
        Publisher.find({ name: searchRegex, isActive: true }).select('_id').lean(),
      ]);
      filter.$or = [
        { title: searchRegex },
        { subtitle: searchRegex },
        { isbn10: searchRegex },
        { isbn13: searchRegex },
        { genres: searchRegex },
        { tags: searchRegex },
      ];
      if (matchingAuthors.length) filter.$or.push({ authors: { $in: matchingAuthors.map((item) => item._id) } });
      if (matchingCategories.length) filter.$or.push({ categories: { $in: matchingCategories.map((item) => item._id) } });
      if (matchingPublishers.length) filter.$or.push({ publisher: { $in: matchingPublishers.map((item) => item._id) } });
    }
    if (genre) filter.genres = new RegExp(`^${escapeRegex(genre)}$`, 'i');
    if (format === 'physical') filter.physicalEnabled = true;
    if (format === 'digital') filter.digitalEnabled = true;
    if (featured) filter.featured = featured === 'true';

    const [categoryRecord, authorRecord, publisherRecord] = await Promise.all([
      category ? Category.findOne({ slug: slugify(category), isActive: true }).select('_id') : null,
      author ? Author.findOne({ slug: slugify(author), isActive: true }).select('_id') : null,
      publisher ? Publisher.findOne({ slug: slugify(publisher), isActive: true }).select('_id') : null,
    ]);

    if ((category && !categoryRecord) || (author && !authorRecord) || (publisher && !publisherRecord)) {
      return sendPaginated(res, [], page, limit, 0);
    }

    if (categoryRecord) filter.categories = categoryRecord._id;
    if (authorRecord) filter.authors = authorRecord._id;
    if (publisherRecord) filter.publisher = publisherRecord._id;

    const sortOptions = {
      newest: { createdAt: -1 },
      digital_first: { digitalEnabled: -1, digitalAssetKey: -1, createdAt: -1, title: 1 },
      price_asc: { purchasePrice: 1, title: 1 },
      price_desc: { purchasePrice: -1, title: 1 },
      rating: { averageRating: -1, reviewCount: -1, title: 1 },
      popular: { popularityScore: -1, title: 1 },
    };
    const sorting = sortOptions[sort];

    const [books, total] = await Promise.all([
      populatedBook(Book.find(filter).sort(sorting).skip((page - 1) * limit).limit(limit).lean()),
      Book.countDocuments(filter),
    ]);
    sendPaginated(res, books, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const getBook = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const identifier = mongoose.isValidObjectId(slugOrId) ? { _id: slugOrId } : { slug: slugify(slugOrId) };
    const book = await populatedBook(Book.findOne({ ...identifier, isActive: true, isArchived: false }).lean());
    if (!book) throw new ApiError('Book not found.', 404);
    res.status(200).json({ success: true, data: { book: decorateBook(book) } });
  } catch (error) {
    next(error);
  }
};

const validateBookReferences = async ({ authors = [], categories = [], publisher }) => {
  const verifyMany = async (Model, ids, label) => {
    if (!ids.length) return;
    const uniqueIds = [...new Set(ids.map(String))];
    const count = await Model.countDocuments({ _id: { $in: uniqueIds }, isActive: true });
    if (count !== uniqueIds.length) throw new ApiError(`One or more ${label} do not exist or are inactive.`, 422);
  };

  await verifyMany(Author, authors, 'authors');
  await verifyMany(Category, categories, 'categories');
  if (publisher) {
    const exists = await Publisher.exists({ _id: publisher, isActive: true });
    if (!exists) throw new ApiError('The selected publisher does not exist or is inactive.', 422);
  }
};

const createBook = async (req, res, next) => {
  try {
    await validateBookReferences(req.validatedBody);
    const book = await Book.create(req.validatedBody);
    await book.populate('authors', 'name slug imageUrl');
    await book.populate('publisher', 'name slug');
    await book.populate('categories', 'name slug');
    res.status(201).json({ success: true, data: { book } });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) throw new ApiError('Book not found.', 404);
    await validateBookReferences({
      authors: req.validatedBody.authors || book.authors,
      categories: req.validatedBody.categories || book.categories,
      publisher: req.validatedBody.publisher === undefined ? book.publisher : req.validatedBody.publisher,
    });
    Object.assign(book, req.validatedBody);
    await book.save();
    await book.populate('authors', 'name slug imageUrl');
    await book.populate('publisher', 'name slug');
    await book.populate('categories', 'name slug');
    res.status(200).json({ success: true, data: { book } });
  } catch (error) {
    next(error);
  }
};

const archiveBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.bookId, { isArchived: true, isActive: false }, { returnDocument: 'after' });
    if (!book) throw new ApiError('Book not found.', 404);
    res.status(200).json({ success: true, data: { book } });
  } catch (error) {
    next(error);
  }
};

const listReferences = (type) => async (req, res, next) => {
  try {
    const Model = referenceModels[type];
    let records = await Model.find({ isActive: true })
      .sort(type === 'categories' ? { sortOrder: 1, name: 1 } : { name: 1 })
      .lean();
    if (type === 'categories') {
      const categoryIds = records.map((record) => record._id);
      const counts = await Book.aggregate([
        { $match: { isActive: true, isArchived: false, categories: { $in: categoryIds } } },
        { $unwind: '$categories' },
        { $match: { categories: { $in: categoryIds } } },
        { $group: { _id: '$categories', bookCount: { $sum: 1 } } },
      ]);
      const countByCategory = new Map(counts.map((item) => [String(item._id), item.bookCount]));
      records = records.map((record) => ({ ...record, bookCount: countByCategory.get(String(record._id)) || 0 }));
    }
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const createReference = (type) => async (req, res, next) => {
  try {
    const Model = referenceModels[type];
    const slug = req.validatedBody.slug || slugify(req.validatedBody.name);
    const existing = await Model.findOne({ $or: [{ slug }, { name: req.validatedBody.name }] });
    if (existing) {
      Object.assign(existing, req.validatedBody, { slug, isActive: true });
      await existing.save();
      return res.status(200).json({ success: true, data: { [referenceResponseKeys[type]]: existing } });
    }
    const record = await Model.create(req.validatedBody);
    res.status(201).json({ success: true, data: { [referenceResponseKeys[type]]: record } });
  } catch (error) {
    next(error);
  }
};

const updateReference = (type) => async (req, res, next) => {
  try {
    const Model = referenceModels[type];
    const record = await Model.findByIdAndUpdate(req.params.referenceId, req.validatedBody, { returnDocument: 'after', runValidators: true });
    if (!record) throw new ApiError(`${type.slice(0, -1)} not found.`, 404);
    res.status(200).json({ success: true, data: { [referenceResponseKeys[type]]: record } });
  } catch (error) {
    next(error);
  }
};

const archiveReference = (type) => async (req, res, next) => {
  try {
    const Model = referenceModels[type];
    const record = await Model.findByIdAndUpdate(req.params.referenceId, { isActive: false }, { returnDocument: 'after' });
    if (!record) throw new ApiError(`${type.slice(0, -1)} not found.`, 404);
    res.status(200).json({ success: true, data: { [referenceResponseKeys[type]]: record } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listBooks,
  getBook,
  createBook,
  updateBook,
  archiveBook,
  listReferences,
  createReference,
  updateReference,
  archiveReference,
};
