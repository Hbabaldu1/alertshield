# Ledger Model

## Purpose

The ledger is the internal accounting record for SLock-recognized financial operations. It records accounting effects only. It is not evidence that SLock owns, holds, or controls customer funds externally.

The ledger records SLock-recognized financial operations and their accounting effects. External movement of funds remains authoritative at the regulated payment/settlement provider layer, which is intentionally not implemented in M1-04.

## Money primitive

The domain-level money type is built on integer minor units rather than floating-point values.

Example:
- ₦1.00 = 100 minor units (kobo)
- ₦1,500.50 = 150050 minor units

Money is represented as:

```ts
Money {
  amountMinor: bigint;
  currency: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'KES' | 'GHS' | 'ZAR';
}
```

Rules:
- integer minor units only
- explicit currency always required
- no floating-point arithmetic
- no silent rounding
- negative amounts are rejected unless a very specific signed domain object is created later
- arithmetic is valid only when currencies match

## Currency model

The current SLock scope expects NGN as the default operational currency. The money primitive supports explicit ISO-style 3-letter codes for known currencies, but it does not implement FX conversion or multi-currency settlement.

Unknown currencies are rejected.

## Ledger account model

Ledger accounts are persisted in `ledger_accounts` and are architectural placeholders for accounting definitions. They are not treated as a legal or regulatory conclusion.

Approved conceptual categories:
- PROVIDER_RECEIVABLE
- CUSTOMER_FUNDS_PAYABLE
- MERCHANT_SETTLEMENT_PAYABLE
- REFUND_PAYABLE
- PROVIDER_CASH_CLEARING
- PLATFORM_FEE_REVENUE
- PROVIDER_FEE_EXPENSE
- REFUND_EXPENSE
- CHARGEBACK_OR_REVERSAL_EXPENSE
- OPERATIONAL_ADJUSTMENT

FINAL ACCOUNTING TREATMENT:
UNKNOWN — REQUIRES ACCOUNTING CONFIRMATION

## Ledger operation model

A ledger operation is one atomic accounting event.

Supported operational types include:
- PAYMENT_RECOGNITION
- SETTLEMENT_RECOGNITION
- PAYOUT_RECOGNITION
- REFUND_RECOGNITION
- FEE_RECOGNITION
- REVERSAL
- ADJUSTMENT

Each operation has:
- id
- transaction_id (nullable)
- operation_type
- idempotency_key
- provider_reference (nullable)
- status
- created_at
- reverses_operation_id (for compensations)

## Ledger entry lines

Each operation consists of one or more entries in `ledger_entry_lines`.

Each entry includes:
- operation_id
- ledger_account_id
- direction (DEBIT or CREDIT)
- amount_minor
- currency
- created_at

Rules:
- amount must be positive
- debit/credit is represented by direction, not by a negative sign
- each operation must use exactly one currency
- a posted operation may not be modified or deleted

## Debit/credit invariants

Every posted ledger operation must satisfy:

- total debits == total credits
- all entry lines in an operation use the same currency
- a posted operation must have at least one debit and one credit
- unbalanced operations may not be posted

This is enforced by both validation and database constraints.

## Immutability

Once an operation is posted:
- it cannot be edited
- it cannot be deleted
- it cannot be partially overwritten
- its entry lines cannot be moved to another operation

Corrections are represented as new operations with `reverses_operation_id` pointing to the historical operation. The original record remains intact.

## Compensation

A compensating operation reverses the original debits/credits without altering the original operation.

Example:

Original:
- DEBIT PROVIDER_RECEIVABLE 100000
- CREDIT CUSTOMER_FUNDS_PAYABLE 100000

Compensation:
- DEBIT CUSTOMER_FUNDS_PAYABLE 100000
- CREDIT PROVIDER_RECEIVABLE 100000

The original remains immutable and auditable.

## Idempotency

Ledger posting is idempotent. A repeated submission with the same idempotency key returns the previous result instead of creating a duplicate operation. This is enforced with the existing `idempotency_keys` pattern and unique constraints on ledger operation identity.

## Concurrency

Duplicate postings submitted concurrently are prevented by PostgreSQL transaction guarantees and uniqueness constraints. A race condition does not create multiple accounting effects for the same idempotency key.

## Atomic posting

A posting is a single transaction:

- validate inputs
- validate account activity
- validate entry totals and currency
- validate idempotency
- create operation and lines atomically
- write audit metadata
- commit only if all validation passes

Any failure triggers a rollback.

## Balance derivation

Balances are derived from immutable ledger entries rather than a mutable balance column.

Conceptually:

balance = sum(credits) - sum(debits)

or the equivalent sign convention adopted by the internal account model. In the current foundation, balance is treated as a derived read-only value, not a stateful persisted column.

## Provider boundary

This ledger model intentionally does not:
- call any provider
- validate provider finality
- assume fund control
- assume settlement exists externally
- declare legal control of customer funds

Provider references may be stored as metadata only, but they do not imply external finality or legal ownership.

## Deferred / unresolved accounting items

- provider settlement finality
- regulatory classification of fund custody
- formal chart-of-accounts approval
- tax treatment
- chargeback/refund accounting treatment
- legal ownership of customer funds

These remain unresolved and must not be documented as settled facts.
