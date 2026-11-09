const Book = require('../models/book.model');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const ApiError = require('../utils/api-error');
const { createDigitalAccess } = require('../services/digital-access.service');
const { createAdminNotifications, createNotification } = require('../services/notification.service');
const { createDemoPayment } = require('../services/payment.service');
const { createPhysicalRental } = require('../services/rental.service');

const populateCart = (query) =>
  query.populate('items.book', '+digitalAssetKey title slug isbn13 purchasePrice physicalRental digitalRental physicalEnabled digitalEnabled digitalFormat cover');

const getOrCreateCart = async (userId) => {
  const cart = await populateCart(Cart.findOne({ user: userId }));
  if (cart) return cart;
  return Cart.create({ user: userId, items: [] });
};

const getPriceForItem = (book, itemType) => {
  if (itemType === 'purchase') return { price: book.purchasePrice, durationDays: undefined };
  if (itemType === 'physical_rental') {
    if (!book.physicalEnabled || !book.physicalRental?.enabled) throw new ApiError(`${book.title} is not available for physical rental.`, 422);
    return { price: book.physicalRental.price || 0, durationDays: book.physicalRental.durationDays };
  }
  if (!book.digitalEnabled || !book.digitalRental?.enabled) throw new ApiError(`${book.title} is not available for digital rental.`, 422);
  return { price: book.digitalRental.price || 0, durationDays: book.digitalRental.durationDays };
};

const summarizeCart = (cart) => {
  const items = cart.items.map((item) => {
    const { price, durationDays } = getPriceForItem(item.book, item.itemType);
    const lineTotal = price * item.quantity;
    return {
      _id: item._id,
      book: item.book,
      itemType: item.itemType,
      quantity: item.quantity,
      unitPrice: price,
      rentalDurationDays: durationDays,
      lineTotal,
    };
  });
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  return { items, totals: { subtotal, discountTotal: 0, taxTotal: 0, grandTotal: subtotal } };
};

const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.status(200).json({ success: true, data: { cart, summary: summarizeCart(cart) } });
  } catch (error) {
    next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.validatedBody.book, isActive: true, isArchived: false });
    if (!book) throw new ApiError('Book not found.', 404);
    getPriceForItem(book, req.validatedBody.itemType);

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find((item) => String(item.book._id || item.book) === String(book._id) && item.itemType === req.validatedBody.itemType);
    if (existing) existing.quantity = Math.min(existing.quantity + req.validatedBody.quantity, 20);
    else cart.items.push(req.validatedBody);
    await cart.save();
    await populateCart(cart);
    res.status(200).json({ success: true, data: { cart, summary: summarizeCart(cart) } });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) throw new ApiError('Cart item not found.', 404);
    item.quantity = req.validatedBody.quantity;
    await cart.save();
    await populateCart(cart);
    res.status(200).json({ success: true, data: { cart, summary: summarizeCart(cart) } });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items.pull(req.params.itemId);
    await cart.save();
    await populateCart(cart);
    res.status(200).json({ success: true, data: { cart, summary: summarizeCart(cart) } });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.status(200).json({ success: true, data: { cart, summary: summarizeCart(cart) } });
  } catch (error) {
    next(error);
  }
};

const checkout = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    if (!cart.items.length) throw new ApiError('Your cart is empty.', 422);
    const summary = summarizeCart(cart);
    const orderNumber = `BH-${Date.now().toString(36).toUpperCase()}`;
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      fulfillmentMethod: req.validatedBody.fulfillmentMethod,
      address: req.validatedBody.address || {},
      notes: req.validatedBody.notes,
      items: summary.items.map((item) => ({
        book: item.book._id,
        title: item.book.title,
        itemType: item.itemType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        rentalDurationDays: item.rentalDurationDays,
        lineTotal: item.lineTotal,
      })),
      ...summary.totals,
    });
    const payment = await createDemoPayment({ order, user: req.user._id });
    const rentals = [];
    for (const item of summary.items.filter((cartItem) => cartItem.itemType === 'physical_rental')) {
      const createdRentals = await createPhysicalRental({
        userId: req.user._id,
        orderId: order._id,
        book: item.book,
        quantity: item.quantity,
        rentalPrice: item.unitPrice,
        durationDays: item.rentalDurationDays,
      });
      rentals.push(...createdRentals);
    }
    const digitalAccess = [];
    for (const item of summary.items.filter((cartItem) => cartItem.itemType === 'digital_rental')) {
      const createdAccess = await createDigitalAccess({
        userId: req.user._id,
        orderId: order._id,
        book: item.book,
        quantity: item.quantity,
        price: item.unitPrice,
        durationDays: item.rentalDurationDays,
      });
      digitalAccess.push(...createdAccess);
    }
    const totalBooks = summary.items.reduce((total, item) => total + item.quantity, 0);
    const itemPreview = summary.items
      .slice(0, 3)
      .map((item) => `${item.quantity} × ${item.book.title}`)
      .join(', ');
    const remainingItems = summary.items.length > 3 ? ` and ${summary.items.length - 3} more item${summary.items.length - 3 > 1 ? 's' : ''}` : '';
    await createNotification({
      recipient: req.user._id,
      type: 'order_created',
      title: 'Your Book Hub order is confirmed',
      message: `Order ${order.orderNumber} has been placed for ${totalBooks} book${totalBooks > 1 ? 's' : ''}. Items: ${itemPreview}${remainingItems}. Your payment record is now available in Payment History.`,
      link: '/payments',
      metadata: { order: order._id, orderNumber: order.orderNumber },
    });
    await createAdminNotifications({
      type: 'order_created',
      title: 'New order received',
      message: `${req.user.fullName} placed order ${order.orderNumber} for ${totalBooks} book${totalBooks > 1 ? 's' : ''}, total ₹${summary.totals.grandTotal}. Items: ${itemPreview}${remainingItems}. Review it from the owner dashboard.`,
      link: '/admin',
      metadata: { order: order._id, orderNumber: order.orderNumber, customer: req.user._id },
    });
    cart.items = [];
    await cart.save();
    res.status(201).json({
      success: true,
      message: 'Order placed successfully. Payment record created for owner review.',
      data: { order, payment, rentals, digitalAccess },
    });
  } catch (error) {
    next(error);
  }
};

const listMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const listOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'fullName email').sort({ createdAt: -1 }).limit(100).lean();
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('user', 'fullName email');
    if (!order) throw new ApiError('Order not found.', 404);
    const previousStatus = order.orderStatus;
    order.set(req.validatedBody);
    await order.save();
    if (req.validatedBody.orderStatus === 'confirmed' && previousStatus !== 'confirmed') {
      await createNotification({
        recipient: order.user._id,
        type: 'order_confirmed',
        title: 'Your order is confirmed',
        message: `Great news — Book Hub has accepted order ${order.orderNumber}. Your books are now confirmed and the store team will prepare the next step.`,
        link: '/payments',
        metadata: { order: order._id, orderNumber: order.orderNumber },
      });
    }
    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addCartItem, updateCartItem, removeCartItem, clearCart, checkout, listMyOrders, listOrders, updateOrderStatus };
