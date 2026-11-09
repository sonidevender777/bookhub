import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

export const catalogApi = {
  listBooks: (params = {}) => api.get('/books', { params }).then((response) => response.data),
  getBook: (slugOrId) => api.get(`/books/${slugOrId}`).then((response) => response.data),
  getAvailability: (bookId) => api.get(`/inventory/books/${bookId}/availability`).then((response) => response.data),
  listCategories: () => api.get('/categories').then((response) => response.data),
  listAuthors: () => api.get('/authors').then((response) => response.data),
  listPublishers: () => api.get('/publishers').then((response) => response.data),
}

export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then((response) => response.data),
  register: (payload) => api.post('/auth/register', payload).then((response) => response.data),
  me: (token) => api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  logout: () => api.post('/auth/logout').then((response) => response.data),
}

export const orderApi = {
  getCart: (token) => api.get('/cart', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  addCartItem: (token, payload) =>
    api.post('/cart/items', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  updateCartItem: (token, itemId, payload) =>
    api.patch(`/cart/items/${itemId}`, payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  removeCartItem: (token, itemId) =>
    api.delete(`/cart/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  checkout: (token, payload) =>
    api.post('/checkout', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  myOrders: (token) => api.get('/orders/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
}

export const rentalApi = {
  myRentals: (token) => api.get('/rentals/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  clearHistory: (token) => api.delete('/rentals/history', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
}

export const digitalAccessApi = {
  mine: (token) => api.get('/digital-access/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  clearHistory: (token) => api.delete('/digital-access/history', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  open: (token, accessId) =>
    api.get(`/digital-access/${accessId}/open`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
}

export const notificationApi = {
  mine: (token, params = {}) =>
    api.get('/notifications/me', { params, headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  markRead: (token, notificationId) =>
    api.patch(`/notifications/${notificationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  markAllRead: (token) =>
    api.patch('/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
}

export const engagementApi = {
  wishlist: (token) => api.get('/wishlist/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  addWishlist: (token, book) =>
    api.post('/wishlist', { book }, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  removeWishlist: (token, bookId) =>
    api.delete(`/wishlist/${bookId}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  reviews: (bookId) => api.get(`/books/${bookId}/reviews`).then((response) => response.data),
  createReview: (token, payload) =>
    api.post('/reviews', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  reservations: (token) => api.get('/reservations/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  reserve: (token, book) =>
    api.post('/reservations', { book }, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  cancelReservation: (token, reservationId) =>
    api.patch(`/reservations/${reservationId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
}

export const adminApi = {
  dashboard: (token) => api.get('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  customers: (token) => api.get('/admin/customers', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  books: (token) => api.get('/admin/books', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  openBook: (token, bookId) => api.get(`/admin/books/${bookId}/open`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  orders: (token) => api.get('/admin/orders', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  updateOrderStatus: (token, orderId, payload) =>
    api.patch(`/admin/orders/${orderId}/status`, payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  rentals: (token) => api.get('/rentals', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  clearRentalHistory: (token) => api.delete('/admin/rentals/history', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  copies: (token) => api.get('/inventory/copies', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  digitalAccess: (token) => api.get('/admin/digital-access', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  clearDigitalHistory: (token) => api.delete('/admin/digital-access/history', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  createBook: (token, payload) => api.post('/books', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  archiveBook: (token, bookId) => api.delete(`/books/${bookId}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  createAuthor: (token, payload) => api.post('/authors', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  createCategory: (token, payload) => api.post('/categories', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  branches: (token) => api.get('/branches', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  createBranch: (token, payload) => api.post('/branches', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  locations: (token) => api.get('/locations', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  createLocation: (token, payload) => api.post('/locations', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  createCopy: (token, payload) => api.post('/inventory/copies', payload, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
}

export const paymentApi = {
  mine: (token) => api.get('/payments/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  clear: (token, paymentId) => api.delete(`/payments/${paymentId}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  clearAll: (token) => api.delete('/payments', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
  admin: (token) => api.get('/admin/payments', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.data),
}

export default api
