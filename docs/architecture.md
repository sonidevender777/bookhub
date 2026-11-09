# BookHub architecture

## Purpose

BookHub is a single-store bookstore platform designed for students and daily readers. It supports physical and digital book discovery, purchases, rentals, reservations, exact copy locations, and staff administration. The design keeps future multi-branch and production-provider integrations possible without adding them prematurely.

## System overview

```text
React client
  |  HTTPS JSON API
Express server
  |-- Authentication and role authorization
  |-- Catalog, inventory, order, rental, and notification services
  |-- Validation, error handling, audit logging, scheduled business rules
MongoDB
  |-- Operational and customer data
Storage abstraction (future production integration)
  |-- Covers and protected PDF ebook files
```

## Client application

The Vite-powered React client will have separate customer and staff experiences while sharing a consistent design system.

- React Router separates public, customer, and admin routes.
- Redux Toolkit stores authentication, cart, notifications, and other cross-page state.
- Axios uses one configured API client to attach tokens and normalize API errors.
- Tailwind CSS defines responsive design tokens for the BookHub light and dark themes.
- Reusable components provide accessible forms, dialogs, tables, cards, badges, skeletons, empty states, and feedback messages.

## Server application

The Express API is organized by responsibility:

```text
routes -> controllers -> services -> models
                  |          |-> policy and calculation helpers
                  |-> validators
middleware -> authentication, permissions, errors, rate limits
```

Controllers coordinate HTTP requests; services own business rules and database changes. This keeps rules such as copy availability, overdue charges, digital-access expiry, and reservation eligibility out of route files.

## Security boundaries

- Passwords are hashed with bcrypt and never returned by the API.
- JWT-based authentication identifies users; server-side role and ownership checks authorize every protected action.
- Input is validated before services run.
- Errors use safe, consistent responses; stack traces and secrets stay server-side.
- Rate limiting is applied to sensitive endpoints such as authentication.
- Environment variables keep credentials and deployment-specific configuration out of source control.
- Digital PDF access is authorized by the server against an active, unexpired rental. The browser never decides whether access has expired.

## Key domain decisions

### Catalog titles and physical copies

A `Book` describes a title (ISBN, author, cover, pricing, category, format availability). A `BookCopy` represents an individual physical item. Every copy has a QR identifier, condition, operational status, and exact location. A book can therefore have many copies.

### Location hierarchy

One `Location` collection represents the hierarchy. A location points to a parent location and has a type such as `branch`, `floor`, `section`, `rack`, or `shelf`. Physical copies point to a shelf location. This avoids rigid schemas while supporting inventory queries and future branches.

### Rentals and penalties

One `Rental` model serves physical and digital rentals. Its type-specific fields cover a physical copy/return condition or a secure digital access entitlement. The server calculates rental expiration and overdue penalties. BookHub's default late fee is 1% of the book price per overdue day after a configurable grace period.

### Payments and checkout

Orders keep payment state separate from fulfilment state. The first version provides a clearly labelled demo checkout mode and never presents it as real payment processing. A payment-provider adapter can be added later without changing order/rental rules.

### Notifications and automation

Notifications are stored in MongoDB for in-app delivery. Service events create them for orders, rentals, overdue items, expiring digital access, reservations, and low stock. Scheduled processing is abstracted so a production job runner can later be added.

## Roles

| Role | Main capabilities |
| --- | --- |
| Customer | Browse, buy/rent, reserve, review, and manage their own account |
| Inventory Staff | Manage copies, locations, checkouts, returns, and stock condition |
| Manager | Manage catalog, customers, orders, reservations, reports, and staff operations |
| Owner | Full access, including business settings and sensitive adjustments |

## Integration policy

The initial delivery intentionally has no live payment, email, SMS/WhatsApp, or cloud-storage account requirement. Interfaces for each will be designed around environment configuration so that real providers can be introduced cleanly after the demo version is complete.

## Implementation sequence

The next phase defines Mongoose models, relationships, indexes, lifecycle statuses, and integrity rules. It requires approval because it establishes the application’s long-term data contract.
