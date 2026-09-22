# API Contracts — M2-01 Provider-Neutral Boundary

## Status

M2-01 defines provider-neutral payment contracts and application boundaries only. No provider is selected and no external payment API is called.

## Public API namespace

Future payment APIs remain under `/api/v1`. This milestone does not add HTTP routes.

## Application use cases

- `CreatePaymentRequest`
- `QueryPaymentStatus`
- `RecordProviderPaymentEvent`
- `ConfirmPayment`

These use cases accept normalized application contracts and do not depend on HTTP or provider SDKs.

## Confirmation rule

Frontend redirects, client success flags, screenshots, and unverified provider events are not payment confirmation.

Confirmation requires trusted normalized provider facts, reference/transaction match, exact amount and currency match, acceptable status, idempotency protection, and reconciliation compatibility.

Unknown and timeout states remain unresolved and fail closed.
