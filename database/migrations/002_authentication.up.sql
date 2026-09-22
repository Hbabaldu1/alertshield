-- M1-03 authentication, MFA, and RBAC persistence.
-- No users, sessions, credentials, or verification records are seeded.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OPS';

CREATE TYPE user_status AS ENUM ('ACTIVE','SUSPENDED','DISABLED','PENDING_VERIFICATION');
CREATE TYPE mfa_method AS ENUM ('TOTP');
CREATE TYPE verification_channel AS ENUM ('EMAIL','PHONE');
CREATE TYPE verification_status AS ENUM ('PENDING','CONSUMED','EXPIRED','REVOKED');

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_uidx ON users (phone_number) WHERE phone_number IS NOT NULL;

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  CHECK (expires_at > created_at)
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id, created_at DESC);
CREATE INDEX auth_sessions_active_idx ON auth_sessions(token_hash, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE mfa_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method mfa_method NOT NULL,
  secret_ciphertext TEXT NOT NULL,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, method)
);

CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel verification_channel NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status verification_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);
CREATE INDEX verification_tokens_user_idx ON verification_tokens(user_id, channel, created_at DESC);
CREATE INDEX verification_tokens_active_idx ON verification_tokens(token_hash, expires_at) WHERE status = 'PENDING';

CREATE TABLE authentication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES auth_sessions(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('LOGIN_SUCCESS','LOGIN_FAILURE','LOGOUT','SESSION_REVOKED','PASSWORD_CHANGED','MFA_ENROLLED','MFA_VERIFIED','MFA_DISABLED','VERIFICATION_REQUESTED','VERIFICATION_COMPLETED','ACCOUNT_LOCKED','ACCOUNT_UNLOCKED','AUTHORIZATION_DENIED')),
  request_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX authentication_events_user_idx ON authentication_events(user_id, created_at DESC);
CREATE INDEX authentication_events_type_idx ON authentication_events(event_type, created_at DESC);

CREATE OR REPLACE FUNCTION reject_authentication_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'authentication_events is append-only';
END;
$$;
CREATE TRIGGER authentication_events_append_only BEFORE UPDATE OR DELETE ON authentication_events
FOR EACH ROW EXECUTE FUNCTION reject_authentication_event_mutation();
