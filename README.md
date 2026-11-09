# BookHub

BookHub is a full-stack bookstore management platform for a single physical store in Rewari, India. It brings together online discovery, purchases, physical and digital rentals, detailed inventory locations, customer self-service, and staff operations.

## Project status

The project is being built incrementally. The approved architecture is documented in [docs/architecture.md](docs/architecture.md). The approved data contract is in [docs/database-design.md](docs/database-design.md).
Deployment readiness notes are documented in [docs/deployment.md](docs/deployment.md).

## Current setup checklist

- [Done] Product requirements and project defaults
- [Done] High-level system architecture
- [Done] Proposed database design
- [Done] Backend API foundation and health check
- [Done] Authentication API foundation
- [Done] Catalog API foundation and demo seed script
- [Done] MongoDB Atlas connection configured for local development
- [Done] Inventory/location API foundation and demo seed script
- [Done] Customer portal frontend foundation
- [Done] Cart, demo checkout, and order API foundation
- [Done] Physical rental API foundation with due dates and penalties
- [Done] Digital rental API foundation with backend-checked PDF access
- [Done] In-app notification API and customer notification center
- [Done] Reviews, wishlist, and reservations/waitlist foundation
- [Done] Admin dashboard portal foundation
- [Done] Demo payment boundary and payment history foundation
- [Done] Compact security hardening pass
- [Done] Automated smoke test and full project check script
- [Done] UI polish pass with premium bookstore styling and responsive refinements
- [Done] Deployment readiness guide and production environment checker
- [Done] Documentation and cleanup pass
- [Done] Admin add/remove book UI and professional footer update
- [Done] Curated homepage book sections with thumbnails, section browsing, and admin section creation
- [Done] Node.js 20 LTS or later (v24.16.0 verified)
- [Done] npm (v11.13.0 verified)
- [Done] Git (v2.55.0 verified)
- [Done] MongoDB Atlas account and BookHubCluster database access
- [Optional] MongoDB Compass for inspecting development data
- [Optional] GitHub account and remote repository for version control
- [Optional] Cloudinary or compatible object storage for production book covers and protected PDFs
- [Optional] Email/SMS provider credentials; notifications will begin as in-app demo data

## Planned technology stack

- Client: React, Vite, React Router, Tailwind CSS, Redux Toolkit, Axios
- Server: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- Quality and security: ESLint, validation, centralized error handling, role-based access control, rate limiting

## Demo scope

BookHub will include realistic seeded demo data and a labelled demonstration checkout flow. It will not connect to a live payment gateway until one is intentionally configured.

## Quick Local Demo

Open two terminals.

Terminal 1 — backend:

```powershell
cd "C:\Users\Admin\Desktop\Book Store\server"
npm run dev
```

Terminal 2 — frontend:

```powershell
cd "C:\Users\Admin\Desktop\Book Store\client"
npm run dev
```

Then open:

```text
http://localhost:5173
```

If the database is empty, seed demo data from the backend folder:

```powershell
npm run seed
npm run seed:inventory
npm run seed:admin
```

Demo owner account:

| Email | Password |
| --- | --- |
| `owner@bookhub.test` | `OwnerPass123` |

For customer testing, create a new account from the Register page.

## Environment variables

Copy `server/.env.example` to `server/.env` before connecting to a database. Never commit the resulting `.env` file.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode: use `development` locally and `production` when deployed. |
| `PORT` | Local API port; BookHub defaults to `5000`. |
| `MONGODB_URI` | MongoDB connection string for the BookHub database. |
| `JWT_ACCESS_SECRET` | Long random secret used to sign short-lived access tokens. |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime; default `15m`. |
| `JWT_REFRESH_SECRET` | Different long random secret for refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime; default `7d`. |
| `CLIENT_URL` | Client address permitted by API CORS, normally `http://localhost:5173`. |
| `DEMO_PAYMENT_MODE` | Keeps checkout visibly in non-production demo mode. |
| `VITE_API_BASE_URL` | Client-side API base URL, set in `client/.env`. |

## Authentication API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a customer account. |
| `POST` | `/api/auth/login` | Sign in and receive an access token plus secure refresh cookie. |
| `POST` | `/api/auth/refresh` | Rotate a valid refresh session and obtain a new access token. |
| `POST` | `/api/auth/logout` | End the current refresh session. |
| `GET` | `/api/auth/me` | Get the authenticated user profile. |
| `PATCH` | `/api/auth/me` | Update the authenticated user profile. |
| `PATCH` | `/api/auth/change-password` | Change the current user's password. |
| `POST` | `/api/auth/forgot-password` | Safely request a password reset. |
| `POST` | `/api/auth/reset-password` | Reset a password with a valid one-hour token. |

## Catalog API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/books` | Search and filter the active catalog. Supports `q`, `category`, `author`, `publisher`, `genre`, `format`, `featured`, `sort`, `page`, and `limit`. |
| `GET` | `/api/books/:slugOrId` | Get a public book detail record. |
| `GET` | `/api/authors`, `/api/categories`, `/api/publishers` | Get active catalog filters. |
| `POST/PATCH/DELETE` | `/api/books` | Manager/owner catalog creation, update, and archive operations. |
| `POST/PATCH/DELETE` | `/api/authors`, `/api/categories`, `/api/publishers` | Manager/owner reference-data management. |

After configuring MongoDB, run `npm run seed` in `server/` to create the BookHub demo catalog. The script is safe to run again; it updates the same demo ISBN records rather than duplicating them.

## Inventory and Location API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/branches` | List active bookstore branches. |
| `GET` | `/api/locations` | List active shelf/rack locations. Supports `branch` and `q`. |
| `GET` | `/api/inventory/books/:bookId/availability` | Public physical-copy availability summary for a book. |
| `GET` | `/api/inventory/copies` | Staff inventory copy list. Supports `book`, `branch`, `location`, `status`, `q`, `page`, and `limit`. |
| `POST` | `/api/branches` | Inventory staff/manager/owner branch creation. |
| `POST` | `/api/locations` | Inventory staff/manager/owner location creation. |
| `POST` | `/api/inventory/copies` | Inventory staff/manager/owner physical-copy creation. |
| `PATCH` | `/api/inventory/copies/:copyId` | Update copy status or condition. |
| `PATCH` | `/api/inventory/copies/:copyId/move` | Move a physical copy to another shelf/rack location. |

Run `npm run seed:inventory` in `server/` after `npm run seed` to create the demo Rewari branch, four shelf locations, and 20 physical copies. The copy-location hierarchy follows: branch -> floor -> section -> rack -> shelf -> physical copy.

## Customer Portal

The customer frontend runs from `client/` with Vite.

| Page | Route | Purpose |
| --- | --- | --- |
| Home | `/` | BookHub landing experience with curated book sections, featured catalog, and rental highlights. |
| Sections | `/sections/:slug` | Browse books inside a specific section such as Fiction, Science Fiction, or Academic & Study. |
| Catalog | `/books` | Search, section filter, format filter, sorting, and responsive book cards. |
| Book details | `/books/:slugOrId` | Purchase/rental pricing, ISBN, publication info, and live physical-copy availability. |
| Login | `/login` | Customer sign-in screen prepared for backend auth integration. |
| Register | `/register` | Customer account creation screen prepared for backend auth integration. |
| Cart | `/cart` | Authenticated cart, totals, quantity updates, item removal, and demo order creation. |
| Digital library | `/digital-library` | Signed-in customer's active and expired digital PDF rentals. |
| Notifications | `/notifications` | Signed-in customer's order, rental, overdue, return, and digital access updates. |
| Wishlist | `/wishlist` | Saved books with move-to-cart support. |
| Reservations | `/reservations` | Customer waitlist reservations for unavailable physical books. |
| Admin dashboard | `/admin` | Owner/manager dashboard with live bookstore metrics and management entry points. |
| Payments | `/payments` | Customer demo payment history with explicit non-live payment status. |

Run `npm run dev` in `client/` and open `http://localhost:5173`. Keep the backend running from `server/` so live book and availability data can load from MongoDB Atlas.

## Cart and Orders API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/cart` | Get the signed-in customer's cart and calculated totals. |
| `POST` | `/api/cart/items` | Add a purchase, physical rental, or digital rental item. |
| `PATCH` | `/api/cart/items/:itemId` | Update item quantity. |
| `DELETE` | `/api/cart/items/:itemId` | Remove one cart item. |
| `DELETE` | `/api/cart` | Clear the cart. |
| `POST` | `/api/checkout` | Create a demo order and empty the cart. No real payment is charged. |
| `GET` | `/api/orders/me` | Get the signed-in customer's order history. |
| `GET` | `/api/admin/orders` | Manager/owner order list. |
| `PATCH` | `/api/admin/orders/:orderId/status` | Manager/owner order status update. |

## Physical Rentals API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/rentals/me` | Get the signed-in customer's physical rental history. |
| `GET` | `/api/rentals` | Inventory staff/manager/owner rental list. Supports `status` and `user`. |
| `POST` | `/api/rentals/refresh-overdue` | Recalculate overdue statuses and outstanding penalties. |
| `PATCH` | `/api/rentals/:rentalId/return` | Staff return workflow with condition-after-return capture. |
| `PATCH` | `/api/rentals/:rentalId/issue` | Staff mark-as-lost or mark-as-damaged workflow. |

Physical rental checkout now claims available book copies and creates `Rental` records. The default penalty rule is 1% of the book price per overdue day after a one-day grace period. Lost or damaged copies can be charged at the full book price.

Run `npm run seed:overdue` in `server/` only when you intentionally want one overdue demo rental for presentation/testing.

## Digital Rentals API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/digital-access/me` | Get the signed-in customer's digital rentals. |
| `GET` | `/api/digital-access/:accessId/open` | Backend-check active access before returning demo reader metadata. |
| `GET` | `/api/admin/digital-access` | Manager/owner digital access list. Supports `status` and `user`. |

Digital rental checkout creates `DigitalAccess` records with start time, expiration time, price, format, and status. The backend expires old access records and refuses expired access. Production PDF files should live in private object storage and be served through short-lived signed URLs; BookHub currently uses a safe demo reader response without exposing permanent file URLs.

## Notifications API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/notifications/me` | Get the signed-in customer's notifications and unread count. |
| `PATCH` | `/api/notifications/:notificationId/read` | Mark one notification as read. |
| `PATCH` | `/api/notifications/read-all` | Mark all signed-in customer notifications as read. |

BookHub currently supports in-app notifications for demo reliability. The notification service is intentionally centralized so email, SMS, or WhatsApp providers can be added later without rewriting order/rental logic.

## Reviews, Wishlist, and Reservations API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/wishlist/me` | Get the signed-in customer's wishlist. |
| `POST` | `/api/wishlist` | Add a book to wishlist. |
| `DELETE` | `/api/wishlist/:bookId` | Remove a book from wishlist. |
| `GET` | `/api/books/:bookId/reviews` | Public visible reviews for a book. |
| `POST` | `/api/reviews` | Create/update a verified customer review after purchase or rental activity. |
| `PATCH` | `/api/admin/reviews/:reviewId/moderation` | Manager/owner hide or show a review. |
| `GET` | `/api/reservations/me` | Get signed-in customer's reservations. |
| `POST` | `/api/reservations` | Join the waitlist when no physical copy is available. |
| `PATCH` | `/api/reservations/:reservationId/cancel` | Cancel a waiting/notified reservation. |

Reviews are restricted to customers with matching purchase, physical rental, or digital rental activity. Reservations keep a queue position and can later trigger availability notifications.

## Admin Portal

Run `npm run seed:admin` in `server/` to create the demo owner account.

| Demo owner login | Value |
| --- | --- |
| Email | `owner@bookhub.test` |
| Password | `OwnerPass123` |

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/dashboard` | Owner/manager dashboard metrics, recent orders, recent rentals, and low-stock books. |
| `GET` | `/api/admin/customers` | Owner/manager customer list. |

The admin portal currently focuses on dashboard visibility and management entry points. Detailed edit screens for books, copies, rentals, orders, and reviews use the APIs already created and will be expanded during the admin UI polish pass.

The Inventory tab includes an owner-facing form to add a book with author, category, price, rental rules, branch, shelf location, and physical copy count. Owners can also remove/archive books from the public catalog.

## Demo Payment Boundary

BookHub does not fake successful payments. Checkout creates an order and a separate `Payment` record with provider `demo`, mode `demo`, and status `demo_pending`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/payments/me` | Get signed-in customer's demo payment records. |
| `GET` | `/api/admin/payments` | Manager/owner payment list. |

When a real payment gateway is added later, the payment service is the correct integration point. Until then, checkout remains clearly marked as demo mode in the API, database, cart page, and payment history page.

## Security Notes

BookHub currently includes JWT authentication, password hashing, role-based authorization, request rate limiting, Helmet security headers, CORS restrictions, request IDs, centralized error handling, MongoDB operator sanitization, ObjectId route validation, and production startup checks for required secrets.

Never commit `server/.env`. If any database password is exposed during demo setup, rotate it in MongoDB Atlas and update `server/.env`.

## Testing and Project Checks

Keep the backend running from `server/` before running API smoke tests:

```powershell
npm run dev
```

From another terminal, run backend smoke tests:

```powershell
cd server
npm test
```

To run the main project verification script from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-project.ps1
```

The project check runs the backend smoke test, frontend lint check, and frontend production build. Current frontend lint output contains warnings only; there are no blocking test or build errors.

## UI Polish Notes

The interface now uses a warmer premium bookstore design system with rounded cards, richer shadows, improved light/dark themes, stronger homepage storytelling, polished book cards, clearer navigation states, responsive metric panels, and improved mobile menu behavior.

## Deployment Readiness

BookHub is structured for two-service deployment:

- Backend API from `server/`
- Frontend static site from `client/`

Read [docs/deployment.md](docs/deployment.md) before deploying. It includes hosting settings, environment variables, MongoDB Atlas checklist, demo limitations, and post-deployment checks.

Backend production environment settings can be checked with:

```powershell
cd server
npm run check:production
```

For the college demo, keep `DEMO_PAYMENT_MODE=true`. Real payment charging, email/SMS sending, and private PDF object storage are intentionally documented as future production integrations.

## Planned phases

1. Requirements — complete
2. Architecture — complete
3. Database design — complete
4. Project initialization — complete
5. Backend foundation — complete
6. Authentication — complete
7. Catalog — complete
8. Inventory and locations — complete
9. Customer portal — complete
10. Cart, checkout, and orders — complete
11. Physical rentals — complete
12. Digital rentals — complete
13. Notifications — complete
14. Reviews, wishlist, and reservations — complete
15. Admin portal — complete
16. Demo payment boundary — complete
17. Security hardening — complete
18. Testing — complete
19. UI polish — complete
20. Deployment readiness — complete
21. Documentation and cleanup — complete
