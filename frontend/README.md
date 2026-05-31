# Frontend - Purchase Request Management

Web application built with **Next.js 16**, **React 19**, **TypeScript**, and **Material UI** for the purchase request management challenge.

This frontend integrates with the backend API from the same monorepo and provides authentication, dashboard metrics, purchase request workflows, approval actions, history tracking, and user administration.

## Overview

The application implements the main flows requested in the challenge:

- User authentication
- Dashboard with request status summary
- Purchase request listing with filtering, sorting, and pagination
- Purchase request creation
- Request detail view with action history
- Contextual actions for approve, reject, and cancel
- User management for administrators

The project follows a feature-based structure and uses internal Next.js API routes to mediate secure communication with the backend.

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Material UI**
- **React Hook Form**
- **Zod**

## Main Features

### Authentication

- Login form with validation
- Session handling through **HttpOnly cookies**
- Session resolution via internal routes:
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- Protected navigation for authenticated areas

### Dashboard

- KPI summary grouped by request status:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
  - `CANCELLED`

### Purchase Requests

- Table view with:
  - status filter
  - table sorting
  - pagination
- New request form
- Request details view
- Chronological action history
- Contextual actions:
  - approve
  - reject
  - cancel
- Confirmation dialogs, loading states, and toast feedback

### User Management

- Available only for `ADMIN`
- User listing
- User creation
- User editing
- Role and approval level rules aligned with the backend contract

## Access Rules Reflected in the UI

### Sidebar Visibility

- `ADMIN`: Dashboard, Solicitações, Usuários
- `APROVADOR`: Dashboard, Solicitações
- `SOLICITANTE`: Dashboard, Solicitações

### Purchase Request Creation

The "Criar solicitação" button is shown only for:

- `LEVEL_0`
- `LEVEL_3`

### User Management

The users area is visible only for:

- `ADMIN`

> Frontend visibility rules improve UX, but backend authorization remains the final security layer.

## Project Structure

```text
frontend/
├── app/                          # App Router pages and internal API routes
│   ├── api/
│   ├── dashboard/
│   ├── login/
│   ├── solicitacoes/
│   └── usuarios/
├── components/
│   └── providers/
├── features/
│   ├── app-shell/
│   ├── auth/
│   ├── dashboard/
│   ├── requests/
│   └── users/
├── lib/                          # Shared API helpers, CSRF, theme, utilities
├── public/
└── package.json
```

## Prerequisites

Make sure you have the following installed:

- **Node.js 20+**
- **npm 10+**

You also need the backend application running locally.

Expected local ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

## Repository Setup

Before starting development, run the repository setup script from the monorepo root:

```bash
./setup.sh
```

This configures the repository protections required by the challenge.

## Installation

From the repository root:

```bash
cd frontend
npm install
```

## Environment Variables

The project expects the following environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Files available in this folder:

- `.env.example` - example configuration to copy from
- `.env.local` - local development configuration already prepared for the default backend port

If you need to recreate the local file manually, run:

```bash
cp .env.example .env.local
```

### Notes

- `NEXT_PUBLIC_API_URL` must point to the backend API base URL.
- In local development, the expected value is `http://localhost:8080`.
- Do not store secrets in the frontend environment.
- The frontend does not persist JWTs in `localStorage`; session handling is cookie-based.
- After creating or editing `.env.local`, restart the Next.js dev server.

## Running the Application

### Development

```bash
cd frontend
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

### Production Build

```bash
cd frontend
npm run build
npm run start
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Recommended Local Workflow

1. Start the backend on port `8080`
2. Confirm `frontend/.env.local` is present and points to the backend URL
3. Install frontend dependencies
4. Run `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Application Routes

### Public Route

- `/login`

### Authenticated Routes

- `/` - dashboard
- `/solicitacoes` - purchase request list
- `/solicitacoes/nova` - create new purchase request
- `/solicitacoes/[id]` - purchase request details
- `/usuarios` - user list
- `/usuarios/novo` - create user
- `/usuarios/[id]/editar` - edit user

## Backend Integration

The browser does not call the backend API directly for sensitive authenticated flows. Instead, the frontend uses internal Next.js routes such as:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/session`
- `/api/auth/register`
- `/api/requests`
- `/api/users`

These internal routes:

- centralize error handling
- mediate authentication through cookies
- reduce direct exposure of backend details to the client
- keep request logic organized by feature

## Validation and Feedback Patterns

The frontend uses:

- `react-hook-form` for form state
- `zod` for validation
- loading indicators during async actions
- toast messages for success and error feedback
- confirmation dialogs for destructive or important actions

## Troubleshooting

### Login fails

Check:

- if the backend is running on `http://localhost:8080`
- if `NEXT_PUBLIC_API_URL` is configured correctly
- if browser cookies are enabled for localhost

### Protected pages redirect unexpectedly

Check:

- whether the backend is available
- whether the current session is still valid
- the browser network tab for `401`, `403`, or `503` responses

### Request data does not load

Check:

- if the backend endpoints are available
- if the authenticated user has permission for the requested action
- if there are validation or state transition errors such as `422`

### Build fails

Run:

```bash
npm run lint
npm run build
```

and fix the reported issues before proceeding.

## Technical Decisions

- **App Router** for routing and page organization
- **Feature-based structure** for scalability
- **Internal Next.js API routes** for authenticated integration with the backend
- **HttpOnly session cookie** instead of browser token persistence
- **Material UI** for UI composition and consistency
- **Custom hooks and services** for separation of concerns

## Known Limitations

- The frontend depends on the backend contract already being available and correctly configured.
- Some list behaviors depend on what the backend currently exposes.
- Backend authorization remains the ultimate source of truth for all protected actions.

## Related Documentation

- Root challenge description: [../README.md](/Users/joao.silva/Documents/developer-challenge/README.md)
- Backend setup and API notes: [../backend/README.md](/Users/joao.silva/Documents/developer-challenge/backend/README.md)
