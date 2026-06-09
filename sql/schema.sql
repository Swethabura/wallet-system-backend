-- ============================
-- WALLETS
-- ============================

CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    balance NUMERIC(18,2) NOT NULL DEFAULT 0.00,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT wallets_balance_non_negative
        CHECK (balance >= 0)
);


-- CREATE INDEX idx_wallets_user_id
-- ON wallets(user_id);


-- ============================
-- LEDGER ENTRIES
-- ============================

CREATE TYPE ledger_entry_type AS ENUM (
    'credit',
    'debit'
);


CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,

    wallet_id BIGINT NOT NULL,

    transaction_group UUID NOT NULL,

    entry_type ledger_entry_type NOT NULL,

    amount NUMERIC(18,2) NOT NULL,

    reference_wallet_id BIGINT,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ledger_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reference_wallet
        FOREIGN KEY (reference_wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    CONSTRAINT ledger_amount_positive
        CHECK (amount > 0)
);


CREATE INDEX idx_ledger_wallet_id
ON ledger_entries(wallet_id);

CREATE INDEX idx_ledger_transaction_group
ON ledger_entries(transaction_group);

CREATE INDEX idx_ledger_created_at
ON ledger_entries(created_at);



-- ============================
-- IDEMPOTENCY KEYS
-- ============================

CREATE TABLE idempotency_keys (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    idempotency_key VARCHAR(255) NOT NULL,

    request_hash TEXT NOT NULL,

    response_payload JSONB,

    status_code INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_idempotency
        UNIQUE (user_id, idempotency_key),

    CONSTRAINT status_code_valid
        CHECK (
            status_code IS NULL
            OR (status_code >= 100 AND status_code <= 599)
        )
);


-- CREATE INDEX idx_idempotency_key
-- ON idempotency_keys(idempotency_key);



-- ============================
-- UPDATED_AT TRIGGER
-- ============================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TABLE outbox_events(
    id BIGSERIAL PRIMARY KEY,

    event_type VARCHAR(100) NOT NULL,
    
    routing_key VARCHAR(150) NOT NULL,

    payload JSONB NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'published', 'failed')),

    retry_count INT NOT NULL DEFAULT 0
        CHECK (retry_count >= 0),

    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_status_created 
ON outbox_events(status, created_at);


CREATE TABLE processed_messages (
    id BIGSERIAL PRIMARY KEY,
    consumer_name VARCHAR(100) NOT NULL,
    message_id UUID NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (consumer_name, message_id)
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);