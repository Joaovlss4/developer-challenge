INSERT INTO users (id, name, email, password_hash, role, approval_level, created_at, updated_at)
VALUES
    (
        1,
        'Initial Admin',
        'admin@example.com',
        '$2y$10$.SG1xKhXet79DMpEYOu24eX1TymKRB6ZWRWOPTUndP4yZxASe.8h.',
        'ADMIN',
        'LEVEL_3',
        '2026-05-01T09:00:00Z',
        '2026-05-01T09:00:00Z'
    ),
    (
        2,
        'Approver Level 1',
        'approver1@example.com',
        '$2y$10$.SG1xKhXet79DMpEYOu24eX1TymKRB6ZWRWOPTUndP4yZxASe.8h.',
        'APROVADOR',
        'LEVEL_1',
        '2026-05-01T09:05:00Z',
        '2026-05-01T09:05:00Z'
    ),
    (
        3,
        'Approver Level 2',
        'approver2@example.com',
        '$2y$10$.SG1xKhXet79DMpEYOu24eX1TymKRB6ZWRWOPTUndP4yZxASe.8h.',
        'APROVADOR',
        'LEVEL_2',
        '2026-05-01T09:10:00Z',
        '2026-05-01T09:10:00Z'
    ),
    (
        4,
        'Requester User',
        'requester@example.com',
        '$2y$10$.SG1xKhXet79DMpEYOu24eX1TymKRB6ZWRWOPTUndP4yZxASe.8h.',
        'SOLICITANTE',
        'LEVEL_0',
        '2026-05-01T09:15:00Z',
        '2026-05-01T09:15:00Z'
    ),
    (
        5,
        'Second Requester',
        'requester2@example.com',
        '$2y$10$.SG1xKhXet79DMpEYOu24eX1TymKRB6ZWRWOPTUndP4yZxASe.8h.',
        'SOLICITANTE',
        'LEVEL_0',
        '2026-05-01T09:20:00Z',
        '2026-05-01T09:20:00Z'
    );

INSERT INTO purchase_requests (
    id,
    title,
    description,
    amount,
    category,
    status,
    required_approval_level,
    requester_id,
    resolved_by_id,
    resolved_at,
    version,
    created_at,
    updated_at
)
VALUES
    (
        1,
        'Office chairs',
        'Replacement of ergonomic chairs for the finance team.',
        850.00,
        'FURNITURE',
        'PENDING',
        'LEVEL_1',
        4,
        NULL,
        NULL,
        0,
        '2026-05-02T10:00:00Z',
        '2026-05-02T10:00:00Z'
    ),
    (
        2,
        'Monitors for engineering',
        'Purchase of 6 external monitors for the engineering team.',
        4200.00,
        'EQUIPMENT',
        'APPROVED',
        'LEVEL_2',
        4,
        3,
        '2026-05-03T15:00:00Z',
        1,
        '2026-05-03T11:00:00Z',
        '2026-05-03T15:00:00Z'
    ),
    (
        3,
        'Cloud migration consulting',
        'Specialized consulting for the upcoming cloud migration project.',
        18500.00,
        'SERVICES',
        'REJECTED',
        'LEVEL_3',
        4,
        1,
        '2026-05-04T16:30:00Z',
        1,
        '2026-05-04T09:30:00Z',
        '2026-05-04T16:30:00Z'
    ),
    (
        4,
        'Team lunch vouchers',
        'Lunch vouchers for the quarterly planning meeting.',
        300.00,
        'BENEFITS',
        'CANCELLED',
        'LEVEL_1',
        4,
        4,
        '2026-05-05T12:00:00Z',
        1,
        '2026-05-05T08:00:00Z',
        '2026-05-05T12:00:00Z'
    ),
    (
        5,
        'Security training program',
        'Annual secure coding and awareness training for all teams.',
        9800.00,
        'TRAINING',
        'PENDING',
        'LEVEL_2',
        5,
        NULL,
        NULL,
        0,
        '2026-05-06T10:15:00Z',
        '2026-05-06T10:15:00Z'
    ),
    (
        6,
        'Warehouse expansion project',
        'Third-party structural assessment for warehouse expansion.',
        25000.00,
        'INFRASTRUCTURE',
        'PENDING',
        'LEVEL_3',
        5,
        NULL,
        NULL,
        0,
        '2026-05-07T14:45:00Z',
        '2026-05-07T14:45:00Z'
    );

INSERT INTO request_history (id, request_id, actor_id, action, from_status, to_status, comment, created_at)
VALUES
    (1, 1, 4, 'CREATED', NULL, 'PENDING', NULL, '2026-05-02T10:00:00Z'),
    (2, 2, 4, 'CREATED', NULL, 'PENDING', NULL, '2026-05-03T11:00:00Z'),
    (3, 2, 3, 'APPROVED', 'PENDING', 'APPROVED', 'Approved after budget review.', '2026-05-03T15:00:00Z'),
    (4, 3, 4, 'CREATED', NULL, 'PENDING', NULL, '2026-05-04T09:30:00Z'),
    (5, 3, 1, 'REJECTED', 'PENDING', 'REJECTED', 'Rejected because the scope needs a revised budget.', '2026-05-04T16:30:00Z'),
    (6, 4, 4, 'CREATED', NULL, 'PENDING', NULL, '2026-05-05T08:00:00Z'),
    (7, 4, 4, 'CANCELLED', 'PENDING', 'CANCELLED', 'Cancelled by the requester before approval.', '2026-05-05T12:00:00Z'),
    (8, 5, 5, 'CREATED', NULL, 'PENDING', NULL, '2026-05-06T10:15:00Z'),
    (9, 6, 5, 'CREATED', NULL, 'PENDING', NULL, '2026-05-07T14:45:00Z');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('purchase_requests_id_seq', (SELECT MAX(id) FROM purchase_requests));
SELECT setval('request_history_id_seq', (SELECT MAX(id) FROM request_history));
