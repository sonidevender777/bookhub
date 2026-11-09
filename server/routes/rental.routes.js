const express = require('express');
const controller = require('../controllers/rental.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate-object-id');
const { validate, returnRentalSchema, markRentalIssueSchema } = require('../validators/rental.validator');

const router = express.Router();
const manageRentals = [authenticate, authorize('inventory_staff', 'manager', 'owner')];

router.get('/rentals/me', authenticate, controller.listMyRentals);
router.delete('/rentals/history', authenticate, controller.clearRentalHistory);
router.get('/rentals', ...manageRentals, controller.listRentals);
router.delete('/admin/rentals/history', ...manageRentals, controller.clearRentalHistory);
router.post('/rentals/refresh-overdue', ...manageRentals, controller.refreshOverdue);
router.patch('/rentals/:rentalId/return', ...manageRentals, validateObjectId('rentalId'), validate(returnRentalSchema), controller.returnRental);
router.patch('/rentals/:rentalId/issue', ...manageRentals, validateObjectId('rentalId'), validate(markRentalIssueSchema), controller.markRentalIssue);

module.exports = router;
