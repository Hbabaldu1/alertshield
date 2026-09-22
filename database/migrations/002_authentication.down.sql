DROP TRIGGER IF EXISTS authentication_events_append_only ON authentication_events;
DROP FUNCTION IF EXISTS reject_authentication_event_mutation();
DROP TABLE IF EXISTS authentication_events, verification_tokens, mfa_credentials, auth_sessions;
DROP INDEX IF EXISTS users_email_lower_uidx;
DROP INDEX IF EXISTS users_phone_number_uidx;
ALTER TABLE users
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS email_verified_at,
  DROP COLUMN IF EXISTS phone_verified_at,
  DROP COLUMN IF EXISTS last_login_at,
  DROP COLUMN IF EXISTS failed_login_count,
  DROP COLUMN IF EXISTS locked_until;
DROP TYPE IF EXISTS verification_status, verification_channel, mfa_method, user_status;
-- OPS is retained because PostgreSQL enum values cannot be safely removed in-place.
