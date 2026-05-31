# Purchase Request Management API

Spring Boot backend for the Kingspan technical challenge. This service manages users, purchase requests, approval workflow, request history, JWT authentication, RBAC-based authorization, and demo seed data for local evaluation.

This README is aligned with the challenge requirements from the repository root `README.md` and with the backend implementation that exists today.

## Overview

The backend provides:

- JWT authentication
- administrative user provisioning
- purchase request creation, listing, detail, cancellation, approval, rejection, and history
- approval routing based on request amount
- standardized success and error responses
- demo seeds for users, requests, and request history
- automated tests for service, controller, security, and repository behavior

## Tech Stack

- Java 21
- Spring Boot 4.0.6
- Spring Web MVC
- Spring Security
- Spring Data JPA
- PostgreSQL
- JJWT
- Springdoc OpenAPI / Swagger UI
- JUnit 5, Mockito, MockMvc

## Implemented Business Rules

### Roles

- `SOLICITANTE`
  - creates purchase requests
  - reads only own requests
  - cancels only own pending requests
- `APROVADOR`
  - reads all requests
  - approves or rejects pending requests when the approval level is compatible
- `ADMIN`
  - manages users
  - reads all requests
  - cancels any pending request
  - approves or rejects requests of any level

### Approval level by amount

| Amount | Required approval level |
| --- | --- |
| `<= 1000.00` | `LEVEL_1` |
| `1000.01` to `10000.00` | `LEVEL_2` |
| `> 10000.00` | `LEVEL_3` |

### Valid state transitions

| Current status | Action | Allowed by |
| --- | --- | --- |
| `PENDING` | `APPROVE` | compatible approver or admin |
| `PENDING` | `REJECT` | compatible approver or admin |
| `PENDING` | `CANCEL` | owner `SOLICITANTE` or `ADMIN` |
| `APPROVED` | any transition | blocked |
| `REJECTED` | any transition | blocked |
| `CANCELLED` | any transition | blocked |

Invalid transitions return `422 Unprocessable Entity` with a descriptive message.

## Project Structure

```text
backend/
├── database/
│   ├── Dockerfile
│   └── init/
│       ├── 01_schema.sql
│       └── 02_seed.sql
├── src/
│   ├── main/java/com/management/products/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── config/
│   │   ├── request/
│   │   ├── security/
│   │   └── user/
│   ├── main/resources/application.properties
│   └── test/java/com/management/products/
├── .env.example
├── docker-compose.yml
├── mvnw
├── mvnw.cmd
├── pom.xml
└── README.md
```

## Prerequisites

Make sure you have:

- Java 21
- Docker and Docker Compose
- a shell capable of executing `./mvnw`

## Environment Variables

Create your local environment file:

```bash
cd backend
cp .env.example .env
```

The backend reads `.env` through `dotenv-java`.

### Required variables

| Variable | Description | Example |
| --- | --- | --- |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `purchase_requests` |
| `DB_USER` | Database username | `purchase_user` |
| `DB_PASSWORD` | Database password | `purchase_password` |
| `JWT_SECRET` | JWT signing secret, at least 32 chars | `8f3c2a91b7e64d2f9c1a5e7b3d8f4a6c9b2e1f7d3a8c6b5e4f1a9d7c3b8e6f2` |
| `JWT_EXPIRATION_MINUTES` | token expiration in minutes | `60` |

## Quick Start

### 1. Start PostgreSQL

```bash
cd backend
docker compose up -d --build
```

Check container health:

```bash
docker compose ps
```

Open a SQL shell if needed:

```bash
docker compose exec database psql -U purchase_user -d purchase_requests
```

### 2. Load schema and demo seeds

The PostgreSQL container automatically loads every SQL script from:

```text
backend/database/init/
```

The backend ships with:

- `01_schema.sql` for schema creation
- `02_seed.sql` for demo users, requests, and request history

These scripts run only when the PostgreSQL volume is initialized for the first time.

If your volume already exists and you want to recreate the database with fresh schema and seeds, run:

```bash
docker compose down -v
docker compose up -d --build
```

### 3. Start the backend

```bash
./mvnw spring-boot:run
```

Application URLs:

- API: [http://localhost:8080](http://localhost:8080)
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## Seeded Demo Data

### Shared password

All seeded users share the same password:

```text
Password@123
```

### Seeded users

| Role | Email | Approval level |
| --- | --- | --- |
| `ADMIN` | `admin@example.com` | `LEVEL_3` |
| `APROVADOR` | `approver1@example.com` | `LEVEL_1` |
| `APROVADOR` | `approver2@example.com` | `LEVEL_2` |
| `SOLICITANTE` | `requester@example.com` | `LEVEL_0` |
| `SOLICITANTE` | `requester2@example.com` | `LEVEL_0` |

### Seeded purchase requests

The seed file also creates requests in different statuses so you can test the workflow immediately:

- pending `LEVEL_1`
- approved `LEVEL_2`
- rejected `LEVEL_3`
- cancelled `LEVEL_1`
- pending `LEVEL_2`
- pending `LEVEL_3`

The corresponding `request_history` rows are also seeded.

### Correct way to use the seeds

Use the seeds when:

- you want a working local environment immediately
- you want known users for manual testing
- you want ready-made requests in different workflow states

Use this reset flow whenever you change the seed SQL or want to restore the original demo data:

```bash
docker compose down -v
docker compose up -d --build
```

Do not expect changes in `database/init/*.sql` to apply automatically to an already initialized volume.

## Authentication and User Management

### Login

`POST /auth/login` is the only public authentication endpoint.

Example:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Password@123"
  }'
```

Successful response:

```json
{
  "data": {
    "token": "jwt-token",
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "name": "Initial Admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "approvalLevel": "LEVEL_3"
    }
  }
}
```

### Register a user

`POST /auth/register` is implemented as an administrative user creation endpoint.

- requires a valid JWT
- requires `ADMIN` privileges
- accepts `name`, `email`, `password`, `role`, and `approvalLevel`
- returns the created user data
- does not auto-login the created user

Example creating a `SOLICITANTE`:

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Requester User",
    "email": "requester3@example.com",
    "password": "Requester@123",
    "role": "SOLICITANTE",
    "approvalLevel": "LEVEL_0"
  }'
```

Example creating an `APROVADOR` level 2:

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type": "application/json" \
  -d '{
    "name": "Senior Approver",
    "email": "approver3@example.com",
    "password": "Approver@123",
    "role": "APROVADOR",
    "approvalLevel": "LEVEL_2"
  }'
```

### Current user

```bash
curl http://localhost:8080/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### Update a user

Administrative update endpoint:

- `PATCH /users/{id}`

It supports partial updates for:

- `name`
- `email`
- `password`
- `role`
- `approvalLevel`

## Purchase Request API

### Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/requests` | create a purchase request |
| `GET` | `/requests` | list requests with optional `status` filter and pagination |
| `GET` | `/requests/{id}` | get request details |
| `PATCH` | `/requests/{id}/cancel` | cancel a request |
| `PATCH` | `/requests/{id}/approve` | approve a request |
| `PATCH` | `/requests/{id}/reject` | reject a request |
| `GET` | `/requests/{id}/history` | list request history |

### Create a request

Example:

```bash
curl -X POST http://localhost:8080/requests \
  -H "Authorization: Bearer <SOLICITANTE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Purchase of notebooks",
    "description": "Five notebooks for the engineering team",
    "amount": 15000.00,
    "category": "EQUIPMENT"
  }'
```

### List requests

Example with status filter and pagination:

```bash
curl "http://localhost:8080/requests?status=PENDING&page=0&size=5&sort=createdAt,desc" \
  -H "Authorization: Bearer <TOKEN>"
```

Behavior:

- `SOLICITANTE` sees only own requests
- `APROVADOR` and `ADMIN` see all requests

### Detail a request

```bash
curl http://localhost:8080/requests/1 \
  -H "Authorization: Bearer <TOKEN>"
```

### Cancel a request

```bash
curl -X PATCH http://localhost:8080/requests/1/cancel \
  -H "Authorization: Bearer <TOKEN>"
```

Rules:

- allowed for request owner when role is `SOLICITANTE`
- allowed for `ADMIN`
- only while request status is `PENDING`

### Approve or reject a request

Optional comment payload:

```json
{
  "comment": "Approved after budget review"
}
```

Approve:

```bash
curl -X PATCH http://localhost:8080/requests/1/approve \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Approved after budget review"
  }'
```

Reject:

```bash
curl -X PATCH http://localhost:8080/requests/1/reject \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Rejected due to budget constraints"
  }'
```

Approval compatibility:

- `LEVEL_1`: any `APROVADOR` or `ADMIN`
- `LEVEL_2`: `APROVADOR` level 2 or `ADMIN`
- `LEVEL_3`: only `ADMIN`

### Request history

```bash
curl http://localhost:8080/requests/1/history \
  -H "Authorization: Bearer <TOKEN>"
```

The history stores:

- action
- actor
- previous status
- new status
- optional comment
- timestamp

## API Response Contract

### Success

All successful operations return a standard envelope:

```json
{
  "data": {}
}
```

### Validation error

Validation failures return `400` with a structured body:

```json
{
  "timestamp": "2026-05-31T13:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "detail": "Validation failed",
  "path": "/requests",
  "errors": [
    "amount must not be null"
  ]
}
```

### Unauthorized and forbidden

- `401` when the request has no valid token
- `403` when the authenticated user lacks permission

### Invalid workflow action

Workflow violations return `422` with a descriptive message, for example:

```json
{
  "detail": "Cannot approve this request because it is already CANCELLED. Only pending requests can be approved."
}
```

## Persistence Model

The database schema is initialized from:

```text
database/init/01_schema.sql
```

Demo data is initialized from:

```text
database/init/02_seed.sql
```

Main tables:

- `users`
- `purchase_requests`
- `request_history`

Key implementation notes:

- PostgreSQL enums are used for roles, approval levels, request status, and history actions
- request concurrency is protected with optimistic locking via `@Version`
- the application validates schema on startup with `spring.jpa.hibernate.ddl-auto=validate`
- demo data is inserted during PostgreSQL initialization through `02_seed.sql`

## Running Tests

### Full test suite

```bash
./mvnw test
```

### Focused test runs

```bash
./mvnw -Dtest=PurchaseRequestServiceTests test
./mvnw -Dtest=PurchaseRequestControllerSecurityTests test
./mvnw -Dtest=SecurityAndRoleValidationTests test
./mvnw -Dtest=PurchaseRequestRepositoryTests test
```

### Important note about repository tests

`PurchaseRequestRepositoryTests` currently point to the local PostgreSQL configured in `.env`.  
That means these tests expect the database from `docker compose up -d --build` to be running before `./mvnw test`.

Because the database is seeded on container initialization, the tests run against a database that already contains the demo users and requests unless you customize the seed flow.

## Useful Commands

Compile:

```bash
./mvnw compile
```

Run the application:

```bash
./mvnw spring-boot:run
```

Package:

```bash
./mvnw package
```

Stop database:

```bash
docker compose down
```

Reset database volume and reload schema plus seeds:

```bash
docker compose down -v
docker compose up -d --build
```

## Troubleshooting

### `401` on protected endpoints even after login

Check that:

- the `Authorization` header uses `Bearer <token>`
- the token is not expired
- the token was generated with the current `JWT_SECRET`

### `POST /auth/register` returns `401` or `403`

That is expected unless you are authenticated as an `ADMIN`.

### I changed the seeds but the data did not update

The SQL scripts inside `database/init/` are applied only when the PostgreSQL volume is created.

Recreate the volume to apply seed changes:

```bash
docker compose down -v
docker compose up -d --build
```

### Database credentials changed but PostgreSQL still rejects login

If the Docker volume was initialized with older credentials, recreate it:

```bash
docker compose down -v
docker compose up -d --build
```

### Port `5432` is already in use

Stop the local process using that port or update the published port in `docker-compose.yml`.

### `./mvnw test` fails on repository tests

Confirm that:

- Docker is running
- `docker compose up -d --build` completed successfully
- the PostgreSQL container is healthy
- `.env` matches the database container credentials

One intentional implementation detail is worth calling out:

- user registration is not public in this backend
- `/auth/register` is treated as an administrative provisioning endpoint
- demo users are provided through database seeds so the project is usable immediately after startup
