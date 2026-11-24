# Nord Cafe — Database Schema & Data Integrity Audit

**Audit Date:** November 19, 2026  
**Auditor:** Principal Database Architect & Data Engineer  
**Database:** Serverless PostgreSQL on Neon (AWS us-east-2)  
**ORM:** Prisma ORM `v5.22.0`  
**Status:** MIGRATED, INDEXED, SEEDED & VERIFIED

---

## 1. Schema Entity Relationship Architecture

The relational schema implements clean normalization with tenant boundaries:
- **Tenant Anchor:** `Cafe` (holds `slug`, `name`, `status`, `themeColor`, `logo`, `currency`, `gstin`, `fssai`).
- **One-to-Many Tenant Entities:**
  - `Branch` (physical cafe locations with address, coordinates, and operating hours).
  - `Category` (menu sections with `sortOrder` and active flags).
  - `MenuItem` (dishes with `basePrice`, dietary tags, and prep times).
  - `ItemVariant` (portion sizes: Regular, Large, etc.).
  - `AddonGroup` & `AddonOption` (modifiers, toppings, milk substitutions).
  - `DiningTable` (tables with encrypted QR tokens and guest capacities).
  - `Order` & `OrderItem` (live tickets with status history, discounts, and payments).
  - `Staff` / `UserRole` (role mappings to `SUPER_ADMIN`, `CAFE_OWNER`, `CAFE_MANAGER`, `KITCHEN_STAFF`).
  - `MenuImportSession` (AI document ingestion sessions with extracted draft items).

---

## 2. Foreign Key Constraints & Cascade Policies

- **On Tenant Deletion:** `onDelete: Cascade` ensures deleting a test cafe cleanly purges its categories, items, tables, and import sessions without orphan records.
- **On Branch / Customer Deletion:** `onDelete: SetNull` preserves historical orders and financial reporting even if a branch or customer account is deactivated.
- **Unique Constraints:**
  - `Cafe.slug` (enforces unique public URLs, e.g. `nordic-roast`).
  - `Order.orderNumber` (prevents ticket number collisions).
  - `Order.idempotencyKey` (prevents double charging).
  - `User.email` (guarantees single-tenant user identification).
  - `Coupon.[cafeId, code]` (ensures coupons are unique per cafe).

---

## 3. Production Seeding Verification

Seeded on live Neon PostgreSQL:
- **Cafes:** 3 full production demo establishments (`nordic-roast`, `matcha-lab`, `brew-and-bite`).
- **Menu Items:** 40+ curated artisan dishes across Coffee, Woodfired Pizza, Burgers, Desserts, and Coolers.
- **Modifiers:** 15+ item variants and add-on options (e.g. Oat Milk, Extra Shot, Truffle Glaze).
- **Tables & QRs:** 15 dining tables across indoor, terrace, and garden zones with active cryptographically signed QR codes.
- **Role Accounts:** Pre-seeded for Super Admin, Cafe Owner, Cafe Manager, and Kitchen Staff.
