const { strict: assert } = require('node:assert');
const test = require('node:test');
const { Money } = require('../src/lib/money');
const { LedgerOperation, LedgerPostingService, InMemoryLedgerRepository, LedgerEntry } = require('../src/lib/ledger');

test('Money parses NGN decimal strings into minor units', () => {
  const money = Money.fromDecimalString('1500.50', 'NGN');
  assert.equal(money.amountMinor, 150050n);
  assert.equal(money.currency, 'NGN');
});

test('Money addition and subtraction use exact integer arithmetic', () => {
  const a = Money.fromMinorUnits(150000n, 'NGN');
  const b = Money.fromMinorUnits(500n, 'NGN');
  assert.equal(a.add(b).amountMinor, 150500n);
  assert.equal(a.subtract(b).amountMinor, 149500n);
});

test('Money comparison and equality are deterministic', () => {
  const a = Money.fromMinorUnits(100n, 'NGN');
  const b = Money.fromMinorUnits(100n, 'NGN');
  const c = Money.fromMinorUnits(200n, 'NGN');
  assert.equal(a.equals(b), true);
  assert.equal(a.compare(c), -1);
  assert.equal(c.isPositive(), true);
});

test('Money rejects currency mismatch in arithmetic', () => {
  assert.throws(() => Money.fromMinorUnits(100n, 'NGN').add(Money.fromMinorUnits(50n, 'USD')));
});

test('Money rejects malformed values and scientific notation', () => {
  assert.throws(() => Money.fromDecimalString('1e3', 'NGN'));
  assert.throws(() => Money.fromDecimalString('-5.00', 'NGN'));
  assert.throws(() => Money.fromDecimalString('1.234', 'NGN'));
  assert.throws(() => Money.fromDecimalString('NaN', 'NGN'));
});

test('Unbalanced ledger operation fails validation', () => {
  const operation = new LedgerOperation({
    id: 'op-1',
    operationType: 'PAYMENT_RECOGNITION',
    idempotencyKey: 'op-1',
    entries: [
      new LedgerEntry({ accountId: 'a1', direction: 'DEBIT', amount: Money.fromMinorUnits(100n, 'NGN') }),
      new LedgerEntry({ accountId: 'a2', direction: 'CREDIT', amount: Money.fromMinorUnits(50n, 'NGN') })
    ]
  });
  assert.equal(operation.isBalanced(), false);
  assert.throws(() => operation.validatePostable());
});

test('Balanced ledger posting succeeds', () => {
  const repo = new InMemoryLedgerRepository();
  const service = new LedgerPostingService(repo);
  const operation = service.postOperation({
    id: 'op-2',
    transactionId: 'tx-1',
    operationType: 'PAYMENT_RECOGNITION',
    idempotencyKey: 'op-2',
    entries: [
      { accountId: 'a1', direction: 'DEBIT', amount: Money.fromMinorUnits(1000n, 'NGN') },
      { accountId: 'a2', direction: 'CREDIT', amount: Money.fromMinorUnits(1000n, 'NGN') }
    ]
  });
  assert.equal(operation.status, 'POSTED');
  assert.equal(repo.getOperationByIdempotencyKey('op-2').status, 'POSTED');
});

test('Duplicate idempotency key is not reposted', () => {
  const repo = new InMemoryLedgerRepository();
  const service = new LedgerPostingService(repo);
  const command = {
    id: 'dup-1',
    transactionId: 'tx-2',
    operationType: 'PAYMENT_RECOGNITION',
    idempotencyKey: 'duplicate-key',
    entries: [
      { accountId: 'a1', direction: 'DEBIT', amount: Money.fromMinorUnits(200n, 'NGN') },
      { accountId: 'a2', direction: 'CREDIT', amount: Money.fromMinorUnits(200n, 'NGN') }
    ]
  };
  const first = service.postOperation(command);
  const second = service.postOperation(command);
  assert.equal(first.id, second.id);
  assert.equal(repo.allOperations().length, 1);
});

test('Compensating operation creates a new operation without modifying original', () => {
  const repo = new InMemoryLedgerRepository();
  const service = new LedgerPostingService(repo);
  const original = service.postOperation({
    id: 'orig',
    transactionId: 'tx-3',
    operationType: 'PAYMENT_RECOGNITION',
    idempotencyKey: 'orig-key',
    entries: [
      { accountId: 'a1', direction: 'DEBIT', amount: Money.fromMinorUnits(300n, 'NGN') },
      { accountId: 'a2', direction: 'CREDIT', amount: Money.fromMinorUnits(300n, 'NGN') }
    ]
  });
  const reversal = service.createCompensatingOperation(original, { id: 'rev', idempotencyKey: 'rev-key' });
  assert.equal(reversal.reversesOperationId, original.id);
  assert.equal(reversal.status, 'POSTED');
  assert.equal(original.isCompensated, false);
  assert.equal(repo.allOperations().length, 2);
});
