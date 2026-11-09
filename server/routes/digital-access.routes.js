const express = require('express');
const controller = require('../controllers/digital-access.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate-object-id');

const router = express.Router();

router.get('/digital-access/me', authenticate, controller.listMyDigitalAccess);
router.delete('/digital-access/history', authenticate, controller.clearDigitalHistory);
router.get('/digital-access/:accessId/open', authenticate, validateObjectId('accessId'), controller.openDigitalAccess);
router.get('/admin/digital-access', authenticate, authorize('manager', 'owner'), controller.listDigitalAccess);
router.delete('/admin/digital-access/history', authenticate, authorize('manager', 'owner'), controller.clearDigitalHistory);

module.exports = router;
