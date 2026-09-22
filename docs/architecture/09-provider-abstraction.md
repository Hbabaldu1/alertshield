# Provider Abstraction — M2-01

## Boundary

The domain and application layers depend only on SLock-owned normalized contracts. Provider SDKs, HTTP clients, webhook formats, and provider-specific statuses must remain in future infrastructure adapters.

## Capability interfaces

- `PaymentCollectionProvider`
- `PaymentAccountProvider`
- `PayoutProvider`
- `RefundProvider`
- `WebhookVerifier`
- `ReconciliationProvider`

Payout, refund, webhook verification, and reconciliation interfaces are contracts only in M2-01. They do not execute external operations.

## Normalized payment statuses

- UNKNOWN
- PENDING
- SUCCEEDED
- FAILED
- REVERSED
- PARTIALLY_REFUNDED
- REFUNDED

An ambiguous provider status maps to `UNKNOWN`, never silently to success or failure.

## Provider event handling

The existing `provider_events` table and unique `(provider, event_id)` protection are the intended persistence boundary. Duplicate events must be harmless, and older/out-of-order facts must not regress an established internal state.

## Security

Provider credentials are not part of normalized contracts, domain objects, ordinary business records, logs, or API responses.

## Unresolved provider questions

STATUS: UNKNOWN — REQUIRES CONFIRMATION

- provider selection
- payment-account model
- payment finality
- permitted protected-payment business model
- reversal semantics
- refund capabilities
- payout idempotency guarantees
- reconciliation API behavior
