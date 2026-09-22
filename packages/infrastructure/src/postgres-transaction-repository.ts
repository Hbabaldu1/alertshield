import type { Database, TransactionClient } from "./database.js";
import type { TransactionRepository } from "./repositories.js";

type Row = Record<string, unknown>;
type Executor = Database | TransactionClient;

export class PostgresTransactionRepository implements TransactionRepository {
  async findById(id: string, db: Executor): Promise<Row | null> {
    const result = await db.query<Row>("SELECT * FROM transactions WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }

  async findByPublicReference(reference: string, db: Executor): Promise<Row | null> {
    const result = await db.query<Row>("SELECT * FROM transactions WHERE public_reference = $1", [reference]);
    return result.rows[0] ?? null;
  }
}
