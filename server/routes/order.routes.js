const express = require('express');
const controller = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate-object-id');
const { validate, addCartItemSchema, updateCartItemSchema, checkoutSchema, updateOrderStatusSchema } = require('../validators/order.validator');

const router = express.Router();

router.use(authenticate);

router.get('/cart', controller.getCart);
router.post('/cart/items', validate(addCartItemSchema), controller.addCartItem);
router.patch('/cart/items/:itemId', validateObjectId('itemId'), validate(updateCartItemSchema), controller.updateCartItem);
router.delete('/cart/items/:itemId', validateObjectId('itemId'), controller.removeCartItem);
router.delete('/cart', controller.clearCart);

router.post('/checkout', validate(checkoutSchema), controller.checkout);
router.get('/orders/me', controller.listMyOrders);

router.get('/admin/orders', authorize('manager', 'owner'), controller.listOrders);
router.patch('/admin/orders/:orderId/status', authorize('manager', 'owner'), validateObjectId('orderId'), validate(updateOrderStatusSchema), controller.updateOrderStatus);

module.exports = router;
