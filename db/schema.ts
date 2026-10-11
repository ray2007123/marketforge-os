export const schema = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL DEFAULT 0,
    spent_coins INTEGER NOT NULL DEFAULT 0,
    lifetime_purchased INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    label TEXT NOT NULL,
    coins INTEGER NOT NULL,
    tokens INTEGER NOT NULL,
    model TEXT NOT NULL,
    created_at TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS generation_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    modality TEXT NOT NULL,
    market TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL,
    prompt TEXT NOT NULL,
    charge_coins INTEGER NOT NULL,
    provider_job_id TEXT,
    result_json TEXT NOT NULL DEFAULT '{}',
    error_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_created
    ON ledger_entries(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_type
    ON ledger_entries(user_id, type)`,
  `CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_created
    ON generation_jobs(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_status
    ON generation_jobs(user_id, status)`,
];
