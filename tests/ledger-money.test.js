class LedgerRepository {
  constructor() {
    this.operations = new Map();
    this.entries = new Map();
  }

  createOperation(operation) {
    if (this.operations.has(operation.id)) return this.operations.get(operation.id);
    this.operations.set(operation.id, operation);
    return operation;
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

  getOperationEntries(operationId) {
    return [...this.entries.values()].filter((entry) => entry.operationId === operationId);
  }

  postOperation(operation) {
    return this.createOperation(operation);
  }
}

module.exports = { LedgerRepository };

