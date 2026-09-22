const test = require('node:test');
const assert = require('node:assert/strict');
const { Money } = require('../src/lib/ledger');
const {
  FAILURE_CODES,
  PaymentBoundaryError,
  normalizeStatus,
  normalizePayment,
  assertConfirmationFacts,
  ConfirmPayment,
} = require('../packages/application/src/payments/payment-boundary');

const transaction = { id: 'tx-1', amountMinor: 500000n, currency: 'NGN' };
const payment = (overrides = {}) => ({
  provider: 'unselected-provider',
  providerReference: 'ref-1',
  transactionId: 'tx-1',
  amount: Money.fromMinorUnits(500000n, 'NGN'),
  status: 'SUCCEEDED',
  ...overrides,
});

test('normalizes successful payment with exact Money', () => {
  const result = normalizePayment(payment());
  assert.equal(result.status, 'SUCCEEDED');
  assert.equal(result.amount.amountMinor, 500000n);
  assert.equal(result.amount.currency, 'NGN');
});

test('unknown provider status remains UNKNOWN', () => {
  assert.equal(normalizeStatus('provider_pending_unknown'), 'UNKNOWN');
});

test('confirmation rejects untrusted frontend success evidence', () => {
  assert.throws(() => assertConfirmationFacts({ transaction, payment: normalizePayment(payment()), trustedSource: false, reconciliationStatus: 'MATCHED' }), (error) => error.code === FAILURE_CODES.INVALID_SIGNATURE);
});

test('confirmation rejects amount mismatch', () => {
  assert.throws(() => assertConfirmationFacts({ transaction, payment: normalizePayment(payment({ amount: Money.fromMinorUnits(499999n, 'NGN') })), trustedSource: true, reconciliationStatus: 'MATCHED' }), (error) => error.code === FAILURE_CODES.AMOUNT_MISMATCH);
});

test('confirmation rejects currency mismatch', () => {
  assert.throws(() => assertConfirmationFacts({ transaction, payment: normalizePayment(payment({ amount: Money.fromMinorUnits(500000n, 'USD') })), trustedSource: true, reconciliationStatus: 'MATCHED' }), (error) => error.code === FAILURE_CODES.CURRENCY_MISMATCH);
});

test('confirmation rejects reference mismatch', () => {
  assert.throws(() => assertConfirmationFacts({ transaction, payment: normalizePayment(payment({ transactionId: 'tx-other' })), trustedSource: true, reconciliationStatus: 'MATCHED' }), (error) => error.code === FAILURE_CODES.REFERENCE_MISMATCH);
});

test('timeout/unknown status is unresolved, not failed', () => {
  assert.throws(() => assertConfirmationFacts({ transaction, payment: normalizePayment(payment({ status: 'UNKNOWN' })), trustedSource: true, reconciliationStatus: 'MATCHED' }), (error) => error.code === FAILURE_CODES.UNKNOWN_PROVIDER_STATUS && error.retryable === true);
});

test('reconciliation remains required before confirmation', () => {
  assert.throws(() => assertConfirmationFacts({ transaction, payment: normalizePayment(payment()), trustedSource: true, reconciliationStatus: 'PENDING' }), (error) => error.code === FAILURE_CODES.RECONCILIATION_REQUIRED);
});

test('confirm use case delegates one guarded effect to repository', async () => {
  let calls = 0;
  const service = new ConfirmPayment({
    transactionRepository: { getById: async () => transaction },
    paymentRepository: { confirmOnce: async (input) => { calls += 1; return input.payment; } },
  });
  await service.execute({ transactionId: 'tx-1', payment: payment(), trustedSource: true, reconciliationStatus: 'MATCHED', idempotencyKey: 'confirm-1' });
  assert.equal(calls, 1);
});

test('provider event repository duplicate is represented without a second effect', async () => {
  const events = new Set();
  const repo = { record: async (event) => {
    const key = `${event.provider}:${event.eventId}`;
    if (events.has(key)) return { duplicate: true, event };
    events.add(key);
    return { duplicate: false, event };
  } };
  const { RecordProviderPaymentEvent } = require('../packages/application/src/payments/payment-boundary');
  const service = new RecordProviderPaymentEvent(repo);
  const event = { provider: 'unselected-provider', eventId: 'evt-1', eventType: 'payment.succeeded', verified: true, payment: payment() };
  assert.equal((await service.execute(event)).duplicate, false);
  assert.equal((await service.execute(event)).duplicate, true);
});
