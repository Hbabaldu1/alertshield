# M1-03 Authentication Test Plan

The authentication foundation must be validated with isolated test-database fixtures only. Development and production startup never seed users.

Required security cases:

- Argon2id password hash verifies correct password and rejects wrong password.
- suspended and disabled users cannot authenticate.
- expired and revoked sessions cannot authenticate.
- malformed bearer credentials are rejected.
- role permissions are centralized and denied by default.
- merchant ownership mismatch is denied.
- privileged roles require MFA.
- TOTP enrollment and valid/invalid verification behavior is tested.
- verification tokens are single-use, expiring, and hashed.
- authentication events do not contain passwords, tokens, or MFA secrets.
- privileged roles cannot be self-assigned by public registration.

No test creates a production-like account or simulates financial success.
