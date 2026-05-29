CREATE TYPE user_role AS ENUM ('SOLICITANTE', 'APROVADOR', 'ADMIN');
CREATE TYPE approval_level AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE request_action AS ENUM ('CREATED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    approval_level approval_level,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_role_approval_level CHECK (
        (role = 'SOLICITANTE' AND approval_level IS NULL)
        OR (role = 'APROVADOR' AND approval_level IN ('LEVEL_1', 'LEVEL_2'))
        OR (role = 'ADMIN' AND approval_level = 'LEVEL_3')
    )
);

CREATE TABLE purchase_requests (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(80) NOT NULL,
    status request_status NOT NULL DEFAULT 'PENDING',
    required_approval_level approval_level NOT NULL,
    requester_id BIGINT NOT NULL REFERENCES users(id),
    resolved_by_id BIGINT REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_purchase_requests_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_purchase_requests_resolution CHECK (
        (status = 'PENDING' AND resolved_by_id IS NULL AND resolved_at IS NULL)
        OR (status IN ('APPROVED', 'REJECTED', 'CANCELLED') AND resolved_by_id IS NOT NULL AND resolved_at IS NOT NULL)
    )
);

CREATE TABLE request_history (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    actor_id BIGINT NOT NULL REFERENCES users(id),
    action request_action NOT NULL,
    from_status request_status,
    to_status request_status NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_request_history_created_transition CHECK (
        (action = 'CREATED' AND from_status IS NULL AND to_status = 'PENDING')
        OR (action <> 'CREATED' AND from_status IS NOT NULL)
    )
);

CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_requester_id ON purchase_requests(requester_id);
CREATE INDEX idx_purchase_requests_required_approval_level ON purchase_requests(required_approval_level);
CREATE INDEX idx_request_history_request_id ON request_history(request_id);
CREATE INDEX idx_request_history_actor_id ON request_history(actor_id);
