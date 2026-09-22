import type { Database, TransactionClient } from "@slock/infrastructure/database";
import type { Principal } from "@slock/application/auth/authorization";
import type { AuthRepository } from "@slock/application/auth/ports";

export async function authenticateBearerToken(repository: AuthRepository, token: string, executor?: Database | TransactionClient): Promise<Principal> {
  if (!token || token.length < 32) throw new Error("AUTHENTICATION_FAILED");
  const session = await repository.findSessionByHash(token, executor);
  if (!session || session.revoked_at || new Date(session.expires_at) <= new Date() || ["SUSPENDED", "DISABLED"].includes(session.status)) throw new Error("AUTHENTICATION_FAILED");
  const role = session.role === "OPERATIONS" ? "OPS" : session.role;
  if (!["BUYER", "MERCHANT", "ADMIN", "OPS", "COMPLIANCE"].includes(role)) throw new Error("AUTHENTICATION_FAILED");
  return { userId: session.user_id, role: role as Principal["role"], sessionId: session.id, authenticationMethod: "PASSWORD", mfaVerified: false };
}
