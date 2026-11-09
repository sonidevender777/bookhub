const Notification = require('../models/notification.model');
const ApiError = require('../utils/api-error');

const listMyNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const filter = { recipient: req.user._id };
    if (req.query.includeRead !== 'true') filter.readAt = { $exists: false };
    if (req.query.unread === 'true') filter.readAt = { $exists: false };
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ recipient: req.user._id, readAt: { $exists: false } }),
    ]);
    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id },
      { readAt: new Date() },
      { returnDocument: 'after' },
    );
    if (!notification) throw new ApiError('Notification not found.', 404);
    res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, readAt: { $exists: false } }, { readAt: new Date() });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { listMyNotifications, markNotificationRead, markAllRead };
