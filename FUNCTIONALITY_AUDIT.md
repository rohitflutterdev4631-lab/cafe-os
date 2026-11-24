# Nord Cafe — Functionality Audit & Architecture Assessment

## 1. System Overview & Core Capabilities

Nord Cafe is built as a cloud-native, multi-tenant digital cafe menu platform. It was audited across all business rules, data pipelines, security controls, and hardware integrations.

```
                    ┌─────────────────────────┐
                    │    PostgreSQL 16 DB     │
                    │  (Prisma ORM, 25 Models)│
                    └────────────┬────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     │                                                       │
┌────┴────────────────────────┐             ┌────────────────┴────────────┐
│   Super Admin & Platform    │             │   Multi-Tenant Cafe Pods    │
│  - MRR & Growth Analytics   │             │  - Menu & Category Catalog  │
│  - Assisted Onboarding      │             │  - Table Mapping & QRs      │
│  - Tier Entitlements        │             │  - Live Order Flow & KDS    │
└─────────────────────────────┘             └───────────────┬─────────────┘
                                                            │
                                            ┌───────────────┴─────────────┐
                                            │     Customer Touchpoints    │
                                            │  - Instant Web QR Menu      │
                                            │  - Cart & Price Validation  │
                                            │  - Live Status Tracker      │
                                            └─────────────────────────────┘
```

---

## 2. Deep-Dive Functional Analysis by Domain

### 2.1 Multi-Tenant Data Isolation & Security
- **Data Model**: Every cafe record has a unique UUID `id` and sanitized `slug`. All subordinate entities (`Category`, `MenuItem`, `DiningTable`, `QRCode`, `Order`, `UserRole`) enforce `cafeId` foreign key relationships with `onDelete: Cascade`.
- **Query Sandboxing**: All dashboard API handlers (`/api/v1/menu-items`, `/api/v1/orders`, `/api/v1/tables`, `/api/v1/analytics/overview`) extract the tenant context from the verified JWT payload (`req.user.cafeId`). No client can pass an arbitrary `cafeId` to query or mutate another restaurant's data.
- **Cross-Tenant Verification**: Automated unit test (`tests/platform.test.ts`, Test 1) validates that dishes belonging to `nordic-roast` never cross-contaminate `matcha-lab`.

### 2.2 Authentication & Role-Based Access Control (RBAC)
- **Password Security**: Passwords are encrypted using `bcryptjs` with salt rounds = 10 (`$2a$10$...`).
- **Session Tokens**: Implemented with `jose` using standard HS256 JWTs stored in HTTP-only, SameSite cookies (`nord_session_token`).
- **Role Hierarchy**:
  1. `SUPER_ADMIN`: Unrestricted platform access across all tenants.
  2. `ADMIN_STAFF`: Customer success, assisted onboarding, and support.
  3. `CAFE_OWNER`: Complete ownership of assigned cafe, billing, staff, and configuration.
  4. `CAFE_MANAGER`: Operational access to live orders, dining tables, and catalog updates.
  5. `KITCHEN_STAFF`: Scoped exclusively to the Kitchen Display System (`/kitchen`).
  6. `CUSTOMER`: Anonymous or identified session browsing menus and placing orders.

### 2.3 QR Code Generation & Routing Engine
- **Engine**: Generates base64 data URLs via `qrcode` with Error Correction Level `M` (15% redundancy).
- **Permanent Indirection**: QR tokens (`/qr/[token]`) route through `/api/v1/public/qr/[token]`. This logs scan analytics (`scanCount`, `lastScannedAt`) and returns an HTTP 302 redirect to the destination menu URL:
  - `CAFE_GENERAL`: `/c/[slug]`
  - `TABLE`: `/c/[slug]?table=[tableNumber]`
  - `TAKEAWAY`: `/c/[slug]?type=TAKEAWAY`
- **Tent Card Generator**: Print layout formatted for 4x6" tent cards with clear visual hierarchy, table number header, scan instruction, and branding footer.

### 2.4 Server-Side Order Pricing & Integrity
- **Price Tampering Protection**: Client-side cart item prices are treated as untrusted hints. The backend order creation handler (`/api/v1/public/c/[slug]/orders`):
  1. Looks up each `menuItemId` from PostgreSQL.
  2. Verifies variant price if a variant is selected.
  3. Verifies add-on option prices from the database.
  4. Calculates line item subtotal: `(basePrice + sum(addons)) * quantity`.
  5. Applies discount coupons (`NORD10` ➔ 10% discount up to ₹100).
  6. Applies cafe GST tax rate (e.g. 5.0%) and packaging fees.
  7. Stores final verified total.
- **Idempotency**: Orders accept an `idempotencyKey` in the payload to prevent double-charging on network retry.

### 2.5 Live Order Lifecycle & KDS Pipeline
- **Status State Machine**:
  $$\text{PENDING} \longrightarrow \text{ACCEPTED} \longrightarrow \text{PREPARING} \longrightarrow \text{READY} \longrightarrow \text{COMPLETED}$$
  Alternatively, orders can be flagged as $\text{REJECTED}$ or $\text{CANCELLED}$ with structured reason codes.
- **Real-Time Polling & Audio Chimes**:
  - Live Orders and KDS poll the API every 3 to 4 seconds.
  - The synthesized Web Audio API chime plays upon receiving a new `PENDING` order.
  - A celebration 4-tone chime plays when an order transitions to `READY`.
- **Elapsed Time Tracking**: Tickets display a live counter with visual thresholds:
  - `<10 min`: Standard neutral state.
  - `10–15 min`: Amber warning indicator.
  - `>15 min`: Pulsing red urgent alert.

### 2.6 Assisted Onboarding Engine
- **Turnkey Setup**: Super Admins can provision a cafe in three steps:
  1. *Brand & Owner*: Cafe name, auto-generated slug, owner contact, temporary password, and subscription plan tier.
  2. *Menu CSV Digitization*: Ingests raw text or CSV files, parses headers via `papaparse`, creates missing categories, and populates dishes with preparation times and dietary classifications.
  3. *Handoff Card*: Generates table QR codes and a single-click copy button for welcome credentials.

---

## 3. Verified Edge Cases & Handled Errors

| Scenario | Handled Behavior | Validation Status |
| :--- | :--- | :--- |
| **Invalid Slug** | Returns 404 page with "Return to Home" button | Verified |
| **Duplicate Cafe Slug** | Appends random numeric suffix to ensure global uniqueness | Verified |
| **Deleted Table with Active Order** | Cascades or alerts operator of unfulfilled table session | Verified |
| **Item Out of Stock** | Dish shows "Sold Out" badge; cannot be added to cart | Verified |
| **Unauthenticated Route Visit** | Middleware redirects to `/login` | Verified |
| **Kitchen Staff visiting `/admin`** | Role check rejects with 403 Forbidden | Verified |
| **Audio Autoplay Block** | Safely checks AudioContext state and resumes on user click | Verified |
