export type AuthRole = "BUYER" | "MERCHANT" | "ADMIN" | "OPS" | "COMPLIANCE";
export type Permission =
  | "transaction:read"
  | "transaction:create"
  | "transaction:update"
  | "transaction:cancel"
  | "merchant:read"
  | "merchant:update"
  | "dispute:read"
  | "admin:read"
  | "audit:read";

export interface Principal {
  userId: string;
  role: AuthRole;
  sessionId: string;
  authenticationMethod: "PASSWORD" | "MFA";
  mfaVerified: boolean;
}

const permissions: Record<AuthRole, readonly Permission[]> = {
  BUYER: ["transaction:read"],
  MERCHANT: ["transaction:read", "transaction:create", "transaction:update", "transaction:cancel", "merchant:read", "merchant:update"],
  ADMIN: ["transaction:read", "merchant:read", "dispute:read", "admin:read", "audit:read"],
  OPS: ["transaction:read", "merchant:read", "dispute:read", "admin:read"],
  COMPLIANCE: ["merchant:read", "dispute:read", "audit:read"],
};

export function hasPermission(role: AuthRole, permission: Permission): boolean {
  return permissions[role]?.includes(permission) ?? false;
}

export function requirePermission(principal: Principal, permission: Permission): void {
  if (!hasPermission(principal.role, permission)) throw new Error("AUTHORIZATION_DENIED");
}

export function requirePrivilegedMfa(principal: Principal): void {
  if (["ADMIN", "OPS", "COMPLIANCE"].includes(principal.role) && !principal.mfaVerified) {
    throw new Error("MFA_REQUIRED");
  }
}

export function authorizeOwner(principal: Principal, ownerUserId: string): void {
  if (principal.userId !== ownerUserId && !["ADMIN", "OPS", "COMPLIANCE"].includes(principal.role)) {
    throw new Error("AUTHORIZATION_DENIED");
  }
}
