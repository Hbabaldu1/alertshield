import { authenticator } from "otplib";
import { createOpaqueToken, hashToken } from "@slock/shared/auth-crypto";

export interface MfaSecretStore { savePending(userId: string, encryptedSecret: string): Promise<void>; enable(userId: string): Promise<void>; disable(userId: string): Promise<void>; getEnabled(userId: string): Promise<string | null>; }

export class TotpMfaService {
  constructor(private readonly store: MfaSecretStore) {}
  async enroll(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const secret = authenticator.generateSecret();
    await this.store.savePending(userId, hashToken(secret));
    return { secret, otpauthUrl: authenticator.keyuri(userId, "SLock", secret) };
  }
  async verifyEnrollment(userId: string, secret: string, code: string): Promise<boolean> {
    const valid = authenticator.verify({ token: code, secret });
    if (valid) await this.store.enable(userId);
    return valid;
  }
  async disable(userId: string): Promise<void> { await this.store.disable(userId); }
}

export function generateVerificationToken(): string { return createOpaqueToken(24); }
