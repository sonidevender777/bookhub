# BookHub database design

## Design goals

- Keep catalog information separate from individual physical stock.
- Preserve accurate order, rental, and penalty history even if book details later change.
- Enforce the business rules on the server, never in the browser alone.
- Support one store now without preventing later branch expansion.

## Core models

### User

Stores customer and staff accounts.

- Identity: name, email, phone, password hash, avatar
- Access: role (`customer`, `inventory_staff`, `manager`, `owner`), account status
- Customer profile: default addresses, notification preferences
- Security: password-reset token hash and expiry, refresh-token/session metadata
- Indexes: unique email; optional unique sparse phone; role and account-status index

### Author, Category, Publisher

Small, reusable catalog reference models.

- Name, URL-friendly slug, description, image where appropriate, active flag
- Indexes: unique normalized name and unique slug

### Book

The catalog record for a title. It does not represent a specific physical item.

- Identification: title, subtitle, ISBN-10/ISBN-13, slug
- Metadata: authors, publisher, categories, genres, language, publication date, page count, description, cover
- Commercial settings: sale price, physical-rental enabled/price/duration override, digital-rental enabled/price/duration override
- Availability: physical and digital enabled flags; derived physical availability comes from `BookCopy` records
- Digital asset metadata: protected-storage key, file type (`pdf` initially), not a permanent public URL
- Discovery: featured, tags, popularity counters, average rating, review count
- Indexes: unique sparse ISBN-13; unique slug; text index across title, ISBN, and searchable helper fields; category, author, publisher, and availability indexes

### Location

Represents the physical hierarchy with one self-referencing collection.

- Name, type (`branch`, `floor`, `section`, `rack`, `shelf`)
- `parentLocation` links it to its parent; a shelf is the assignable destination for a copy
- Optional code and notes; active flag
- Indexes: parent + name unique; type + parent; code unique when present

The seeded hierarchy is: **Book Hub, Rewari → Ground Floor → Fiction → Rack A4 → Shelf 3**.

### BookCopy

Represents one physical item available for sale or lending.

- Links: book and current shelf location
- Identity: immutable QR code / inventory code
- Operational status: `available`, `reserved`, `rented`, `sold`, `damaged`, `lost`, `archived`
- Condition: `new`, `good`, `fair`, `poor`, with condition notes
- Acquisition cost, received date, optional purchase source
- Location/movement history is captured in `AuditLog` rather than duplicating it in every copy document
- Indexes: unique QR code; book + status; location + status

### Cart

One active cart per customer.

- User and a list of items
- Item type: physical purchase, physical rental, or digital rental
- A book reference; physical rental requests can be assigned a copy only during staff fulfilment
- Snapshotted unit price and requested rental duration
- Index: unique user

### Order

Captures customer purchase orders and the commercial audit trail.

- Customer, generated human-readable order number, items, totals, delivery/pickup details
- Each item snapshots title, cover, pricing, quantity, and fulfilment information
- Order status: `pending`, `confirmed`, `processing`, `ready_for_pickup`, `completed`, `cancelled`, `refunded`
- Payment status: `not_required`, `demo_pending`, `demo_paid`, `refunded`
- Demo payment is explicitly labelled and does not represent a real transaction
- Indexes: unique order number; customer + created date; order status + created date

### Rental

One collection for both physical and digital rentals; `rentalType` determines applicable fields.

- Shared: user, book, rental number, price snapshot, start/due/return timestamps, status, business-rule snapshots
- Physical: book-copy reference, checkout/return condition, condition notes, checked-out/returned-by staff members
- Digital: secure asset entitlement reference and access expiration timestamp
- Status: `pending`, `active`, `returned`, `overdue`, `expired`, `lost`, `damaged`, `cancelled`
- Financials: penalty amount, penalty status, penalty reason
- Indexes: unique rental number; user + status; book-copy + status; due date + status; digital expiry + status

Only one active or overdue physical rental may exist for a physical copy. The service layer checks and updates this inside a database transaction where available.

### Reservation

Represents a queue entry for a title when no eligible physical copy is available.

- User, book, queue position, status, created date, availability-notified date, claim expiry
- Status: `waiting`, `notified`, `fulfilled`, `expired`, `cancelled`
- Indexes: book + status + created date; user + book + status

Queue position is calculated from waiting entries rather than permanently trusted. When a copy becomes available, the earliest eligible customer is notified and gets a 48-hour claim period.

### Review

- User, book, rating (1–5), written content, moderation status, timestamps
- Eligibility is checked against completed orders or completed/active rentals for that same book
- Status: `published`, `hidden`, `removed`
- Indexes: unique user + book; book + status + created date

Book rating averages and counts are denormalized onto `Book` and recalculated by the review service whenever a visible review changes.

### Wishlist

One document per user with unique book references.

- User, ordered book list, timestamps
- Index: unique user

### Notification

An in-app message generated by business events.

- Recipient, type, title, message, related entity reference, read status, metadata
- Types include order, rental, overdue, penalty, digital expiry, reservation, low stock, and account events
- Indexes: recipient + read status + created date; type + created date

### Settings

Singleton owner-managed business configuration.

- Store identity, currency (`INR`), rental defaults, grace period, daily penalty percentage (default 1), reservation claim duration (default 48 hours)
- Store hours, enabled feature flags, low-stock threshold, demo-payment toggle
- Index: singleton key unique

### AuditLog

Append-only record of sensitive staff and system actions.

- Actor (staff or system), action, entity type/id, before/after summary, reason, timestamp
- Examples: copy moved, condition adjusted, rental returned, penalty waived, order refunded, role changed
- Indexes: entity type + entity id + timestamp; actor + timestamp; action + timestamp

## Relationship map

```text
Author / Category / Publisher
              └── Book ──< BookCopy >── Location
                 ├──< Review >── User
                 ├──< Reservation >── User
                 ├──< Rental >── User
                 ├──< Cart item >── User
                 └──< Order item >── Order ── User

User ──< Notification
User ──< AuditLog (staff/system actions)
```

## Consistency rules

1. A copy can be sold, rented, or reserved only if its status permits that transition.
2. Checkout reserves stock before an order is confirmed; cancelled or expired work releases it.
3. Returning a physical rental marks its copy available, damaged, or lost according to the return assessment.
4. An overdue rental is identified by server-side date comparisons. The daily fee is calculated from the stored book-price snapshot, not a later edited price.
5. Digital content access requires an authenticated user and a matching active rental whose expiry is still in the future.
6. Reservations are title-level. Staff allocate an eligible available copy only when the reservation is claimed.
7. Orders and rentals snapshot prices and key item details so historical records remain correct after catalog edits.
8. Staff-only actions require a role permission check and create an audit log where material.

## Items intentionally deferred

- Supplier and purchase-order models
- Live payment transaction records
- Multi-branch transfers
- External delivery tracking
- Email/SMS provider delivery records

These can be added without changing the core title/copy, order, rental, and customer models.
