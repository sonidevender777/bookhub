const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/user.model');
const BookCopy = require('../models/book-copy.model');
const Rental = require('../models/rental.model');

const seedOverdueRental = async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required before overdue rental data can be seeded.');
  await mongoose.connect(config.mongoUri);

  const user =
    (await User.findOne({ email: 'overdue.demo@bookhub.test' })) ||
    (await User.create({
      fullName: 'Overdue Demo Customer',
      email: 'overdue.demo@bookhub.test',
      password: 'DemoPass123',
    }));

  const copy = await BookCopy.findOne({ status: 'available', isActive: true }).populate('book');
  if (!copy) throw new Error('No available copy found. Run npm run seed:inventory first.');

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() - 4);

  const rental = await Rental.create({
    rentalNumber: `RNT-OVERDUE-${Date.now().toString(36).toUpperCase()}`,
    user: user._id,
    book: copy.book._id,
    copy: copy._id,
    dueDate,
    rentalPrice: copy.book.physicalRental?.price || 0,
    bookPriceSnapshot: copy.book.purchasePrice,
    graceDays: 1,
    penaltyRatePerDay: 0.01,
    conditionBefore: copy.condition,
  });
  rental.penaltyAmount = rental.calculatePenalty(new Date());
  rental.status = rental.penaltyAmount > 0 ? 'overdue' : 'active';
  await rental.save();

  copy.status = 'rented';
  copy.history.push({
    action: 'status_changed',
    fromStatus: 'available',
    toStatus: 'rented',
    note: `Overdue demo rental ${rental.rentalNumber} created.`,
    changedBy: user._id,
  });
  await copy.save();

  console.info(`Created overdue demo rental ${rental.rentalNumber} with penalty ${rental.penaltyAmount}.`);
};

seedOverdueRental()
  .catch((error) => {
    console.error(`Overdue rental seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
