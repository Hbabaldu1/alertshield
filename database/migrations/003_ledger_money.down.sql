-- M1-04 ledger primitives and accounting posture.
CREATE TYPE IF NOT EXISTS ledger_account_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
ALTER TYPE ledger_operation_status ADD VALUE IF NOT EXISTS 'VOIDED';

ALTER TABLE ledger_accounts
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS status ledger_account_status NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE ledger_accounts
SET name = COALESCE(name, account_code)
WHERE name IS NULL;

ALTER TABLE ledger_accounts
  ALTER COLUMN name SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_accounts_code_uidx
ON ledger_accounts(code);

ALTER TABLE ledger_operations
  ADD COLUMN IF NOT EXISTS reverses_operation_id UUID REFERENCES ledger_operations(id),
  ADD CONSTRAINT ledger_operation_type_check CHECK (
    operation_type IN ('PAYMENT_RECOGNITION','SETTLEMENT_RECOGNITION','PAYOUT_RECOGNITION','REFUND_RECOGNITION','FEE_RECOGNITION','REVERSAL','ADJUSTMENT')
  ),
  ADD CONSTRAINT ledger_operation_status_check CHECK (
    status IN ('PENDING','POSTED','VOIDED')
  );

CREATE INDEX IF NOT EXISTS ledger_operations_reversal_idx
ON ledger_operations(reverses_operation_id);

CREATE INDEX IF NOT EXISTS ledger_account_status_idx
ON ledger_accounts(status, currency);

ALTER TABLE ledger_entry_lines
  ADD CONSTRAINT ledger_entry_lines_amount_positive CHECK (amount_minor > 0);

-- This is a domain-neutral ledger. External funds remain outside this schema.
