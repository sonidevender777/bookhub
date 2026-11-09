const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const catalogRoutes = require('./catalog.routes');
const inventoryRoutes = require('./inventory.routes');
const orderRoutes = require('./order.routes');
const rentalRoutes = require('./rental.routes');
const digitalAccessRoutes = require('./digital-access.routes');
const notificationRoutes = require('./notification.routes');
const engagementRoutes = require('./engagement.routes');
const adminRoutes = require('./admin.routes');
const paymentRoutes = require('./payment.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/', engagementRoutes);
router.use('/', catalogRoutes);
router.use('/', inventoryRoutes);
router.use('/', orderRoutes);
router.use('/', rentalRoutes);
router.use('/', digitalAccessRoutes);
router.use('/', notificationRoutes);
router.use('/', adminRoutes);
router.use('/', paymentRoutes);

module.exports = router;
