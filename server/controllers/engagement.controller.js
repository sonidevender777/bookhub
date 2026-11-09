const Book = require('../models/book.model');
const BookCopy = require('../models/book-copy.model');
const DigitalAccess = require('../models/digital-access.model');
const Order = require('../models/order.model');
const Rental = require('../models/rental.model');
const Reservation = require('../models/reservation.model');
const Review = require('../models/review.model');
const Wishlist = require('../models/wishlist.model');
const ApiError = require('../utils/api-error');
const { createNotification } = require('../services/notification.service');

const ensureBook = async (bookId) => {
  const book = await Book.findOne({ _id: bookId, isActive: true, isArchived: false });
  if (!book) throw new ApiError('Book not found.', 404);
  return book;
};

const recalculateBookRating = async (bookId) => {
  const stats = await Review.aggregate([
    { $match: { book: bookId, status: 'visible' } },
    { $group: { _id: '$book', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  await Book.findByIdAndUpdate(bookId, {
    averageRating: stats[0] ? Number(stats[0].averageRating.toFixed(1)) : 0,
    reviewCount: stats[0]?.reviewCount || 0,
  });
};

const listWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user._id }).populate('book', 'title slug isbn13 purchasePrice physicalRental digitalRental averageRating reviewCount').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const addWishlist = async (req, res, next) => {
  try {
    await ensureBook(req.validatedBody.book);
    const item = await Wishlist.findOneAndUpdate(
      { user: req.user._id, book: req.validatedBody.book },
      { user: req.user._id, book: req.validatedBody.book },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).populate('book', 'title slug purchasePrice');
    res.status(200).json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
};

const removeWishlist = async (req, res, next) => {
  try {
    await Wishlist.deleteOne({ user: req.user._id, book: req.params.bookId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const listReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ book: req.params.bookId, status: 'visible' }).populate('user', 'fullName').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const book = await ensureBook(req.validatedBody.book);
    const [order, rental, digitalAccess] = await Promise.all([
      Order.exists({ user: req.user._id, 'items.book': book._id, orderStatus: { $ne: 'cancelled' } }),
      Rental.exists({ user: req.user._id, book: book._id }),
      DigitalAccess.exists({ user: req.user._id, book: book._id }),
    ]);
    const verifiedActivity = Boolean(order || rental || digitalAccess);
    if (!verifiedActivity) throw new ApiError('Only customers with a purchase or rental can review this book.', 403);

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, book: book._id },
      { ...req.validatedBody, user: req.user._id, verifiedActivity, status: 'visible' },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    ).populate('user', 'fullName');
    await recalculateBookRating(book._id);
    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
};

const moderateReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.reviewId, req.validatedBody, { returnDocument: 'after', runValidators: true });
    if (!review) throw new ApiError('Review not found.', 404);
    await recalculateBookRating(review.book);
    res.status(200).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
};

const listMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).populate('book', 'title slug isbn13').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

const createReservation = async (req, res, next) => {
  try {
    const book = await ensureBook(req.validatedBody.book);
    const availableCopy = await BookCopy.exists({ book: book._id, status: 'available', isActive: true });
    if (availableCopy) throw new ApiError('This book has an available physical copy. You can rent it directly.', 422);

    const existing = await Reservation.findOne({ user: req.user._id, book: book._id, status: { $in: ['waiting', 'notified'] } });
    if (existing) return res.status(200).json({ success: true, data: { reservation: existing } });

    const activeCount = await Reservation.countDocuments({ book: book._id, status: { $in: ['waiting', 'notified'] } });
    const reservation = await Reservation.create({ user: req.user._id, book: book._id, position: activeCount + 1 });
    await createNotification({
      recipient: req.user._id,
      type: 'system',
      title: 'Reservation added',
      message: `You joined the waitlist for ${book.title}. Your position is ${reservation.position}.`,
      link: '/reservations',
      metadata: { reservation: reservation._id, book: book._id },
    });
    res.status(201).json({ success: true, data: { reservation } });
  } catch (error) {
    next(error);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.reservationId, user: req.user._id, status: { $in: ['waiting', 'notified'] } },
      { status: 'cancelled' },
      { returnDocument: 'after' },
    );
    if (!reservation) throw new ApiError('Reservation not found.', 404);
    res.status(200).json({ success: true, data: { reservation } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listWishlist,
  addWishlist,
  removeWishlist,
  listReviews,
  createReview,
  moderateReview,
  listMyReservations,
  createReservation,
  cancelReservation,
};
