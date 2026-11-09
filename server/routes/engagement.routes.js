const express = require('express');
const controller = require('../controllers/engagement.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate-object-id');
const { validate, bookActionSchema, reviewSchema, updateReviewModerationSchema } = require('../validators/engagement.validator');

const router = express.Router();

router.get('/wishlist/me', authenticate, controller.listWishlist);
router.post('/wishlist', authenticate, validate(bookActionSchema), controller.addWishlist);
router.delete('/wishlist/:bookId', authenticate, validateObjectId('bookId'), controller.removeWishlist);

router.get('/books/:bookId/reviews', validateObjectId('bookId'), controller.listReviews);
router.post('/reviews', authenticate, validate(reviewSchema), controller.createReview);
router.patch('/admin/reviews/:reviewId/moderation', authenticate, authorize('manager', 'owner'), validateObjectId('reviewId'), validate(updateReviewModerationSchema), controller.moderateReview);

router.get('/reservations/me', authenticate, controller.listMyReservations);
router.post('/reservations', authenticate, validate(bookActionSchema), controller.createReservation);
router.patch('/reservations/:reservationId/cancel', authenticate, validateObjectId('reservationId'), controller.cancelReservation);

module.exports = router;
