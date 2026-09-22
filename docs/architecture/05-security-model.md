# M1-03 Authentication, MFA and RBAC

## Authentication architecture

SLock uses opaque, random bearer credentials with server-side session persistence. Raw refresh credentials must never be stored; only a cryptographic hash is persisted. Access credentials are short-lived application values and are not logged. Session records support expiry and revocation.

The current foundation contains framework-neutral authentication services and guards. HTTP endpoint wiring is intentionally deferred until the API/application composition is standardized; no second authentication system is introduced.

## Passwords

Passwords use Argon2id through `@node-rs/argon2`. Passwords are never stored in plaintext. Login failures use a generic error to reduce account enumeration. Failed-attempt lockout policy is represented by `failed_login_count` and `locked_until`; the persistence command implementation is deferred to API composition.

## MFA

TOTP is the selected standard mechanism. MFA secrets must be encrypted by the infrastructure secret store before persistence. The current foundation provides enrollment/verification ports and fails closed where secure recovery is unavailable.

MFA is required for `ADMIN`, `OPS`, and `COMPLIANCE`. Merchant MFA is supported by the model but enforcement policy remains application-policy work. Buyer MFA is not mandatory in M1-03.

## Roles and permissions

Implemented roles: `BUYER`, `MERCHANT`, `ADMIN`, `OPS`, `COMPLIANCE`. Existing `OPERATIONS` values are normalized to `OPS` for compatibility with M1-02. The legacy `SUPPORT` enum remains in PostgreSQL because removing enum values is not a safe reversible migration; it is not exposed by the M1-03 authorization map.

Permissions are centralized in `packages/application/src/auth/authorization.ts`.

## Resource authorization

RBAC is not sufficient. Resource ownership must be checked using the authenticated principal and the actual resource owner. Client-supplied IDs do not grant access. Elevated operational roles require explicit permissions.

## Verification and recovery

Email/phone verification persistence is represented by `verification_tokens`. Delivery adapters and secure password recovery endpoints are deferred. No verification is treated as successful without a real delivery/verification event.

## Rate limiting

Sensitive endpoint rate-limit policy is required for login, registration, verification, MFA, refresh, and recovery. The existing foundation has no durable distributed limiter; endpoint wiring must use an approved limiter before production exposure.

## Unresolved decisions

- STATUS: UNKNOWN — REQUIRES CONFIRMATION — exact access-token transport and browser storage policy.
- STATUS: UNKNOWN — REQUIRES CONFIRMATION — secure MFA recovery and break-glass process.
- STATUS: UNKNOWN — REQUIRES CONFIRMATION — production encryption/key-management implementation for MFA secrets.
- STATUS: UNKNOWN — REQUIRES CONFIRMATION — final password and lockout policy.
