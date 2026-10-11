export const mysqlSchema = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(80) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(80) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_expires_at (expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS wallets (
    user_id VARCHAR(80) PRIMARY KEY,
    coins INT NOT NULL DEFAULT 0,
    spent_coins INT NOT NULL DEFAULT 0,
    lifetime_purchased INT NOT NULL DEFAULT 0,
    tokens_used INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS ledger_entries (
    id VARCHAR(160) PRIMARY KEY,
    user_id VARCHAR(80) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    label VARCHAR(255) NOT NULL,
    coins INT NOT NULL,
    tokens INT NOT NULL,
    model VARCHAR(120) NOT NULL,
    created_at DATETIME NOT NULL,
    metadata_json JSON NOT NULL,
    INDEX idx_ledger_entries_user_created (user_id, created_at),
    INDEX idx_ledger_entries_user_type (user_id, type),
    CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS generation_jobs (
    id VARCHAR(160) PRIMARY KEY,
    user_id VARCHAR(80) NOT NULL,
    kind VARCHAR(80) NOT NULL,
    modality VARCHAR(40) NOT NULL,
    market VARCHAR(40) NOT NULL,
    model VARCHAR(120) NOT NULL,
    status VARCHAR(60) NOT NULL,
    prompt TEXT NOT NULL,
    charge_coins INT NOT NULL,
    provider_job_id VARCHAR(160),
    result_json JSON NOT NULL,
    error_code VARCHAR(120),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_generation_jobs_user_created (user_id, created_at),
    INDEX idx_generation_jobs_user_status (user_id, status),
    CONSTRAINT fk_generation_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];
