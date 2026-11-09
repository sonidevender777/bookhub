const Book = require('../models/book.model');
const BookCopy = require('../models/book-copy.model');
const DigitalAccess = require('../models/digital-access.model');
const Order = require('../models/order.model');
const Rental = require('../models/rental.model');
const Reservation = require('../models/reservation.model');
const Review = require('../models/review.model');
const User = require('../models/user.model');
const ApiError = require('../utils/api-error');
const { resolveDigitalFileUrl, getDigitalKind } = require('../utils/digital-file');

const listBooks = async (req, res, next) => {
  try {
    const books = await Book.find({})
      .select('+digitalAssetKey')
      .populate('authors', 'name slug')
      .populate('categories', 'name slug')
      .sort({ title: 1 })
      .limit(500)
      .lean();
    const data = books.map((book) => {
      const hasDigitalEdition = Boolean(book.digitalEnabled && book.digitalAssetKey);
      const digitalKind = hasDigitalEdition ? getDigitalKind(book.digitalAssetKey) : null;
      const record = { ...book, hasDigitalEdition, digitalKind, hasDigitalPdf: digitalKind === 'pdf' };
      delete record.digitalAssetKey;
      return record;
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const openBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId).select('+digitalAssetKey').lean();
    if (!book) throw new ApiError('Book not found.', 404);
    const fileUrl = resolveDigitalFileUrl(book.digitalAssetKey);
    if (!book.digitalEnabled || !fileUrl) throw new ApiError('This title does not have a digital edition attached.', 404);
    res.status(200).json({
      success: true,
      data: { reader: { title: book.title, fileUrl, kind: getDigitalKind(fileUrl) } },
    });
  } catch (error) {
    next(error);
  }
};

const sumField = async (Model, match, field) => {
  const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }]);
  return result[0]?.total || 0;
};

const dashboard = async (req, res, next) => {
  try {
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      rentedCopies,
      overdueRentals,
      digitalRentals,
      customers,
      orders,
      reservations,
      visibleReviews,
      rentalRevenue,
      orderRevenue,
      outstandingPenalties,
      recentOrders,
      recentRentals,
      lowStock,
    ] = await Promise.all([
      Book.countDocuments({ isActive: true, isArchived: false }),
      BookCopy.countDocuments({ isActive: true }),
      BookCopy.countDocuments({ isActive: true, status: 'available' }),
      BookCopy.countDocuments({ isActive: true, status: 'rented' }),
      Rental.countDocuments({ status: 'overdue' }),
      DigitalAccess.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments(),
      Reservation.countDocuments({ status: { $in: ['waiting', 'notified'] } }),
      Review.countDocuments({ status: 'visible' }),
      sumField(Rental, {}, 'rentalPrice'),
      sumField(Order, {}, 'grandTotal'),
      sumField(Rental, { status: { $in: ['overdue', 'lost', 'damaged'] } }, 'penaltyAmount'),
      Order.find().populate('user', 'fullName email').sort({ createdAt: -1 }).limit(8).lean(),
      Rental.find().populate('user', 'fullName email').populate('book', 'title').populate('copy', 'copyCode').sort({ createdAt: -1 }).limit(8).lean(),
      BookCopy.aggregate([
        { $match: { isActive: true, status: 'available' } },
        { $group: { _id: '$book', available: { $sum: 1 } } },
        { $match: { available: { $lte: 2 } } },
        { $limit: 8 },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
        { $unwind: '$book' },
        { $project: { available: 1, title: '$book.title', isbn13: '$book.isbn13' } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBooks,
          totalCopies,
          availableCopies,
          rentedCopies,
          overdueRentals,
          digitalRentals,
          customers,
          orders,
          reservations,
          visibleReviews,
          revenue: orderRevenue,
          rentalRevenue,
          salesRevenue: orderRevenue - rentalRevenue,
          outstandingPenalties,
        },
        recentOrders,
        recentRentals,
        lowStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

const customers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'customer' })
      .select('fullName email phone accountStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { dashboard, customers, listBooks, openBook };
