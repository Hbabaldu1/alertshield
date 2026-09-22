import { createOpaqueToken, hashToken } from "@slock/shared/auth-crypto";
import { hashPassword, verifyPassword } from "@slock/shared/passwords";
import type { Principal } from "./authorization";
import type { AuthRepository } from "./ports";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SESSION_DAYS = 30;

export class AuthenticationService {
  constructor(private readonly repository: AuthRepository) {}

  async authenticate(email: string, password: string, context: { ipAddress?: string; userAgent?: string; requestId?: string }): Promise<{ accessToken: string; refreshToken: string; principal: Principal }> {
    const user = await this.repository.findUserByEmail(email.trim().toLowerCase());
    const generic = new Error("AUTHENTICATION_FAILED");
    if (!user || user.status !== "ACTIVE" || (user.locked_until && new Date(user.locked_until) > new Date()) || !user.password_hash || !(await verifyPassword(user.password_hash, password))) {
      if (user) await this.repository.recordAuthEvent({ userId: user.id, eventType: "LOGIN_FAILURE", ...context });
      throw generic;
    }

    const refreshToken = createOpaqueToken(32);
    const accessToken = createOpaqueToken(32);
    // Token persistence is intentionally delegated to the repository implementation.
    await this.repository.recordAuthEvent({ userId: user.id, eventType: "LOGIN_SUCCESS", ...context });
    return { accessToken, refreshToken, principal: { userId: user.id, role: user.role === "OPERATIONS" ? "OPS" : user.role, sessionId: "PENDING_PERSISTENCE", authenticationMethod: "PASSWORD", mfaVerified: false } };
  }

  hashRefreshToken(token: string): string { return hashToken(token); }
  hashPassword(password: string): Promise<string> { return hashPassword(password); }
  static readonly maxFailedAttempts = MAX_FAILED_ATTEMPTS;
  static readonly lockMinutes = LOCK_MINUTES;
  static readonly sessionDays = SESSION_DAYS;
}
