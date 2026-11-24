# Nord Cafe — Role, Panel & Multi-Tenant Architecture Audit

**Document:** Roles, Panels & Platform Access Audit  
**Platform:** Nord Cafe SaaS (Multi-Tenant Restaurant Operating System)  
**Version:** 1.0.0 Production  
**Date:** November 2026  
**Audience:** Platform Architects, SaaS Business Founders, Support Operators, Restaurant Clients  

---

## 1. Executive Summary: The 5 Platform Modules

Nord Cafe is architected as a **hierarchical multi-tenant software-as-a-service (SaaS)** platform. The platform is intentionally segregated into five distinct user tiers to ensure bank-grade tenant isolation, clear role boundaries, and zero data leakage between competing restaurants:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. SUPER ADMIN PORTAL                           │
│                      Route: /admin  (SaaS Owner)                       │
│      Governs all cafes, subscriptions, platform GMV, tenant security   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────────┐       ┌────────────────────────────────────┐
│      2. ADMIN STAFF SUPPORT       │       │       3. CAFE OWNER PORTAL         │
│     Route: /admin (Restricted)    │       │     Route: /dashboard (Tenant)     │
│  Assisted onboarding, support     │       │ Dispatches orders, menus, tables   │
└───────────────────────────────────┘       └──────────────────┬─────────────────┘
                                                               │
                                  ┌────────────────────────────┴───────────────────────────┐
                                  ▼                                                        ▼
                    ┌────────────────────────────┐                           ┌────────────────────────────┐
                    │    4. KITCHEN KDS PANE     │                           │   5. CUSTOMER MENU PANE    │
                    │   Route: /kitchen (Chefs)  │                           │   Route: /c/[slug] (Diners)│
                    │ Live prep, timers, tickets │                           │ Scan QR, order, pay counter│
                    └────────────────────────────┘                           └────────────────────────────┘
```

---

## 2. In-Depth Working of Each Role & Panel

### Module 1: Super Admin Portal (`/admin`)
* **Who Accesses This:** The **SaaS Platform Owner** (You / the company operating Nord Cafe).
* **Primary Scope:** Global Platform Operations (Cross-Tenant Visibility).
* **Key Capabilities:**
  1. **Platform Analytics & Revenue:** Real-time visibility into overall platform Gross Merchandise Value (GMV), Monthly Recurring Revenue (MRR), total active orders across all restaurants, and subscription health.
  2. **Tenant Governance:** View, approve, suspend, or archive cafes. Instantly freeze restaurants that violate terms of service.
  3. **Subscription Engine:** Define and modify subscription plans (`FREE`, `PRO`, `BUSINESS`), billing frequencies (monthly/annual), table limits, dish limits, and transaction fees.
  4. **Assisted Onboarding:** Create a cafe on behalf of a restaurant client, configure their initial branch, generate QR codes, upload initial menus, and issue owner invites.
  5. **AI Menu Engine Configuration:** Configure OCR parameters, AI extraction models, document size thresholds, and parse retry limits.
  6. **Security & Audit Logs:** Review cross-platform security logs, failed authentication attempts, and API rate-limiting incidents.

---

### Module 2: Admin Staff Support (`/admin` Scoped)
* **Who Accesses This:** Technical Support Representatives, Onboarding Agents, and Operations Associates hired by the SaaS provider.
* **Primary Scope:** Tenant Assistance and Account Setup.
* **Key Capabilities:**
  1. **Assisted Onboarding Delivery:** Walk restaurant managers through menu digitization using the AI Menu Importer.
  2. **Support Ticket Resolution:** Help owners debug printer connections, QR design questions, or category rearrangements.
  3. **Verification Checks:** Verify business registrations (FSSAI, GSTIN) for newly registered restaurants before enabling live payment processing.
* **Strict Limitations:** Cannot modify subscription plan pricing, cannot delete tenants, and cannot access platform financial payout tokens.

---

### Module 3: Cafe Owner & Manager Portal (`/dashboard`)
* **Who Accesses This:** The individual **Restaurant Proprietor**, Cafe Owner, General Manager, or Store Supervisor.
* **Primary Scope:** Isolated Single-Tenant Operations (`cafeId` Sandbox).
* **Key Capabilities:**
  1. **Live Orders Command Center:** Receive real-time orders from dining tables, takeaway pickups, and local delivery. Accept, reject (with canned/custom reasons), or send tickets to the kitchen with one click.
  2. **Digital Menu Catalog:** Full CRUD operations over categories, dishes, prices, descriptions, high-resolution photos, dietary tags (Veg, Non-Veg, Egg, Vegan), portion variants (Regular/Large), and add-on groups (Extra Cheese, Oat Milk).
  3. **AI Menu Importer:** Upload physical paper menu photos, PDF brochures, DOCX files, or Excel sheets. AI OCR extracts dishes, prices, and options automatically with human review before publishing.
  4. **Dining Tables & Floor Management:** Create dining tables (`Table 1`, `Table 2`, `Patio 5`), configure seating capacities, and monitor real-time occupied vs vacant status.
  5. **QR Code Studio:** Generate, customize, and export print-ready QR codes (SVG/PNG) for individual tables or counter pickup.
  6. **Sales Analytics:** Review daily gross sales, average ticket size, busiest dining hours, and top-performing dishes.
  7. **Staff Access Control:** Invite Kitchen Staff or Waiters with restricted credentials.
  8. **Cafe Brand & Billing Settings:** Configure opening hours, tax rules (5% GST), takeaway packaging charges, Razorpay credentials, and cafe logos.

---

### Module 4: Kitchen Display System (`/kitchen`)
* **Who Accesses This:** Executive Chefs, Line Cooks, Kitchen Expeditors, and Baristas.
* **Primary Scope:** Real-Time Food Preparation & Dispatch.
* **Key Capabilities:**
  1. **Modern White Theme Interface:** High-contrast layout designed specifically for kitchen touchscreens, iPads, and wall tablets.
  2. **Audio Chimes & Auto-Sync:** Chimes automatically whenever a new table ticket arrives. Polls live orders every 3 seconds with zero manual browser refreshing required.
  3. **Ticket Information:** Displays table number, order reference, elapsed preparation timer (warning at 10m, overdue alert at 15m), custom portion sizes, and customer special notes (*"extra spicy, no onions"*).
  4. **One-Tap Workflow Transitions:**
     $$\text{PENDING} \longrightarrow \text{ACCEPTED} \longrightarrow \text{PREPARING} \longrightarrow \text{READY} \longrightarrow \text{COMPLETED}$$
  5. **Privacy Safeguard:** Kitchen staff **cannot** see restaurant revenue, profit margins, bank information, or owner subscription settings.

---

### Module 5: Customer Public Menu (`/c/[slug]` & `/c/[slug]/checkout`)
* **Who Accesses This:** The Dining Guest, Takeaway Patron, or QR Scanner.
* **Primary Scope:** Interactive Frictionless Dining Experience.
* **Key Capabilities:**
  1. **Zero App Installation:** Guest scans Table QR code using their iPhone or Android camera, instantly opening `nordcafe.vercel.app/c/nordic-roast?table=T-01`.
  2. **Dynamic Browsing & Search:** Sticky category pills, search bar, dietary filters (Pure Veg, Non-Veg, Chef Bestsellers).
  3. **Mobile-First Card Layout:** 65% text description / 35% fixed image ratio with in-card steppers `[ - ] [ qty ] [ + ]`.
  4. **Checkout Engine:** Supports Dine-in (pre-filled with table token), Takeaway Pickup, or Delivery.
  5. **Transparent Price Breakdown:** Computes item subtotal, cafe GST rate, takeaway packaging fee, and coupon discounts (`NORD10`).
  6. **Payment Flexibility:** Pay online instantly via UPI / Razorpay or Pay at Counter after dining.
  7. **Live Order Tracker (`/c/[slug]/orders/[orderNumber]`):** Real-time 3-second live progress bar, bill printing, and masked phone numbers (`******3210`) to protect customer privacy.

---

## 3. Comparison Matrix Across All Panels

| Dimension | Super Admin (`/admin`) | Cafe Owner (`/dashboard`) | Kitchen KDS (`/kitchen`) | Customer Menu (`/c/[slug]`) |
| :--- | :--- | :--- | :--- | :--- |
| **Target User** | SaaS Platform Founder | Restaurant Proprietor | Chef / Line Cook | Dining Guest / Patron |
| **Authentication** | Password + JWT + `SUPER_ADMIN` role | Password + JWT + `CAFE_OWNER` role | Password + JWT + `KITCHEN_STAFF` role | Public (Zero login required) |
| **Tenant Scope** | **Global** (All Cafes) | **Isolated** (Only their `cafeId`) | **Branch-Isolated** (Kitchen queue) | **Single Cafe** (Only scanned cafe) |
| **Financial Access** | Platform MRR & SaaS GMV | Cafe Sales, Revenue, Daily Orders | None (Strictly hidden) | Order total & item bill |
| **Menu Editing** | Global assistance only | Full CRUD & AI Menu Importer | None (Read-only tickets) | View & Order only |
| **Device Target** | Desktop / Laptop | Desktop / Tablet / Mobile | Tablet / Touchscreen / Monitor | Mobile Phone (320px–430px) |

---

## 4. Single-Branch Cafe Architecture: What Panel Do They Receive?

> **Question:** *"If a cafe has only one location and no branches, what panel do we give them? Admin, Cafe Owner, or Menu only?"*

### The Answer:
You give them the **Cafe Owner Portal (`/dashboard`)**.

### Why They Never Receive `/admin`:
1. `/admin` is **strictly for the SaaS platform owner**. If a single cafe owner had `/admin`, they would see other competing cafes, platform revenues, and global system configurations.
2. In Nord Cafe's multi-tenant database:
   - When a standalone cafe signs up, the system creates **1 Cafe record** and assigns **1 default Branch** behind the scenes.
   - The cafe owner logs in at `/login` and is automatically routed to `/dashboard`.
   - Their dashboard gives them full control over their menu, tables, QR codes, live orders, sales analytics, and kitchen staff.
   - If they have no extra branches, the system simply runs with their single location seamlessly. They do not have to configure multi-branch complexity.
   - Their customers visit `/c/[cafe-slug]` to order.
   - Their kitchen tablet runs `/kitchen` to cook.

```
Single Cafe Setup:
┌────────────────────────────────────────────────────────┐
│                   CAFE OWNER ACCOUNT                   │
│                       (/dashboard)                     │
│  - Edits Menu Items & Prices                           │
│  - Downloads Table QR Codes                            │
│  - Reviews Daily Sales Analytics                       │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│     KITCHEN STAFF     │       │    DINING CUSTOMER    │
│       (/kitchen)      │       │     (/c/[cafe-slug])  │
│  Line cooks view and  │       │  Guest scans QR from  │
│  prepare tickets      │       │  table & submits order│
└───────────────────────┘       └───────────────────────┘
```

---

## 5. Who Can Access Super Admin?

> **Question:** *"Who will access Super Admin here?"*

### The Answer:
**ONLY YOU** — the platform operator, company founders, and designated SaaS system administrators.

### Security Enforcement:
1. **Server-Side Role Guard:**
   Every API endpoint under `/api/v1/admin/*` executes `requireRole(['SUPER_ADMIN', 'ADMIN_STAFF'])`. If a Cafe Owner, Kitchen Cook, or Customer attempts to access an admin endpoint, the server responds with an immediate `403 Forbidden`.
2. **Tenant Isolation Guard:**
   The Super Admin account has `cafeId = null` because it sits **above** all tenants. A Cafe Owner's JWT is cryptographically bound to their specific `cafeId`.
3. **Database Guardrails:**
   Cafe owners cannot view, query, or edit any rows belonging to other cafes. All database operations strictly filter by `where: { cafeId }`.

---

## 6. Authentication & Automatic Role-Based Routing Flow

When any user enters their credentials at `/login`, the backend issues an `HttpOnly` secure session token and the frontend automatically routes them to their authorized panel:

```
                  ┌──────────────────────┐
                  │ User visits /login   │
                  │ Enters Email & Pass  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ POST /api/v1/auth/   │
                  │ login (Bcrypt verify)│
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
   Role = SUPER_ADMIN  Role = KITCHEN   Role = CAFE_OWNER
            │                │                │
            ▼                ▼                ▼
    Route to /admin   Route to /kitchen  Route to /dashboard
   (SaaS Operations)  (Live Kitchen KDS)  (Cafe Management)
```

---

## 7. Recommended Client Onboarding Standard Operating Procedure (SOP)

When signing up a new restaurant client (e.g. "Corner Bistro"):
1. **Client Account Creation:**
   - Client signs up at `/register` or Super Admin onboards them via `/admin/onboarding`.
   - Client receives their credentials (`owner@cornerbistro.com`).
2. **Client Access:**
   - Owner logs in at `nordcafe.vercel.app/login` $\rightarrow$ Redirects to **`/dashboard`**.
   - Owner uploads their menu using **AI Menu Importer** or manual entry.
   - Owner clicks **Dining Tables** $\rightarrow$ adds 10 tables $\rightarrow$ clicks **QR Code Studio** $\rightarrow$ downloads print-ready PDF/PNG table stands.
3. **Kitchen Setup:**
   - Owner opens an iPad or tablet in the kitchen $\rightarrow$ visits `nordcafe.vercel.app/kitchen`.
4. **Customer Experience:**
   - Table stands placed on tables. Diners scan and order from `nordcafe.vercel.app/c/corner-bistro`.
