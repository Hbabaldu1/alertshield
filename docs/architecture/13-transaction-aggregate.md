const test = require('node:test');
const assert = require('node:assert/strict');
const { TransactionAggregate } = require('../src/lib/transaction-aggregate');

function buildTransaction() {
  return new TransactionAggregate({
    id: 'tx-123',
    merchantId: 'merchant-1',
    buyerId: 'buyer-1',
    amountMinor: 150000n,
    currency: 'NGN',
    description: 'test order',
  });
}

test('Transaction starts in DRAFT and can request payment', () => {
  const tx = buildTransaction();
  tx.requestPayment('ops');
  assert.equal(tx.status, 'PAYMENT_PENDING');
  assert.equal(tx.paymentStatus, 'AWAITING_PAYMENT');
});

test('Payment confirmation can fund the transaction', () => {
  const tx = buildTransaction();
  tx.requestPayment('ops');
  tx.finalizePayment('ops');
  assert.equal(tx.paymentStatus, 'CONFIRMED');
  assert.equal(tx.status, 'FUNDED');
});

test('Lifecycle transitions reject invalid paths', () => {
  const tx = buildTransaction();
  assert.throws(() => tx.transitionLifecycle('SHIPPED', 'ops'));
});

test('A blocking dispute prevents completion', () => {
  const tx = buildTransaction();
  tx.requestPayment('ops');
  tx.finalizePayment('ops');
  tx.transitionLifecycle('FUNDED', 'ops');
  tx.setDisputeStatus('OPEN');
  assert.throws(() => tx.completeTransaction('ops'));
});

test('Hold states block protected progression', () => {
  const tx = buildTransaction();
  tx.requestPayment('ops');
  tx.finalizePayment('ops');
  tx.placeHold('COMPLIANCE_HOLD');
  assert.throws(() => tx.transitionLifecycle('READY_TO_SHIP', 'ops'));
});

test('Inspection opens and accepts without auto-release', () => {
  const tx = buildTransaction();
  tx.requestPayment('ops');
  tx.finalizePayment('ops');
  tx.transitionLifecycle('FUNDED', 'ops');
  tx.transitionLifecycle('READY_TO_SHIP', 'ops');
  tx.transitionLifecycle('SHIPPED', 'ops');
  tx.transitionLifecycle('DELIVERED', 'ops');
  tx.openInspection({ expiresAt: '2030-01-01T00:00:00.000Z', actor: 'ops' });
  assert.equal(tx.status, 'INSPECTION');
  assert.equal(tx.inspectionStatus, 'OPEN');
  tx.acceptInspection('ops');
  assert.equal(tx.inspectionStatus, 'ACCEPTED');
  tx.completeTransaction('ops');
  assert.equal(tx.status, 'COMPLETED');
});

test('Inspection expiration transitions to EXPIRED', () => {
  const tx = buildTransaction();
  tx.requestPayment('ops');
  tx.finalizePayment('ops');
  tx.transitionLifecycle('FUNDED', 'ops');
  tx.transitionLifecycle('READY_TO_SHIP', 'ops');
  tx.transitionLifecycle('SHIPPED', 'ops');
  tx.transitionLifecycle('DELIVERED', 'ops');
  tx.openInspection({ expiresAt: '2030-01-01T00:00:00.000Z', actor: 'ops' });
  tx.expireInspection('ops');
  assert.equal(tx.status, 'EXPIRED');
  assert.equal(tx.inspectionStatus, 'EXPIRED');
});

test('Transaction events are append-only facts', () => {
  const tx = buildTransaction();
  tx.requestPayment('ops');
  tx.finalizePayment('ops');
  assert.ok(tx.events.length >= 3);
  assert.equal(tx.events[0].type, 'TransactionCreated');
});
