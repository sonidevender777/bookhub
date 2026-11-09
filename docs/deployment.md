# BookHub Deployment Readiness

BookHub is ready for local demonstration and can be deployed as two services:

- Backend API: Node.js/Express service
- Frontend: Vite static React site

For the college demo, keep `DEMO_PAYMENT_MODE=true`. BookHub should not claim live payment success until Razorpay, Stripe, or another real provider is intentionally integrated.

## Recommended demo hosting

### Backend

Use a Node-friendly host such as Render, Railway, or a VPS.

Backend settings:

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health URL | `/api/health` |

### Frontend

Use a static hosting provider such as Vercel, Netlify, or Render Static Site.

Frontend settings:

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |

## Backend environment variables

Set these in the backend hosting dashboard:

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Usually supplied by the host; use `5000` only locally |
| `MONGODB_URI` | MongoDB Atlas connection string for the `bookhub` database |
| `JWT_ACCESS_SECRET` | Long random secret, at least 32 characters |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | Different long random secret, at least 32 characters |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Deployed frontend URL |
| `DEMO_PAYMENT_MODE` | `true` for college demo mode |

Do not put real secrets in GitHub, screenshots, README files, or chat messages.

## Frontend environment variables

Set this in the frontend hosting dashboard:

| Variable | Production value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://your-backend-domain.com/api` |

## MongoDB Atlas checklist

- Keep only required IP addresses in Network Access.
- For a hosted backend, add the backend provider's outbound IP if the provider gives one.
- If the provider does not give a stable outbound IP, temporarily use `0.0.0.0/0` only for demo convenience, then tighten it later.
- Use a database user with the least access needed for the app.
- Rotate any password that was exposed in screenshots or messages.

## Before deployment

From `server/`, verify production environment settings:

```powershell
npm run check:production
```

From `client/`, verify the production build:

```powershell
npm run build
```

From the project root, run the full local check while the backend is running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-project.ps1
```

## After deployment

Open:

- Backend health check: `https://your-backend-domain.com/api/health`
- Frontend app: `https://your-frontend-domain.com`

Then test:

1. Register a customer.
2. Browse books.
3. Add a book to cart.
4. Create a demo checkout order.
5. View payments, notifications, rentals, wishlist, and reservations.
6. Sign in as the seeded owner account if you created it on the deployed database.

## Demo limitations

These are intentionally not production-live yet:

- Real payment gateway charging
- Email/SMS/WhatsApp sending
- Private object storage for protected PDF files
- Advanced admin editing tables for every module

The architecture has safe integration points for these features.
