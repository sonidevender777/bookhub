const BookCopy = require('../models/book-copy.model');
const Rental = require('../models/rental.model');
const Notification = require('../models/notification.model');
const ApiError = require('../utils/api-error');
const { createNotification } = require('./notification.service');

const rentalPopulate = (query) =>
  query
    .populate('book', 'title slug isbn13 purchasePrice physicalRental')
    .populate('copy', 'copyCode barcode status condition location')
    .populate({
      path: 'copy',
      populate: { path: 'location', select: 'label floor section rack shelf' },
    });

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const markOverdueRentals = async () => {
  const now = new Date();
  const dueSoonLimit = addDays(now, 2);
  const rentals = await Rental.find({ status: { $in: ['active', 'overdue'] } });
  for (const rental of rentals) {
    const previousStatus = rental.status;
    const penalty = rental.calculatePenalty(now);
    const nextStatus = penalty > 0 ? 'overdue' : 'active';
    if (rental.penaltyAmount !== penalty || rental.status !== nextStatus) {
      rental.penaltyAmount = penalty;
      rental.status = nextStatus;
      await rental.save();
      if (previousStatus !== 'overdue' && nextStatus === 'overdue') {
        await rental.populate('book', 'title');
        await createNotification({
          recipient: rental.user,
          type: 'rental_overdue',
          title: 'Rental overdue',
          message: `${rental.book.title} is overdue. Current penalty: ${rental.penaltyAmount}.`,
          link: '/rentals',
          metadata: { rental: rental._id },
        });
      }
    }

    if (rental.status === 'active' && rental.dueDate > now && rental.dueDate <= dueSoonLimit) {
      const existingWarning = await Notification.exists({
        recipient: rental.user,
        type: 'rental_due_soon',
        'metadata.rental': rental._id,
      });
      if (!existingWarning) {
        await rental.populate('book', 'title');
        await createNotification({
          recipient: rental.user,
          type: 'rental_due_soon',
          title: 'Rental due soon',
          message: `${rental.book.title} is due on ${rental.dueDate.toDateString()}. Please return it on time to avoid late penalties.`,
          link: '/rentals',
          metadata: { rental: rental._id },
        });
      }
    }
  }
};

const createPhysicalRental = async ({ userId, orderId, book, quantity, rentalPrice, durationDays }) => {
  const availableCopies = await BookCopy.find({ book: book._id, status: 'available', isActive: true })
    .sort({ createdAt: 1 })
    .limit(quantity);

  if (availableCopies.length < quantity) {
    throw new ApiError(`Only ${availableCopies.length} copies of ${book.title} are available for physical rental.`, 422);
  }

  const rentals = [];
  for (const copy of availableCopies) {
    const rental = await Rental.create({
      rentalNumber: `RNT-${Date.now().toString(36).toUpperCase()}-${copy.copyCode.replace(/[^A-Z0-9]/g, '')}`,
      user: userId,
      order: orderId,
      book: book._id,
      copy: copy._id,
      dueDate: addDays(new Date(), durationDays || 14),
      rentalPrice,
      bookPriceSnapshot: book.purchasePrice,
      conditionBefore: copy.condition,
    });

    copy.status = 'rented';
    copy.history.push({
      action: 'status_changed',
      fromStatus: 'available',
      toStatus: 'rented',
      note: `Physical rental ${rental.rentalNumber} created.`,
      changedBy: userId,
    });
    await copy.save();
    await createNotification({
      recipient: userId,
      type: 'rental_created',
      title: 'Physical rental started',
      message: `${book.title} is rented until ${rental.dueDate.toDateString()}. Copy code: ${copy.copyCode}.`,
      link: '/rentals',
      metadata: { rental: rental._id, copy: copy._id, order: orderId },
    });
    rentals.push(rental);
  }

  return rentals;
};

module.exports = { rentalPopulate, markOverdueRentals, createPhysicalRental };
