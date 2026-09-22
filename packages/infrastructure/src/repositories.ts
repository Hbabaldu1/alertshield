import type { Database, TransactionClient } from "./database.js";

export interface TransactionRepository {
  findById(id: string, db?: Database | TransactionClient): Promise<unknown | null>;
  findByPublicReference(reference: string, db?: Database | TransactionClient): Promise<unknown | null>;
}

export interface PaymentRepository {
  findById(id: string, db?: Database | TransactionClient): Promise<unknown | null>;
  findByTransactionId(transactionId: string, db?: Database | TransactionClient): Promise<unknown[]>;
}

export interface PaymentAccountRepository {
  findByTransactionId(transactionId: string, db?: Database | TransactionClient): Promise<unknown | null>;
}

export interface ShipmentRepository {
  findByTransactionId(transactionId: string, db?: Database | TransactionClient): Promise<unknown | null>;
}

export interface DisputeRepository {
  findById(id: string, db?: Database | TransactionClient): Promise<unknown | null>;
  findActiveByTransactionId(transactionId: string, db?: Database | TransactionClient): Promise<unknown | null>;
}

export interface ProviderEventRepository {
  findByProviderEvent(provider: string, eventId: string, db?: Database | TransactionClient): Promise<unknown | null>;
}

export interface LedgerRepository {
  findOperationByIdempotencyKey(key: string, db?: Database | TransactionClient): Promise<unknown | null>;
}

export interface AuditRepository {
  findByResource(resourceType: string, resourceId: string, db?: Database | TransactionClient): Promise<unknown[]>;
}

export interface IdempotencyRepository {
  findByKey(scope: string, key: string, db?: Database | TransactionClient): Promise<unknown | null>;
}
