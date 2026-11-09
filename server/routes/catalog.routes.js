const express = require('express');
const controller = require('../controllers/catalog.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, referenceSchema, bookSchema, updateBookSchema } = require('../validators/catalog.validator');

const router = express.Router();
const manageCatalog = [authenticate, authorize('manager', 'owner')];

router.get('/books', controller.listBooks);
router.get('/books/:slugOrId', controller.getBook);
router.post('/books', ...manageCatalog, validate(bookSchema), controller.createBook);
router.patch('/books/:bookId', ...manageCatalog, validate(updateBookSchema), controller.updateBook);
router.delete('/books/:bookId', ...manageCatalog, controller.archiveBook);

['authors', 'categories', 'publishers'].forEach((type) => {
  router.get(`/${type}`, controller.listReferences(type));
  router.post(`/${type}`, ...manageCatalog, validate(referenceSchema), controller.createReference(type));
  router.patch(`/${type}/:referenceId`, ...manageCatalog, validate(referenceSchema.partial()), controller.updateReference(type));
  router.delete(`/${type}/:referenceId`, ...manageCatalog, controller.archiveReference(type));
});

module.exports = router;
