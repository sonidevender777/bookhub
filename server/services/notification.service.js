const Notification = require('../models/notification.model');
const User = require('../models/user.model');

const createNotification = (payload) => Notification.create(payload);

const createAdminNotifications = async ({ type, title, message, link, metadata = {} }) => {
  const admins = await User.find({ role: { $in: ['manager', 'owner'] }, accountStatus: 'active' }).select('_id');
  if (!admins.length) return [];
  return Notification.insertMany(
    admins.map((admin) => ({
      recipient: admin._id,
      audience: 'admin',
      type,
      title,
      message,
      link,
      metadata,
    })),
  );
};

module.exports = { createNotification, createAdminNotifications };
