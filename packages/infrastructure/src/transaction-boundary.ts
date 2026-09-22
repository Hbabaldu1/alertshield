import type { Database, TransactionClient } from "./database.js";

export interface TransactionBoundary {
  run<T>(work: (client: TransactionClient) => Promise<T>): Promise<T>;
}

export class PostgresTransactionBoundary implements TransactionBoundary {
  constructor(private readonly database: Database) {}
  run<T>(work: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.database.transaction(work);
  }
}
