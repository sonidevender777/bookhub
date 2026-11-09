const express = require('express');
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate-object-id');

const router = express.Router();

router.get('/notifications/me', authenticate, controller.listMyNotifications);
router.patch('/notifications/:notificationId/read', authenticate, validateObjectId('notificationId'), controller.markNotificationRead);
router.patch('/notifications/read-all', authenticate, controller.markAllRead);

module.exports = router;
