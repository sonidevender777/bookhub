const express = require('express');
const controller = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate-object-id');
const {
  validate,
  branchSchema,
  locationSchema,
  bookCopySchema,
  updateCopySchema,
  moveCopySchema,
} = require('../validators/inventory.validator');

const router = express.Router();
const manageInventory = [authenticate, authorize('inventory_staff', 'manager', 'owner')];

router.get('/branches', controller.listBranches);
router.post('/branches', ...manageInventory, validate(branchSchema), controller.createBranch);

router.get('/locations', controller.listLocations);
router.post('/locations', ...manageInventory, validate(locationSchema), controller.createLocation);

router.get('/inventory/copies', ...manageInventory, controller.listCopies);
router.post('/inventory/copies', ...manageInventory, validate(bookCopySchema), controller.createCopy);
router.patch('/inventory/copies/:copyId', ...manageInventory, validateObjectId('copyId'), validate(updateCopySchema), controller.updateCopy);
router.patch('/inventory/copies/:copyId/move', ...manageInventory, validateObjectId('copyId'), validate(moveCopySchema), controller.moveCopy);

router.get('/inventory/books/:bookId/availability', validateObjectId('bookId'), controller.getBookAvailability);

module.exports = router;
