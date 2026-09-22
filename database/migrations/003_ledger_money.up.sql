const { Money } = require('./money');

class LedgerAccount {
  constructor({ id, code, name, category, currency, status = 'ACTIVE' }) {
    if (!id || !code || !name || !category || !currency) {
      throw new Error('LedgerAccount requires id, code, name, category, and currency.');
    }
    if (!Money.isValidCurrency(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    if (!['PROVIDER_RECEIVABLE', 'CUSTOMER_FUNDS_PAYABLE', 'MERCHANT_SETTLEMENT_PAYABLE', 'REFUND_PAYABLE', 'PROVIDER_CASH_CLEARING', 'PLATFORM_FEE_REVENUE', 'PROVIDER_FEE_EXPENSE', 'REFUND_EXPENSE', 'CHARGEBACK_OR_REVERSAL_EXPENSE', 'OPERATIONAL_ADJUSTMENT'].includes(category)) {
      throw new Error(`Unsupported account category: ${category}`);
    }
    if (!['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
      throw new Error(`Unsupported account status: ${status}`);
    }
    this.id = id;
    this.code = code;
    this.name = name;
    this.category = category;
    this.currency = currency;
    this.status = status;
    Object.freeze(this);
  }
}

class LedgerEntry {
  constructor({ accountId, direction, amount, currency }) {
    if (!accountId) throw new Error('LedgerEntry accountId is required.');
    if (!['DEBIT', 'CREDIT'].includes(direction)) throw new Error(`Unsupported direction: ${direction}`);
    if (!(amount instanceof Money)) throw new TypeError('LedgerEntry amount must be a Money value.');
    if (currency && currency !== amount.currency) throw new Error('LedgerEntry currency mismatch.');
    this.accountId = accountId;
    this.direction = direction;
    this.amount = amount;
    this.currency = amount.currency;
    Object.freeze(this);
  }
}

class LedgerOperation {
  constructor({ id, transactionId = null, operationType, idempotencyKey, providerReference = null, entries = [], status = 'PENDING', reversesOperationId = null }) {
    if (!id) throw new Error('LedgerOperation id is required.');
    if (!operationType) throw new Error('LedgerOperation operationType is required.');
    if (!idempotencyKey) throw new Error('LedgerOperation idempotencyKey is required.');
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('LedgerOperation requires at least one entry.');
    }
    this.id = id;
    this.transactionId = transactionId;
    this.operationType = operationType;
    this.idempotencyKey = idempotencyKey;
    this.providerReference = providerReference;
    this.entries = entries.map((entry) => {
      if (entry instanceof LedgerEntry) return entry;
      return new LedgerEntry(entry);
    });
    this.status = status;
    this.reversesOperationId = reversesOperationId;
    this.createdAt = new Date().toISOString();
    this.isCompensated = Boolean(reversesOperationId);
    Object.freeze(this);
  }

  debitTotal() {
    return this.entries.filter((entry) => entry.direction === 'DEBIT').reduce((sum, entry) => sum.add(entry.amount), Money.fromMinorUnits(0n, this.entries[0].currency));
  }

  creditTotal() {
    return this.entries.filter((entry) => entry.direction === 'CREDIT').reduce((sum, entry) => sum.add(entry.amount), Money.fromMinorUnits(0n, this.entries[0].currency));
  }

  isBalanced() {
    if (!this.entries.length) return false;
    const currencies = new Set(this.entries.map((entry) => entry.currency));
    if (currencies.size !== 1) return false;
    return this.debitTotal().equals(this.creditTotal());
  }

  validatePostable() {
    if (!this.isBalanced()) {
      throw new Error('Ledger operation is unbalanced.');
    }
    if (this.entries.some((entry) => !entry.amount.isPositive())) {
      throw new Error('Ledger entry amounts must be positive.');
    }
    if (this.entries.some((entry) => entry.currency !== this.entries[0].currency)) {
      throw new Error('Ledger operation cannot mix currencies.');
    }
  }
}

class InMemoryLedgerRepository {
  constructor() {
    this.operations = new Map();
    this.entries = new Map();
  }

  allOperations() {
    return Array.from(this.operations.values());
  }

  getOperationById(id) {
    return this.operations.get(id) ?? null;
  }

  getOperationByIdempotencyKey(idempotencyKey) {
    for (const operation of this.operations.values()) {
      if (operation.idempotencyKey === idempotencyKey) return operation;
    }
    return null;
  }

  createOperation(operation) {
    const existing = this.getOperationByIdempotencyKey(operation.idempotencyKey);
    if (existing) {
      return existing;
    }
    this.operations.set(operation.id, operation);
    for (const entry of operation.entries) {
      const key = `${operation.id}:${entry.accountId}:${entry.direction}`;
      this.entries.set(key, entry);
    }
    return operation;
  }

  createCompensatingOperation(original, compensatingOperation) {
    const created = this.createOperation(compensatingOperation);
    return created;
  }
}

class LedgerPostingService {
  constructor(repository) {
    this.repository = repository;
  }

  createCompensatingOperation(original, { id, idempotencyKey, transactionId = original.transactionId }) {
    const entries = original.entries.map((entry) => {
      const newDirection = entry.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT';
      return new LedgerEntry({
        accountId: entry.accountId,
        direction: newDirection,
        amount: entry.amount,
        currency: entry.currency
      });
    });
    const operation = new LedgerOperation({
      id,
      transactionId,
      operationType: 'REVERSAL',
      idempotencyKey,
      reversesOperationId: original.id,
      entries
    });
    operation.validatePostable();
    return this.repository.createCompensatingOperation(original, operation);
  }

  postOperation(command) {
    const { id, transactionId = null, operationType, idempotencyKey, providerReference = null, entries } = command;
    const operation = new LedgerOperation({
      id,
      transactionId,
      operationType,
      idempotencyKey,
      providerReference,
      entries,
      status: 'POSTED'
    });
    operation.validatePostable();
    const existing = this.repository.getOperationByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }
    const saved = this.repository.createOperation(operation);
    return saved;
  }
}

module.exports = {
  LedgerAccount,
  LedgerEntry,
  LedgerOperation,
  LedgerPostingService,
  InMemoryLedgerRepository
};
