ALTER TABLE ledger_entry_lines
  DROP CONSTRAINT IF EXISTS ledger_entry_lines_amount_positive;

DROP INDEX IF EXISTS ledger_account_status_idx;
DROP INDEX IF EXISTS ledger_operations_reversal_idx;
ALTER TABLE ledger_operations
  DROP CONSTRAINT IF EXISTS ledger_operation_status_check,
  DROP CONSTRAINT IF EXISTS ledger_operation_type_check,
  DROP COLUMN IF EXISTS reverses_operation_id;

DROP INDEX IF EXISTS ledger_accounts_code_uidx;
ALTER TABLE ledger_accounts
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS name;

ALTER TYPE ledger_account_status DROP VALUE IF EXISTS 'ARCHIVED';
ALTER TYPE ledger_account_status DROP VALUE IF EXISTS 'INACTIVE';
ALTER TYPE ledger_account_status DROP VALUE IF EXISTS 'ACTIVE';

-- Keep value addition reversible where practical.
