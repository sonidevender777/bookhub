const BookCopy = require('../models/book-copy.model');
const Rental = require('../models/rental.model');
const ApiError = require('../utils/api-error');
const { createNotification } = require('../services/notification.service');
const { markOverdueRentals, rentalPopulate } = require('../services/rental.service');

const listMyRentals = async (req, res, next) => {
  try {
    await markOverdueRentals();
    const rentals = await rentalPopulate(Rental.find({ user: req.user._id }).sort({ createdAt: -1 }).lean());
    res.status(200).json({ success: true, data: rentals });
  } catch (error) {
    next(error);
  }
};

const listRentals = async (req, res, next) => {
  try {
    await markOverdueRentals();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user) filter.user = req.query.user;
    const rentals = await rentalPopulate(
      Rental.find(filter).populate('user', 'fullName email phone').sort({ dueDate: 1 }).limit(150).lean(),
    );
    res.status(200).json({ success: true, data: rentals });
  } catch (error) {
    next(error);
  }
};

const returnRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) throw new ApiError('Rental not found.', 404);
    if (!['active', 'overdue'].includes(rental.status)) {
      throw new ApiError('Only active or overdue rentals can be returned.', 422);
    }

    rental.penaltyAmount = rental.calculatePenalty(new Date());
    rental.status = 'returned';
    rental.returnDate = new Date();
    rental.conditionAfter = req.validatedBody.conditionAfter;
    rental.notes = req.validatedBody.notes;
    await rental.save();

    const copy = await BookCopy.findById(rental.copy);
    if (copy) {
      copy.status = req.validatedBody.conditionAfter.grade === 'damaged' ? 'damaged' : 'available';
      copy.condition = req.validatedBody.conditionAfter;
      copy.history.push({
        action: 'status_changed',
        fromStatus: 'rented',
        toStatus: copy.status,
        note: `Returned from rental ${rental.rentalNumber}.`,
        changedBy: req.user._id,
      });
      await copy.save();
    }
    await createNotification({
      recipient: rental.user,
      type: 'rental_returned',
      title: 'Book returned',
      message: `Rental ${rental.rentalNumber} was returned. Penalty: ${rental.penaltyAmount}.`,
      link: '/rentals',
      metadata: { rental: rental._id },
    });

    await rentalPopulate(rental);
    res.status(200).json({ success: true, data: { rental } });
  } catch (error) {
    next(error);
  }
};

const markRentalIssue = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) throw new ApiError('Rental not found.', 404);
    rental.status = req.validatedBody.status;
    rental.penaltyAmount = rental.bookPriceSnapshot;
    rental.notes = req.validatedBody.notes;
    await rental.save();

    const copy = await BookCopy.findById(rental.copy);
    if (copy) {
      copy.status = req.validatedBody.status;
      copy.history.push({
        action: 'status_changed',
        fromStatus: 'rented',
        toStatus: req.validatedBody.status,
        note: req.validatedBody.notes || `Marked ${req.validatedBody.status} for rental ${rental.rentalNumber}.`,
        changedBy: req.user._id,
      });
      await copy.save();
    }
    await createNotification({
      recipient: rental.user,
      type: 'rental_issue',
      title: `Rental marked ${req.validatedBody.status}`,
      message: `Rental ${rental.rentalNumber} was marked ${req.validatedBody.status}. Penalty: ${rental.penaltyAmount}.`,
      link: '/rentals',
      metadata: { rental: rental._id },
    });

    await rentalPopulate(rental);
    res.status(200).json({ success: true, data: { rental } });
  } catch (error) {
    next(error);
  }
};

const refreshOverdue = async (req, res, next) => {
  try {
    await markOverdueRentals();
    const overdueCount = await Rental.countDocuments({ status: 'overdue' });
    const outstandingPenalty = await Rental.aggregate([
      { $match: { status: { $in: ['overdue', 'lost', 'damaged'] } } },
      { $group: { _id: null, total: { $sum: '$penaltyAmount' } } },
    ]);
    res.status(200).json({
      success: true,
      data: {
        overdueCount,
        outstandingPenalty: outstandingPenalty[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const clearRentalHistory = async (req, res, next) => {
  try {
    const isAdmin = ['inventory_staff', 'manager', 'owner'].includes(req.user.role);
    const filter = { status: { $in: ['returned', 'cancelled'] } };
    if (!isAdmin) filter.user = req.user._id;
    const result = await Rental.deleteMany(filter);
    res.status(200).json({ success: true, message: `${result.deletedCount} completed rental record${result.deletedCount === 1 ? '' : 's'} cleared.` });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMyRentals, listRentals, returnRental, markRentalIssue, refreshOverdue, clearRentalHistory };
