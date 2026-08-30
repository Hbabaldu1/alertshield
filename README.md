# AlertShield Lite

### Never release goods because of a screenshot.

AlertShield Lite is a lightweight payment-verification workflow for Nigerian merchants who want a simple way to record and audibly confirm payments **after independently verifying the transaction in their actual bank or payment-provider app**.

The MVP is intentionally simple. It does **not** pretend to have direct access to bank accounts or NIP transaction data.

---

## The Problem

Fake payment screenshots and fake payment alerts create a simple but expensive problem for merchants:

> A customer claims to have paid.
> The merchant sees an "alert."
> The goods are released.
> The money was never actually received.

AlertShield Lite introduces a disciplined verification step between a customer's payment claim and the release of goods.

Instead of relying on a screenshot or notification:

**Customer claims payment → Merchant checks actual account → Merchant confirms → AlertShield records the verification**

---

## MVP

AlertShield Lite provides a fast cashier workflow for recording verified payments.

### Core workflow

1. Merchant creates a payment-verification session.
2. Merchant enters:

   * Customer/order reference
   * Expected amount
   * Optional customer name
3. AlertShield displays the transaction as **WAITING FOR VERIFICATION**.
4. Merchant independently checks their actual bank or payment-provider application.
5. Merchant confirms the payment only after seeing the transaction themselves.
6. AlertShield records the verification.
7. The system generates a simple verification record/receipt.
8. The browser can announce:

> "Payment verified. Fifteen thousand naira received."

---

## What AlertShield Lite Does NOT Do

The MVP does **not**:

* Connect directly to Nigerian banks
* Access merchant bank accounts
* Verify NIP transactions independently
* Generate or manage virtual accounts
* Automatically sweep or settle funds
* Read bank SMS alerts
* Treat screenshots as proof of payment
* Claim that a payment is genuine without merchant confirmation

This distinction is deliberate.

**AlertShield Lite records a merchant's verification. It does not independently verify bank transactions.**

Future versions may integrate with licensed payment infrastructure where legally and technically appropriate.

---

## Features

### Payment Verification Sessions

Create a verification session with:

* Expected amount
* Customer name
* Order/reference number
* Verification status
* Timestamp

### Cashier Soundbox

After the merchant confirms a transaction, the browser can use Web Audio/Text-to-Speech to provide an audible confirmation.

Example:

> "Payment verified. Fifteen thousand naira received."

This is designed for busy retail environments where the cashier may not want to repeatedly look at the screen.

### Verification History

Merchants can review previously verified transactions and see:

* Amount
* Customer/reference
* Date
* Time
* Verification status

### Daily Summary

The dashboard provides a basic view of:

* Number of verified transactions
* Total verified amount
* Recent activity

### Digital Verification Record

Each confirmed transaction receives a simple digital record that can be used for the merchant's internal bookkeeping.

---

# Product Philosophy

AlertShield Lite follows one principle:

> **Don't build fintech infrastructure before proving that merchants will pay for the workflow.**

The initial product deliberately avoids unnecessary complexity.

The first question is not:

> "Can we integrate with every Nigerian bank?"

The first question is:

> **"Will a Nigerian merchant pay ₦1,000 for a better payment-verification workflow?"**

---

# Target Users

The initial target market is Nigerian merchants who regularly receive bank transfers from customers.

Potential users include:

* Retail shops
* Phone/accessory sellers
* Fashion sellers
* Social-commerce sellers
* Food vendors
* Online merchants
* Market traders
* Small wholesalers
* Service businesses
* Cashiers handling frequent transfers

The initial validation strategy focuses on merchants who frequently experience payment disputes or need to verify transfers before releasing goods.

---

# Pricing

### Starter Validation Plan

**₦1,000 / 30 days**

The initial paid experiment provides:

* Payment verification sessions
* Verification history
* Cashier soundbox
* Basic transaction dashboard
* Digital verification records

Pricing is intentionally simple during validation.

The goal is to measure willingness to pay before introducing multiple plans.

---

# Technology

The exact implementation may evolve during validation, but the MVP is designed around a low-cost web architecture.

Potential stack:

* **Frontend:** Next.js
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Backend:** Next.js server functionality / API routes
* **Database:** PostgreSQL / Supabase
* **Authentication:** Supabase Auth
* **Payments:** Payment provider integration
* **Deployment:** Vercel or equivalent
* **Voice:** Browser Web Speech API
* **Audio:** Web Audio API

The architecture should remain simple until actual usage demonstrates the need for additional infrastructure.

---

# Getting Started

## Prerequisites

Install:

* Node.js 20+
* npm
* Git

Verify:

```bash
node --version
npm --version
git --version
```

---

## Installation

Clone the repository:

```bash
git clone <REPOSITORY_URL>
cd alertshield
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env.local
```

On Windows CMD, if `cp` is unavailable:

```cmd
copy .env.example .env.local
```

Configure the required environment variables.

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Environment Variables

Create `.env.local` and configure the variables required by the application.

Example:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

PAYMENT_PROVIDER_SECRET_KEY=
PAYMENT_PROVIDER_PUBLIC_KEY=
```

**Never commit `.env.local` or secret keys to Git.**

The exact variables depend on the payment, database, and authentication providers used by the implementation.

---

# Development

Run the development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Start the production build:

```bash
npm start
```

---

# Security Principles

AlertShield deals with information associated with financial transactions, so security is a core requirement.

The MVP should:

* Never store bank passwords
* Never request users' banking credentials
* Never store card PINs
* Never store transaction authentication credentials
* Never expose server-side secrets to the browser
* Validate all user input
* Enforce authentication and authorization
* Apply database access controls
* Minimize stored personal information
* Use HTTPS in production
* Maintain audit-friendly transaction timestamps
* Clearly distinguish merchant-confirmed transactions from independently verified payment data

Most importantly:

**A screenshot, SMS notification, or customer statement must never automatically be treated as verified payment evidence.**

---

# Product Status

**Status: MVP / Paid Validation**

AlertShield Lite is currently an experiment designed to determine whether Nigerian merchants have sufficient pain around payment verification to pay for a dedicated workflow.

The current priority is:

1. Build MVP
2. Deploy
3. Get first real merchant
4. Collect first ₦1,000
5. Interview paying users
6. Measure repeated usage
7. Improve the workflow
8. Decide whether deeper payment integrations are justified

---

# Validation Metrics

The project should track:

| Metric                 | Purpose                     |
| ---------------------- | --------------------------- |
| Landing-page visitors  | Measure initial interest    |
| Registrations          | Measure product interest    |
| Verification sessions  | Measure actual usage        |
| Verified transactions  | Measure recurring utility   |
| Paid subscriptions     | Measure willingness to pay  |
| Revenue                | Measure economic validation |
| Daily active merchants | Measure engagement          |
| 30-day retention       | Measure sustained value     |
| Merchant referrals     | Measure product-market pull |

### North-Star Validation Metric

**Number of merchants who voluntarily pay ₦1,000 and continue using AlertShield.**

Revenue alone is insufficient.

A merchant paying once because of personal persuasion is weaker evidence than a merchant who:

**pays → uses → returns → pays again → recommends it.**

---

# First-Customer Strategy

The first customers should be acquired manually.

### Step 1 — Find merchants

Approach businesses that receive frequent transfers.

Examples:

* Phone shops
* Fashion stores
* Mini supermarkets
* Food vendors
* Online sellers
* Electronics sellers
* Service businesses

### Step 2 — Demonstrate the problem

Ask:

> "Have you ever released something because someone showed you a payment alert, only to discover that the money wasn't actually there?"

Do not lead with technical features.

Lead with the financial risk.

### Step 3 — Demonstrate AlertShield

Show the merchant:

**₦15,000 expected**

→

**WAITING FOR VERIFICATION**

→

Merchant checks actual bank app

→

**PAYMENT VERIFIED**

→

**Audio confirmation**

### Step 4 — Ask for payment

Offer the 30-day plan:

**₦1,000**

The payment is the validation event.

---

# Roadmap

## Phase 1 — Validation

* [x] Define core problem
* [ ] Build MVP
* [ ] Deploy landing page
* [ ] Deploy application
* [ ] Acquire first merchant
* [ ] Collect first ₦1,000
* [ ] Conduct merchant interviews
* [ ] Measure repeated usage

## Phase 2 — Product Improvement

Only after evidence of demand:

* [ ] Better transaction history
* [ ] Business reports
* [ ] Multiple cashier devices
* [ ] Staff accounts
* [ ] Merchant branding
* [ ] Customer/order management
* [ ] Better receipt generation
* [ ] Subscription management

## Phase 3 — Payment Infrastructure

Only if validated demand justifies it:

* [ ] Research licensed payment providers
* [ ] Payment-provider integrations
* [ ] Transaction verification APIs
* [ ] Automated payment reconciliation
* [ ] Virtual-account workflows
* [ ] Regulatory/compliance review

---

# Important Product Boundary

AlertShield Lite is a **verification workflow**, not a bank and not a payment processor.

The merchant remains responsible for confirming that funds have actually arrived through their authorized financial institution.

The product should never create a false impression that it independently confirms bank transactions when it does not.

---

# License

License: To be determined.

---

# Vision

The long-term opportunity is larger than a "fake alert detector."

The broader problem is:

> **How can small businesses in Nigeria confidently reconcile digital payments with sales, customers, inventory, and cash flow?**

If the initial payment-verification workflow proves valuable, AlertShield could evolve into a broader merchant payment-reconciliation platform.

But that is a future hypothesis.

**The immediate objective is much smaller:**

### Get the first real merchant to pay ₦1,000.
