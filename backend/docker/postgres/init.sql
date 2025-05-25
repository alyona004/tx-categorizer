CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    external_id TEXT NOT NULL,
    source TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    account_number TEXT NOT NULL,
    category TEXT NOT NULL,

    UNIQUE (external_id, source)
);

CREATE INDEX idx_transactions_timestamp_id_desc ON transactions (timestamp DESC, id DESC);