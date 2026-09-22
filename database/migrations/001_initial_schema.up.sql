-- SLock M1-02 initial PostgreSQL schema
-- Reproducible from an empty database. No seed data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('MERCHANT','BUYER','ADMIN','COMPLIANCE','OPERATIONS','SUPPORT');
CREATE TYPE transaction_status AS ENUM ('DRAFT','PAYMENT_PENDING','FUNDED','READY_TO_SHIP','SHIPPED','IN_TRANSIT','DELIVERED','INSPECTION','COMPLETED','CANCELLED','EXPIRED');
CREATE TYPE payment_status AS ENUM ('NOT_CREATED','ACCOUNT_PENDING','AWAITING_PAYMENT','PARTIALLY_PAID','PAID_PENDING_RECONCILIATION','CONFIRMED','AMOUNT_MISMATCH','FAILED','REVERSED','UNKNOWN','REFUND_PENDING','REFUNDED','PARTIALLY_REFUNDED');
CREATE TYPE shipment_status AS ENUM ('NOT_CREATED','CREATED','DISPATCHED','IN_TRANSIT','DELIVERED','DELIVERY_EXCEPTION','MANUALLY_CONFIRMED','UNKNOWN');
CREATE TYPE inspection_status AS ENUM ('NOT_STARTED','OPEN','ACCEPTED','EXPIRED');
CREATE TYPE dispute_status AS ENUM ('NONE','OPEN','UNDER_REVIEW','MORE_INFORMATION_REQUIRED','RESOLVED_BUYER','RESOLVED_MERCHANT','PARTIAL_SETTLEMENT','CLOSED');
CREATE TYPE payout_status AS ENUM ('NOT_ELIGIBLE','ELIGIBLE','RELEASE_AUTHORIZED','SUBMISSION_PENDING','SUBMITTED','PENDING','SUCCEEDED','FAILED','UNKNOWN','RECONCILIATION_REQUIRED');
CREATE TYPE hold_type AS ENUM ('NONE','FRAUD_HOLD','COMPLIANCE_HOLD','RECONCILIATION_HOLD','PAYMENT_REVERSAL_HOLD','PAYOUT_HOLD');
CREATE TYPE provider_event_processing_status AS ENUM ('RECEIVED','PROCESSING','PROCESSED','FAILED','QUARANTINED');
CREATE TYPE reconciliation_status AS ENUM ('PENDING','MATCHED','MISMATCHED','RESOLVED','FAILED');
CREATE TYPE ledger_direction AS ENUM ('DEBIT','CREDIT');
CREATE TYPE ledger_operation_status AS ENUM ('PENDING','POSTED','REVERSED','FAILED');
CREATE TYPE risk_level AS ENUM ('LOW','MEDIUM','HIGH','BLOCKED');
CREATE TYPE record_status AS ENUM ('PENDING','ACTIVE','INACTIVE','APPROVED','REJECTED','EXPIRED','VERIFIED');
CREATE TYPE attempt_status AS ENUM ('PENDING','SUBMITTED','SUCCEEDED','FAILED','UNKNOWN');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  status record_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE configuration_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_key TEXT NOT NULL CHECK (length(trim(configuration_key)) > 0),
  version INTEGER NOT NULL CHECK (version > 0),
  configuration_hash TEXT NOT NULL CHECK (length(trim(configuration_hash)) > 0),
  effective_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(configuration_key, version)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference TEXT NOT NULL UNIQUE CHECK (length(trim(public_reference)) > 0),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  buyer_id UUID REFERENCES buyers(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  description TEXT NOT NULL CHECK (length(trim(description)) > 0),
  status transaction_status NOT NULL DEFAULT 'DRAFT',
  payment_status payment_status NOT NULL DEFAULT 'NOT_CREATED',
  shipment_status shipment_status NOT NULL DEFAULT 'NOT_CREATED',
  inspection_status inspection_status NOT NULL DEFAULT 'NOT_STARTED',
  dispute_status dispute_status NOT NULL DEFAULT 'NONE',
  payout_status payout_status NOT NULL DEFAULT 'NOT_ELIGIBLE',
  risk_status risk_level NOT NULL DEFAULT 'LOW',
  compliance_status record_status NOT NULL DEFAULT 'PENDING',
  terms_version_id UUID REFERENCES configuration_versions(id),
  payment_deadline_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  ready_to_ship_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (cancelled_at IS NULL OR cancellation_reason IS NOT NULL),
  CHECK (funded_at IS NULL OR funded_at >= created_at),
  CHECK (completed_at IS NULL OR completed_at >= created_at)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  provider TEXT NOT NULL CHECK (length(trim(provider)) > 0),
  provider_transaction_id TEXT,
  provider_reference TEXT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  status payment_status NOT NULL,
  status_source TEXT NOT NULL CHECK (status_source IN ('SYSTEM','PROVIDER_WEBHOOK','PROVIDER_REQUERY','RECONCILIATION','OPERATIONS')),
  provider_event_id UUID,
  confirmed_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  failure_reason_code TEXT,
  failure_reason_detail TEXT,
  reconciliation_status reconciliation_status NOT NULL DEFAULT 'PENDING',
  raw_reference_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reversed_at IS NULL OR reversed_at >= created_at),
  CHECK (confirmed_at IS NULL OR confirmed_at >= created_at)
);
CREATE UNIQUE INDEX payments_provider_transaction_uidx ON payments(provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
CREATE UNIQUE INDEX payments_provider_reference_uidx ON payments(provider, provider_reference) WHERE provider_reference IS NOT NULL;

CREATE TABLE payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  provider TEXT NOT NULL CHECK (length(trim(provider)) > 0),
  provider_account_id TEXT NOT NULL,
  public_display_account_number TEXT,
  account_number_fingerprint TEXT,
  encrypted_account_number TEXT,
  status record_status NOT NULL DEFAULT 'PENDING',
  provider_created_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_account_id)
);
CREATE INDEX payment_accounts_fingerprint_idx ON payment_accounts(account_number_fingerprint) WHERE account_number_fingerprint IS NOT NULL;

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id),
  provider TEXT,
  provider_shipment_id TEXT,
  tracking_reference TEXT,
  status shipment_status NOT NULL DEFAULT 'NOT_CREATED',
  verification_level TEXT NOT NULL CHECK (verification_level IN ('UNVERIFIED','PROVIDER_VERIFIED','MANUAL')),
  delivery_source TEXT,
  last_provider_event_at TIMESTAMPTZ,
  manual_confirmation_reason TEXT,
  manual_confirmed_by UUID REFERENCES users(id),
  delivery_evidence_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  opened_by UUID NOT NULL REFERENCES users(id),
  status dispute_status NOT NULL DEFAULT 'OPEN',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline_at TIMESTAMPTZ,
  buyer_requested_amount_minor BIGINT CHECK (buyer_requested_amount_minor IS NULL OR buyer_requested_amount_minor >= 0),
  merchant_response TEXT,
  resolution_amount_minor BIGINT CHECK (resolution_amount_minor IS NULL OR resolution_amount_minor >= 0),
  decision_reason TEXT,
  decision_version TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX disputes_one_active_per_transaction_uidx ON disputes(transaction_id) WHERE status IN ('OPEN','UNDER_REVIEW','MORE_INFORMATION_REQUIRED');

CREATE TABLE transaction_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  hold_type hold_type NOT NULL,
  reason_code TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  released_by UUID REFERENCES users(id),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((released_at IS NULL AND released_by IS NULL) OR (released_at IS NOT NULL AND released_by IS NOT NULL))
);

CREATE TABLE transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  event_type TEXT NOT NULL CHECK (event_type ~ '^[A-Z][A-Z0-9_]{2,100}$'),
  actor_type TEXT NOT NULL,
  actor_id UUID,
  source TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transaction_events_order_idx ON transaction_events(transaction_id, created_at, id);

CREATE TABLE transaction_terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  party_type TEXT NOT NULL CHECK (party_type IN ('BUYER','MERCHANT')),
  party_id UUID,
  terms_version_id UUID NOT NULL REFERENCES configuration_versions(id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (length(trim(scope)) > 0),
  idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) > 0),
  request_id TEXT NOT NULL,
  response_status INTEGER CHECK (response_status IS NULL OR response_status BETWEEN 100 AND 599),
  response_hash TEXT,
  resource_type TEXT,
  resource_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(scope, idempotency_key)
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  status payout_status NOT NULL DEFAULT 'NOT_ELIGIBLE',
  provider TEXT,
  provider_payout_id TEXT,
  provider_reference TEXT,
  recipient_reference TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payout_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id),
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  status attempt_status NOT NULL DEFAULT 'PENDING',
  provider_reference TEXT,
  failure_reason_code TEXT,
  failure_reason_detail TEXT,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payout_id, attempt_number)
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  status attempt_status NOT NULL DEFAULT 'PENDING',
  reason TEXT NOT NULL,
  authorized_by UUID REFERENCES users(id),
  provider_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refund_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES refunds(id),
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  status attempt_status NOT NULL DEFAULT 'PENDING',
  provider_reference TEXT,
  failure_reason_code TEXT,
  failure_reason_detail TEXT,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(refund_id, attempt_number)
);

CREATE TABLE provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_reference TEXT,
  occurred_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  processing_status provider_event_processing_status NOT NULL DEFAULT 'RECEIVED',
  processing_attempts INTEGER NOT NULL DEFAULT 0 CHECK (processing_attempts >= 0),
  last_error_code TEXT,
  last_error_detail TEXT,
  next_retry_at TIMESTAMPTZ,
  UNIQUE(provider, event_id)
);
CREATE INDEX provider_events_processing_idx ON provider_events(processing_status, next_retry_at);

CREATE TABLE reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status reconciliation_status NOT NULL DEFAULT 'PENDING',
  cursor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES reconciliation_runs(id),
  provider TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  local_resource_id UUID,
  status reconciliation_status NOT NULL DEFAULT 'PENDING',
  mismatch_type TEXT,
  details JSONB,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reconciliation_items_status_idx ON reconciliation_items(status, created_at);

CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL CHECK (account_type IN ('PROVIDER_RECEIVABLE','CUSTOMER_FUNDS_PAYABLE','MERCHANT_SETTLEMENT_PAYABLE','REFUND_PAYABLE','PROVIDER_CASH_CLEARING','PLATFORM_FEE_REVENUE','PROVIDER_FEE_EXPENSE','REFUND_EXPENSE','CHARGEBACK_OR_REVERSAL_EXPENSE','OPERATIONAL_ADJUSTMENT')),
  currency CHAR(3) NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  owner_type TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  operation_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_reference TEXT,
  status ledger_operation_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES ledger_operations(id),
  ledger_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  direction ledger_direction NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL,
  actor_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  request_id TEXT,
  financial_operation_id UUID,
  reason_code TEXT,
  reason_text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  integrity_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  transaction_id UUID REFERENCES transactions(id),
  risk_level risk_level NOT NULL,
  decision TEXT NOT NULL,
  reason_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (merchant_id IS NOT NULL OR transaction_id IS NOT NULL)
);

CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  document_type TEXT NOT NULL,
  provider_reference TEXT,
  status record_status NOT NULL DEFAULT 'PENDING',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  channel TEXT NOT NULL,
  template_key TEXT NOT NULL,
  status attempt_status NOT NULL DEFAULT 'PENDING',
  provider_reference TEXT,
  sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Access-path indexes
CREATE INDEX transactions_merchant_created_idx ON transactions(merchant_id, created_at DESC);
CREATE INDEX transactions_buyer_idx ON transactions(buyer_id);
CREATE INDEX transactions_status_idx ON transactions(status, updated_at);
CREATE INDEX payments_transaction_idx ON payments(transaction_id);
CREATE INDEX payments_reference_idx ON payments(provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX payments_status_idx ON payments(status, updated_at);
CREATE INDEX shipments_tracking_idx ON shipments(tracking_reference) WHERE tracking_reference IS NOT NULL;
CREATE INDEX shipments_status_idx ON shipments(status, updated_at);
CREATE INDEX disputes_transaction_idx ON disputes(transaction_id);
CREATE INDEX disputes_status_idx ON disputes(status, created_at);
CREATE INDEX transaction_holds_transaction_idx ON transaction_holds(transaction_id, created_at);
CREATE INDEX transaction_holds_type_idx ON transaction_holds(hold_type, created_at);
CREATE INDEX payouts_reference_idx ON payouts(provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX payouts_status_idx ON payouts(status, updated_at);
CREATE INDEX ledger_operations_transaction_idx ON ledger_operations(transaction_id, created_at);
CREATE INDEX ledger_lines_account_idx ON ledger_entry_lines(ledger_account_id, created_at);
CREATE INDEX audit_resource_idx ON audit_logs(resource_type, resource_id, created_at);
CREATE INDEX idempotency_scope_idx ON idempotency_keys(scope, created_at);
CREATE INDEX transaction_terms_transaction_idx ON transaction_terms_acceptances(transaction_id, accepted_at);
CREATE INDEX risk_transaction_idx ON risk_assessments(transaction_id, created_at);

-- Append-only protection for records whose history must not be rewritten.
CREATE OR REPLACE FUNCTION reject_append_only_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'append-only table % cannot be updated or deleted', TG_TABLE_NAME;
END;
$$;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['transaction_events','transaction_terms_acceptances','provider_events','reconciliation_items','ledger_operations','ledger_entry_lines','audit_logs'] LOOP
    EXECUTE format('CREATE TRIGGER %I_append_only BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation()', table_name, table_name);
  END LOOP;
END $$;
