# Nord Cafe — Online Payments, Bank Settlements & Payment Status Audit

**Document:** Online Payment Flow, Merchant Settlements & Status Telemetry  
**Platform:** Nord Cafe SaaS  
**Version:** 1.0.0 Production  
**Date:** November 2026  

---

## 1. Executive Summary: The Payment Flow

When an order is placed on a digital menu (`/c/[slug]`), the platform supports two customer payment mechanisms:
1. **Online Digital Payment** (UPI, Credit/Debit Cards, NetBanking, Razorpay)
2. **Pay at Counter** (Cash, physical card swipe at billing desk, or counter UPI QR)

```
                       CUSTOMER DIGITAL MENU
                   (/c/[slug]/checkout on mobile)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       A. ONLINE PAYMENT (UPI/Cards)     B. PAY AT COUNTER (Cash)
                 │                               │
                 ▼                               ▼
      Razorpay Payment Gateway           Order created immediately
      (Cryptographic HMAC Verify)        paymentStatus = "PENDING"
                 │                               │
                 ▼                               ▼
     paymentStatus = "PAID"              Waiter collects bill
     status = "ACCEPTED"                 Owner clicks "Mark Paid"
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                     1. CAFE OWNER DASHBOARD (/dashboard/orders)
                        - Real-time badge: [PAID] or [PENDING]
                        - Gateway reference ID: pay_xxxxxxxx
                     2. KITCHEN KDS (/kitchen)
                        - Pre-paid tickets chime straight to cooking
                     3. SUPER ADMIN (/admin)
                        - Global GMV & transaction telemetry
```

---

## 2. How the Cafe Owner Receives the Money (Bank Settlement)

There are two industry-standard architecture models for how money flows from a customer's phone into the cafe owner's bank account:

### Model A: Direct Merchant Account (Recommended & Standard)
* **How it works:**
  1. The Cafe Owner creates a Razorpay (or Stripe/PhonePe) Merchant account with their own GSTIN/PAN and business bank account (or current account).
  2. The Cafe Owner pastes their **Merchant Key ID & Key Secret** into their **Cafe Settings (`/dashboard/settings`)**.
  3. When a customer orders at Table 4 and pays ₹450 via Google Pay / PhonePe:
     - 100% of the funds go **directly into the Cafe Owner's Razorpay account**.
     - Razorpay automatically settles and transfers the money straight into the cafe owner's linked bank account on a **T+1 daily cycle** (e.g. today's sales arrive tomorrow morning).
* **Benefits for You (Platform Owner):**
  - You **never** touch customer food money.
  - Zero liability for refunds, chargebacks, or food dispute escrow.
  - The cafe owner gets their money directly without asking you for payouts.
  - You earn revenue by charging the cafe owner a monthly/annual SaaS subscription plan (`₹1,499/mo`).

---

### Model B: Platform Split Route (Razorpay Route / Marketplace Payouts)
* **How it works:**
  1. All customer orders are collected by your centralized Nord Cafe SaaS Razorpay account.
  2. Using **Razorpay Route API**, every incoming transaction is automatically split:
     - e.g., **98%** is routed automatically to the Cafe Owner's bank account.
     - e.g., **2% platform convenience fee** is kept in your Super Admin platform account.
  3. Razorpay manages the daily automated bank payouts (NEFT/IMPS) directly to the cafe owner's bank account.

---

## 3. How the Cafe Owner Checks the Payment Status of an Order

The Cafe Owner has **3 real-time monitoring checkpoints**:

### 1. Live Orders Page (`/dashboard/orders`)
Every order card displays the payment status prominently:
* **`PAID` (Green Badge):** Customer paid online via UPI/Card. The exact Razorpay Payment ID (`pay_O7d8f92a1`) is recorded in the order details.
* **`PENDING` (Amber Badge):** Customer chose *Pay at Counter*. They will pay cash or card upon billing.
* **`FAILED` (Red Badge):** Online transaction dropped or was rejected by the customer's bank.

### 2. Kitchen KDS (`/kitchen`)
* Kitchen tickets display a payment indicator (`Pre-paid Online` vs `Pay at Counter`).
* Pre-paid online orders can be accepted and cooked with 100% confidence that the customer has already paid.

### 3. Cafe Sales Analytics (`/dashboard/analytics`)
* Reconciles daily sales:
  - **Total Paid Revenue** (Actual settled funds)
  - **Payment Mode Split** (% UPI/Cards vs % Cash at Counter)
  - **Tax (GST) Collected** (5% GST breakdown for accounting)

---

## 4. How the Super Admin Checks Payment Status

The Super Admin has platform-wide financial oversight across **all restaurants**:

### 1. Platform Operations Dashboard (`/admin`)
* **Total Platform GMV (Gross Merchandise Value):** Real-time sum of all food orders processed across all registered cafes.
* **Platform Activity Feed:** Live ticker showing incoming orders across every cafe, including:
  - Order Number (`NC-XXXXXX`)
  - Cafe Name (`Nordic Roast`, `Corner Bistro`)
  - Total Amount (`₹650`)
  - Status (`PAID`, `PENDING`, `COMPLETED`)

### 2. Database Records & Cryptographic Verification
* Every transaction is recorded in the PostgreSQL `Payment` table:
  ```prisma
  model Payment {
    id                String   @id @default(uuid())
    orderId           String   @unique
    amount            Float
    method            String   // RAZORPAY, COUNTER, CASH
    status            String   // SUCCESS, PENDING, FAILED
    razorpayOrderId   String?
    razorpayPaymentId String?
    razorpaySignature String?
    createdAt         DateTime @default(now())
  }
  ```
* Before an order is marked `PAID`, the backend verifies the HMAC-SHA256 signature generated by Razorpay. A fraudulent customer cannot manipulate the frontend to fake a payment.
