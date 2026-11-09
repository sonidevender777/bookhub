const mongoose = require('mongoose');
const config = require('../config/env');
const Book = require('../models/book.model');
const Branch = require('../models/branch.model');
const Location = require('../models/location.model');
const BookCopy = require('../models/book-copy.model');

const copyStatuses = ['available', 'available', 'available', 'rented', 'reserved'];

const upsertLocation = async (branch, location) => {
  const existing = await Location.findOne({
    branch: branch._id,
    floor: location.floor,
    section: location.section,
    rack: location.rack,
    shelf: location.shelf,
  });
  if (existing) return existing;
  return Location.create({ ...location, branch: branch._id });
};

const seedInventory = async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required before inventory can be seeded.');
  await mongoose.connect(config.mongoUri);

  const branch =
    (await Branch.findOne({ code: 'BOOKHUB_REWARI' })) ||
    (await Branch.create({
      name: 'Book Hub Rewari',
      code: 'BOOKHUB_REWARI',
      phone: '+91 99999 00000',
      email: 'hello@bookhub.demo',
      address: {
        line1: 'Model Town Market',
        city: 'Rewari',
        state: 'Haryana',
        country: 'India',
        postalCode: '123401',
      },
    }));

  const locations = await Promise.all([
    upsertLocation(branch, { floor: 'Ground Floor', section: 'Fiction', rack: 'Rack A1', shelf: 'Shelf 1' }),
    upsertLocation(branch, { floor: 'Ground Floor', section: 'Academic', rack: 'Rack B2', shelf: 'Shelf 2' }),
    upsertLocation(branch, { floor: 'First Floor', section: 'Personal Growth', rack: 'Rack C1', shelf: 'Shelf 1' }),
    upsertLocation(branch, { floor: 'First Floor', section: 'Young Readers', rack: 'Rack D3', shelf: 'Shelf 4' }),
  ]);

  const books = await Book.find({ isActive: true, isArchived: false }).sort({ title: 1 });
  if (!books.length) throw new Error('No books found. Run npm run seed first.');

  let createdOrUpdated = 0;
  for (const [bookIndex, book] of books.entries()) {
    const location = locations[bookIndex % locations.length];
    for (let copyNumber = 1; copyNumber <= 5; copyNumber += 1) {
      const copyCode = `BK-${String(bookIndex + 1).padStart(3, '0')}-${String(copyNumber).padStart(3, '0')}`;
      const status = copyStatuses[copyNumber - 1];
      await BookCopy.updateOne(
        { copyCode },
        {
          $set: {
            book: book._id,
            branch: branch._id,
            location: location._id,
            copyCode,
            barcode: copyCode,
            status,
            acquisitionPrice: book.purchasePrice,
            condition: { grade: copyNumber === 5 ? 'fair' : 'good', notes: copyNumber === 5 ? 'Demo copy with visible wear.' : '' },
          },
          $setOnInsert: {
            history: [{ action: 'created', toLocation: location._id, toStatus: status, note: 'Seeded demo inventory.' }],
          },
        },
        { upsert: true, runValidators: true },
      );
      createdOrUpdated += 1;
    }
  }

  console.info(`Seeded ${createdOrUpdated} demo physical copies across ${locations.length} locations.`);
};

seedInventory()
  .catch((error) => {
    console.error(`Inventory seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
