# Purchase Request Management API

Spring Boot backend for a purchase request management system with an approval workflow. The application runs locally with Maven, and Docker is used only to run the PostgreSQL database.

## Features

- Spring Boot 4 application using Java 21
- PostgreSQL database managed with Docker Compose
- SQL schema for users, purchase requests, and request history
- JPA, validation, security, and JWT dependencies ready for API implementation
- Environment-based database configuration through `.env`
- Maven Wrapper included, so a local Maven installation is optional

## Tech Stack

- Java 21
- Spring Boot 4.0.6
- Spring Data JPA
- Spring Security
- Spring Validation
- PostgreSQL
- JJWT
- Docker Compose

## Project Structure

```text
backend/
├── database/
│   ├── Dockerfile
│   └── init/01_schema.sql
├── src/
│   ├── main/java/com/management/products/
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

- Java 21
- Docker and Docker Compose
- Git Bash, WSL, Linux, macOS, or another shell capable of running `./mvnw`

## Environment Variables

Create a local `.env` file from the example:

```bash
cd backend
cp .env.example .env
```

The values provided in `.env.example` are intended only for local development and evaluation purposes.

The Spring application loads `.env` at startup through `dotenv-java`. The `.env` file is ignored by Git and must not be committed.

## Database Setup

Start PostgreSQL:

```bash
cd backend
docker compose up -d --build
```

Check the database status:

```bash
docker compose ps
```

View database logs:

```bash
docker compose logs -f database
```

Open a PostgreSQL shell:

```bash
docker compose exec database psql -U purchase_user -d purchase_requests
```

If you changed `DB_USER` or `DB_NAME`, use those values in the `psql` command.

Stop the database:

```bash
docker compose down
```

Stop the database and remove persisted data:

```bash
docker compose down -v
```

Use `docker compose down -v` only when you intentionally want to recreate the database volume. PostgreSQL applies `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` only when the volume is first initialized.

## Database Schema

The schema is initialized automatically from:

```text
database/init/01_schema.sql
```

It creates:

- `users`
- `purchase_requests`
- `request_history`

It also defines PostgreSQL enum types, foreign keys, indexes, and integrity constraints for:

- user role and approval level compatibility
- positive purchase request amounts
- resolved request metadata
- auditable request history transitions

## Run The Backend

Start the database first, then run:

```bash
cd backend
./mvnw spring-boot:run
```

The application starts on:

```text
http://localhost:8080
```

## Testing

Run the test suite:

```bash
cd backend
./mvnw test
```

The current test is the default Spring context test.

## Useful Maven Commands

Compile the project:

```bash
./mvnw compile
```

Run tests:

```bash
./mvnw test
```

Package the application:

```bash
./mvnw package
```

## Troubleshooting

### The application shows unresolved database variables

Confirm that `backend/.env` exists and contains all required variables from `.env.example`.

### PostgreSQL rejects the password

If the Docker volume was created with an old password, either restore the old password in `.env` or recreate the database volume:

```bash
docker compose down -v
docker compose up -d --build
```

### Port 5432 is already in use

Stop the local service using port `5432`, or change the published port in `docker-compose.yml`.

## License

This repository is part of a technical challenge. No explicit license file is provided in this backend folder.
