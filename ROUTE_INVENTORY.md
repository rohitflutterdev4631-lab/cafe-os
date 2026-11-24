# Nord Cafe — Complete Route & Endpoint Inventory

**Application Host:** `https://nordcafe.vercel.app`  
**Total Routes:** 51 (27 Frontend Page Routes + 24 API Service Routes)  
**Status:** All 51 routes compiled, verified, and operational in production.

---

## 1. Public & Customer Frontend Routes

| Route | Render Type | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | Static (○) | Public | Modern SaaS Landing page with feature highlights, pricing, and panel previews. |
| `/login` | Static (○) | Public | User authentication screen with role-based routing (Admin, Owner, Kitchen). |
| `/register` | Static (○) | Public | Self-service Cafe Owner onboarding with instant slug reservation. |
| `/c/[slug]` | Dynamic (ƒ) | Public | Customer interactive digital menu with category filtering, variants, and cart. |
| `/c/[slug]/checkout` | Dynamic (ƒ) | Public | Dine-in, Takeaway, and Delivery checkout with server price verification. |
| `/c/[slug]/orders/[orderNumber]` | Dynamic (ƒ) | Public | Real-time live order tracking timeline with audio chimes and PII masking. |
| `/qr/[token]` | Dynamic (ƒ) | Public | Dynamic QR resolver that validates table tokens and redirects to menu. |
| `/lookup` | Static (○) | Public | Customer order lookup by mobile phone number. |
| `/robots.txt` | Static (○) | Search Crawlers | Search engine policy allowing public menus and disallowing private panels. |
| `/sitemap.xml` | Dynamic (ƒ) | Search Crawlers | Dynamic sitemap indexing all active cafe digital menus. |

---

## 2. Super Admin Module Routes (`/admin`)

| Route | Render Type | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/admin` | Static (○) | SUPER_ADMIN / ADMIN_STAFF | Platform overview with MRR, GMV, total cafes, and activity feed. |
| `/admin/cafes` | Static (○) | SUPER_ADMIN / ADMIN_STAFF | Comprehensive cafe directory with status badges, search, and action modals. |
| `/admin/onboarding` | Static (○) | SUPER_ADMIN / ADMIN_STAFF | 8-step assisted onboarding wizard to provision cafes, owners, and menus. |
| `/admin/plans` | Static (○) | SUPER_ADMIN | Subscription tier management (Free, Pro, Business) and limits. |
| `/admin/users` | Static (○) | SUPER_ADMIN | User directory and global role assignment. |
| `/admin/importer` | Static (○) | SUPER_ADMIN / ADMIN_STAFF | Platform-wide AI Menu Importer queue and processing history. |
| `/admin/importer/settings` | Static (○) | SUPER_ADMIN | Global controls for supported file formats, MB upload caps, and OCR confidence. |

---

## 3. Cafe Owner & Operations Portal (`/dashboard`)

| Route | Render Type | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/dashboard` | Static (○) | CAFE_OWNER / CAFE_MANAGER | Operations overview: today's revenue, active orders, and sales breakdown. |
| `/dashboard/orders` | Static (○) | CAFE_OWNER / CAFE_MANAGER | Live order management with status filters and action triggers. |
| `/dashboard/menu` | Static (○) | CAFE_OWNER / CAFE_MANAGER | Menu catalog: category sorting, food items, variants, and add-on groups. |
| `/dashboard/tables` | Static (○) | CAFE_OWNER / CAFE_MANAGER | Dining table setup, zones, guest seating capacity, and occupancy status. |
| `/dashboard/qr-codes` | Static (○) | CAFE_OWNER / CAFE_MANAGER | High-resolution QR Studio with PNG/SVG downloads and printable table stands. |
| `/dashboard/analytics` | Static (○) | CAFE_OWNER | Revenue charts, order volume trends, top-selling dishes, and average ticket size. |
| `/dashboard/subscription` | Static (○) | CAFE_OWNER | Current subscription plan details, upgrade options, and billing history. |
| `/dashboard/staff` | Static (○) | CAFE_OWNER | Team accounts management (Managers, Kitchen Operators) with role assignment. |
| `/dashboard/settings` | Static (○) | CAFE_OWNER | Cafe profile, branding, logo, GSTIN, FSSAI, tax rates, and operating hours. |
| `/dashboard/importer` | Static (○) | CAFE_OWNER / CAFE_MANAGER | AI Menu Importer session history and draft management. |
| `/dashboard/importer/new` | Static (○) | CAFE_OWNER / CAFE_MANAGER | Drag-and-drop file upload zone for PDF, DOCX, XLSX, and image menus. |
| `/dashboard/importer/[id]` | Dynamic (ƒ) | CAFE_OWNER / CAFE_MANAGER | Interactive review screen for editing AI-extracted items and duplicate handling. |

---

## 4. Kitchen Display System (`/kitchen`)

| Route | Render Type | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/kitchen` | Static (○) | KITCHEN_STAFF / CAFE_OWNER | High-contrast touch KDS with elapsed timers, modifier badges, and status actions. |

---

## 5. API Endpoints Catalog (`/api/v1`)

### Authentication & Sessions
- `POST /api/v1/auth/login` — Issues signed JWT in HttpOnly cookie.
- `POST /api/v1/auth/register` — Creates user, cafe, and default branch in transaction.
- `POST /api/v1/auth/logout` — Clears session cookie.
- `GET /api/v1/auth/me` — Returns current authenticated user and tenant profile.

### Tenant Cafe Operations
- `GET /api/v1/cafes/me` — Fetches authenticated cafe profile.
- `PATCH /api/v1/cafes/me/settings` — Updates cafe configuration, tax rates, and ordering toggle.
- `GET, POST /api/v1/categories` — Category CRUD with sort orders.
- `PATCH, DELETE /api/v1/categories/[id]` — Modifies or removes category.
- `GET, POST /api/v1/menu-items` — Food items CRUD with variant and add-on support.
- `PATCH, DELETE /api/v1/menu-items/[id]` — Updates dish details and availability toggles.
- `GET, POST /api/v1/tables` — Dining table CRUD and QR token issuance.
- `PATCH, DELETE /api/v1/tables/[id]` — Modifies table label or capacity.
- `GET /api/v1/qr-codes` — Generates QR code matrix data URLs.
- `GET /api/v1/orders` — Live order stream filtered by status and tenant `cafeId`.
- `PATCH /api/v1/orders/[id]` — Advances order status (`CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `REJECTED`).
- `GET, POST /api/v1/staff` — Staff management and role assignment.
- `GET /api/v1/subscriptions` — Subscription status and entitlements.
- `GET /api/v1/analytics/overview` — Aggregated revenue and order metrics.

### AI Menu Importer Engine
- `GET, POST /api/v1/menu-imports` — Creates upload session or lists history.
- `GET, DELETE /api/v1/menu-imports/[id]` — Retrieves session state or deletes draft.
- `POST /api/v1/menu-imports/[id]/files` — Ingests uploaded menu document.
- `POST /api/v1/menu-imports/[id]/process` — Runs OCR and document parser.
- `GET /api/v1/menu-imports/[id]/status` — Real-time extraction progress polling.
- `GET /api/v1/menu-imports/[id]/duplicates` — Smart duplicate detection against existing menu.
- `POST /api/v1/menu-imports/[id]/publish` — Atomic transactional publishing to live catalog.
- `PATCH /api/v1/admin/importer-settings` — Global configuration for AI quotas and file limits.

### Public Customer APIs
- `GET /api/v1/public/c/[slug]` — Cafe public metadata and opening status.
- `GET /api/v1/public/c/[slug]/menu` — Public catalog grouped by categories.
- `POST /api/v1/public/c/[slug]/orders` — Places order with server price validation.
- `GET /api/v1/public/orders/[orderNumber]` — Live order timeline with PII masking.
- `GET /api/v1/public/qr/[token]` — Resolves table token to active cafe table session.
- `POST /api/v1/payments/razorpay/verify` — Validates cryptographic payment signatures.
