const DigitalAccess = require('../models/digital-access.model');
const Notification = require('../models/notification.model');
const { createNotification } = require('./notification.service');

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const digitalAccessPopulate = (query) =>
  query.populate('book', 'title slug isbn13 digitalFormat digitalRental purchasePrice cover');

const expireOldDigitalAccess = async () => {
  await DigitalAccess.updateMany(
    { status: 'active', expirationTime: { $lte: new Date() } },
    { $set: { status: 'expired' } },
  );
};

const notifyExpiringDigitalAccess = async () => {
  const now = new Date();
  const warningLimit = addDays(now, 2);
  const accesses = await DigitalAccess.find({
    status: 'active',
    expirationTime: { $gt: now, $lte: warningLimit },
  }).populate('book', 'title');

  for (const access of accesses) {
    const existingWarning = await Notification.exists({
      recipient: access.user,
      type: 'digital_access_expiring',
      'metadata.access': access._id,
    });
    if (!existingWarning) {
      await createNotification({
        recipient: access.user,
        type: 'digital_access_expiring',
        title: 'Digital access expires soon',
        message: `${access.book.title} access expires on ${access.expirationTime.toDateString()}. Open it from your Digital Library before it expires.`,
        link: '/digital-library',
        metadata: { access: access._id },
      });
    }
  }
};

const createDigitalAccess = async ({ userId, orderId, book, quantity, price, durationDays }) => {
  const accesses = [];
  for (let index = 0; index < quantity; index += 1) {
    const access = await DigitalAccess.create({
        accessNumber: `DGA-${Date.now().toString(36).toUpperCase()}-${index + 1}`,
        user: userId,
        order: orderId,
        book: book._id,
        expirationTime: addDays(new Date(), durationDays || 14),
        price,
        format: book.digitalFormat || 'pdf',
        assetKey: book.digitalAssetKey || `pending-pdf/${book.slug}.pdf`,
      });
    await createNotification({
      recipient: userId,
      type: 'digital_access_created',
      title: 'Your digital book is ready',
      message: `${book.title} is now available in your BookHub digital library until ${access.expirationTime.toDateString()}. Enjoy your reading session.`,
      link: '/digital-library',
      metadata: { access: access._id, order: orderId },
    });
    accesses.push(access);
  }
  return accesses;
};

module.exports = { createDigitalAccess, digitalAccessPopulate, expireOldDigitalAccess, notifyExpiringDigitalAccess };
