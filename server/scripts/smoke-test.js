const assert = require('assert');

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  return { response, data };
};

const expectStatus = (step, actual, expected) => {
  assert.equal(actual, expected, `${step} expected HTTP ${expected}, received HTTP ${actual}`);
};

const expectResponseStatus = (step, result, expected) => {
  assert.equal(
    result.response.status,
    expected,
    `${step} expected HTTP ${expected}, received HTTP ${result.response.status}: ${JSON.stringify(result.data)}`,
  );
};

const run = async () => {
  const health = await request('/health');
  expectResponseStatus('health', health, 200);
  assert.equal(health.data.success, true);

  const books = await request('/books');
  expectResponseStatus('books list', books, 200);
  assert.ok(Array.isArray(books.data.data));
  assert.ok(books.data.data.length > 0);

  const firstBook = books.data.data[0];
  const availability = await request(`/inventory/books/${firstBook._id}/availability`);
  expectResponseStatus('book availability', availability, 200);
  assert.equal(availability.data.success, true);

  const badId = await request('/inventory/books/not-a-real-id/availability');
  expectResponseStatus('bad book id', badId, 400);
  assert.equal(badId.data.message, 'Invalid bookId.');

  const timestamp = Date.now();
  const auth = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Smoke Test Customer',
      email: `smoke.${timestamp}@bookhub.test`,
      password: 'SmokePass123',
    }),
  });
  expectResponseStatus('register customer', auth, 201);
  assert.ok(auth.data.data.accessToken);

  const token = auth.data.data.accessToken;
  const addCart = await request('/cart/items', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ book: firstBook._id, itemType: 'purchase', quantity: 1 }),
  });
  expectResponseStatus('add cart item', addCart, 200);
  assert.equal(addCart.data.data.summary.items.length, 1);

  const checkout = await request('/checkout', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ fulfillmentMethod: 'store_pickup', notes: 'Automated smoke test order.' }),
  });
  expectResponseStatus('checkout', checkout, 201);
  assert.equal(checkout.data.data.payment.status, 'demo_pending');

  const notifications = await request('/notifications/me', {
    headers: { authorization: `Bearer ${token}` },
  });
  expectResponseStatus('notifications', notifications, 200);
  assert.ok(notifications.data.unreadCount >= 1);

  console.info('BookHub smoke tests passed.');
};

run().catch((error) => {
  console.error(`BookHub smoke tests failed: ${error.message}`);
  process.exitCode = 1;
});
