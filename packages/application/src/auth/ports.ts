import type { Database, TransactionClient } from "@slock/infrastructure/database";

export interface AuthSessionRecord { id: string; user_id: string; expires_at: Date; revoked_at: Date | null; role: string; status: string; }
export interface AuthRepository {
  findUserByEmail(email: string, executor?: Database | TransactionClient): Promise<any | null>;
  findSessionByHash(tokenHash: string, executor?: Database | TransactionClient): Promise<AuthSessionRecord | null>;
  revokeSession(sessionId: string, executor?: Database | TransactionClient): Promise<void>;
  recordAuthEvent(input: Record<string, unknown>, executor?: Database | TransactionClient): Promise<void>;
}
