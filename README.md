# cafe-os
# ☕ CAFE OS — Immersive 3D AI Cafe Management Ecosystem

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frohitflutterdev4631-lab%2Fcafe-os)

CAFE OS is an enterprise-grade, immersive 3D digital cafe management ecosystem and multi-tenant SaaS platform. It combines a navigable 3D digital twin of a cafe headquarters with real-world restaurant management: POS, KDS, inventory, order processing, CRM, AI business co-pilot, and a customer-facing boutique ordering website.

---

## 🌟 Key Product Capabilities

### 1. Dual Business Models
- **Self-Service SaaS**: Cafe owners register, configure their digital menu, set up dining tables, and subscribe to plans.
- **Admin-Assisted Service**: The Nord Cafe operations team can onboard restaurants on their behalf, upload menus via CSV, configure branding, generate print-ready table QR tent cards, and hand over access.

### 2. Multi-Tenant Role-Based Access Control (RBAC)
- **👑 Super Admin**: Full platform management, cafe approvals, suspension, MRR tracking, subscription plans, and user permissions.
- **💼 Admin Staff**: Cafe onboarding, support, and manual menu digitizations.
- **☕ Cafe Owner**: Full management of their cafe, menu catalog, tables, orders, staff, branding, and billing.
- **👔 Cafe Manager**: Day-to-day operations, table sessions, and order fulfilment.
- **👨‍🍳 Kitchen Staff**: Dedicated Kitchen Display System (KDS) with live dish checklists and prep timers.
- **📱 Customer**: Contactless QR digital menu, cart, size/variant selection, add-ons, dine-in / takeaway / delivery checkout, and real-time live order tracking.

### 3. Server-Recalculated Checkout & Price Integrity
- Prices submitted by the client are never trusted. All variant prices, add-on costs, 5% restaurant GST, and packaging charges are computed securely on the server with database-backed item snapshots.

### 4. Real-Time Kitchen Display System (KDS)
- Tablet-optimized dark mode interface displaying incoming orders, elapsed timers with urgent warning thresholds, dish-specific notes, and one-tap status updates.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling & Icons** | Tailwind CSS, Lucide React |
| **Database** | PostgreSQL 16 (Running natively / Docker) |
| **ORM** | Prisma ORM v5 |
| **Authentication** | Jose JWT sessions, HttpOnly secure cookies, bcrypt password hashing |
| **QR Code Generation** | `qrcode` (SVG, High-res PNG data URLs, printable tent cards) |
| **Menu Importer** | PapaParse CSV parser |
| **Payments** | Razorpay SDK integration with signature verification |
| **Automated Testing** | Node.js Test Runner + tsx |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- pnpm (or npm)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rohitflutterdev4631-lab/cafe-os.git
cd cafe-os
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and verify database credentials:
```bash
cp .env.example .env
```
Default local PostgreSQL connection string:
```env
DATABASE_URL="postgresql://rohit@localhost:5432/nordcafe?schema=public"
JWT_SECRET="nord-cafe-super-secret-jwt-key-2026-production-ready"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Seed Rich Demo Data
```bash
# Push Prisma schema to PostgreSQL and seed sample cafes, menus, tables, orders, and users
pnpm db:setup
```

### 4. Run Development Server
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Personas & Credentials

The database comes pre-seeded with realistic cafes, menus, and roles in Chandigarh & Mohali:

| Role | Email | Password | Access Panel |
|---|---|---|---|
| **👑 Super Admin** | `admin@nordcafe.com` | `admin123` | `/admin` |
| **☕ Cafe Owner** | `owner@nordicroast.com` | `owner123` | `/dashboard` |
| **👔 Cafe Manager** | `manager@nordicroast.com` | `manager123` | `/dashboard` |
| **👨‍🍳 Kitchen Staff** | `kitchen@nordicroast.com` | `kitchen123` | `/kitchen` |

### Sample Public Digital Menus
- **Nordic Roast & Bakery** (Sector 35-C, Chandigarh): [http://localhost:3000/c/nordic-roast](http://localhost:3000/c/nordic-roast)
- **Table T-02 Dine-in Menu**: [http://localhost:3000/c/nordic-roast?table=T-02](http://localhost:3000/c/nordic-roast?table=T-02)
- **The Matcha Lab** (Sector 67, Mohali): [http://localhost:3000/c/matcha-lab](http://localhost:3000/c/matcha-lab)
- **Brew & Bite Bistro**: [http://localhost:3000/c/brew-and-bite](http://localhost:3000/c/brew-and-bite)

---

## 📋 Production Testing & Verification

Run the automated test suite:
```bash
pnpm test
```
Build verification:
```bash
pnpm build
```

---

---

## ⚡ Deploying to Vercel

This project is pre-configured for one-click deployment to **Vercel**:

### 1. Database Setup
Ensure you have a cloud PostgreSQL database (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)).

### 2. Environment Variables on Vercel
In your Vercel Project Settings ➔ **Environment Variables**, configure:
* `DATABASE_URL`: Your cloud PostgreSQL pooled connection string
* `JWT_SECRET`: A secure 32+ character random secret string
* `NEXT_PUBLIC_APP_URL`: Your Vercel production URL (e.g. `https://norddigitalmenudemo.vercel.app`)
* `NODE_ENV`: `production`
* `GEMINI_API_KEY`: *(Optional)* For AI Menu Importer Google Gemini extraction

### 3. Database Migration & Seed
Run migrations and initial seed data against your cloud database:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

