# Purchase Request Management API

Spring Boot backend for the Kingspan technical challenge. This service manages users, purchase requests, approval workflow, request history, JWT authentication, and RBAC-based authorization.

## Overview

The backend provides:

- JWT authentication
- Administrative user provisioning
- Purchase request creation, listing, detail, cancellation, approval, rejection, and history
- Approval routing based on request amount
- Standardized validation and business error handling
- Automated tests for service, controller, security, and repository behavior

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
│   └── init/01_schema.sql
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

### 2. Bootstrap the first admin user

Important: in the current implementation, `POST /auth/register` is **admin-only**.  
That means a fresh database has no public registration flow. You must create the first `ADMIN` manually.

Generate a BCrypt password hash with Docker:

```bash
docker run --rm httpd:2.4-alpine htpasswd -nbBC 10 "" "Admin@123" | tr -d ':\n'
```

Use the generated hash in this SQL:

```sql
INSERT INTO users (name, email, password_hash, role, approval_level)
VALUES (
  'Initial Admin',
  'admin@example.com',
  '<PASTE_BCRYPT_HASH_HERE>',
  'ADMIN',
  'LEVEL_3'
);
```

You can run it with:

```bash
docker compose exec database psql -U purchase_user -d purchase_requests
```

### 3. Start the backend

```bash
./mvnw spring-boot:run
```

Application URLs:

- API: [http://localhost:8080](http://localhost:8080)
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

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

Reset database volume:

```bash
docker compose down -v
docker compose up -d --build
```

## Notes About Challenge Alignment

One intentional implementation detail is worth calling out:

- user registration is not public in this backend
- `/auth/register` is treated as an administrative provisioning endpoint

That choice improves security for this codebase, but it means bootstrapping the first admin is a required local setup step.
