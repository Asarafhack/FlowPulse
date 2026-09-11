# FlowPulse — Project Management System

A full-stack project and task management application built for the technical assessment. Authenticated users can create projects, manage tasks, track progress from a dashboard, search/filter their data, and view the live API contract.

## Technology Stack

- **Frontend:** React 19, TanStack Router/Start, Vite, TypeScript, Tailwind CSS, shadcn/ui-style components
- **Backend:** Node.js + Express 5, TypeScript
- **Database:** PostgreSQL through Supabase's server-side PostgreSQL client
- **Authentication:** bcrypt password hashing + JWT (`jose`)
- **Validation:** Zod
- **Security:** Helmet, CORS, authentication middleware, ownership authorization, rate limiting, parameterized Supabase queries
- **API:** REST + OpenAPI 3.0.3

No platform-specific builder or preview runtime is required.

## Features

### Authentication
- Register with full name, email, and password
- Case-insensitive unique email
- Passwords are bcrypt-hashed and never stored in plaintext
- JWT login/session restoration
- Logout clears the client session
- Protected API endpoints
- Authentication rate limiting

### Projects
- Create, view, edit, and delete projects
- Status: Not Started, In Progress, Completed
- Start/end date validation
- Search by project name
- Filter by project status
- Ownership enforcement on every operation

### Tasks
- Multiple tasks per project
- Create, view, edit, delete, and mark tasks completed
- Priority: Low, Medium, High
- Status: Pending, In Progress, Completed
- Due dates
- Search by task name
- Filter by status and priority
- Ownership enforcement through the parent project

### Dashboard
- Total projects
- Total tasks
- Completed tasks
- Pending tasks
- Projects in progress
- Additional priority/status/overdue statistics
- All statistics are calculated from PostgreSQL for the authenticated user

### API Documentation
The application exposes the OpenAPI document at `/api/openapi.json` and the frontend includes a readable API documentation page.

## Architecture

```text
React UI
  ↓
Frontend API client
  ↓
Express REST API (/api/*)
  ↓
Authentication middleware + rate limiting + validation
  ↓
Service layer
  ↓
Repository layer
  ↓
Supabase PostgreSQL
```

The domain service/repository layer is shared by the application's server-side API adapters. Express is the canonical Node.js API process for the assessment submission.

## Database Schema

The database contains three normalized core tables:

- `app_users` — account identity, role, bcrypt password hash, timestamps
- `projects` — projects owned by users
- `tasks` — tasks belonging to projects

Foreign keys connect users → projects → tasks, with cascading deletion from project to tasks. See [`ER-DIAGRAM.md`](./ER-DIAGRAM.md).

## Environment Variables

Copy `.env.example` to `.env` and provide real values locally. **Never commit `.env`.**

Required server variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Optional/configurable variables are documented in `.env.example`.

The Supabase service-role key is server-only and must never be exposed through `VITE_*` variables or frontend code.

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- A Supabase project with the PostgreSQL schema/migrations available in `supabase/`

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env
```

On Windows, create `.env` manually from `.env.example` if `cp` is unavailable.

### Run the Express API

```bash
npm run api
```

The API listens on `http://localhost:3001` by default.

### Run the frontend

```bash
npm run dev -- --port 3000
```

The frontend runs on `http://localhost:3000` and uses `VITE_API_BASE_URL` to call the Express API.

### Run both

```bash
npm run dev:all
```

## Database Setup

1. Create a Supabase project.
2. Apply the SQL migrations/schema in `supabase/` to the project's PostgreSQL database.
3. Copy the project URL and server-only service-role key into `.env`.
4. Start the Express API and frontend.

The application performs all data access through the server-side Supabase client. Frontend code never receives the service-role key.

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Dashboard

- `GET /api/dashboard/stats`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Documentation / Health

- `GET /api/openapi.json`
- `GET /api/health`

Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

## Security Practices

- bcrypt password hashing
- JWT authentication with a required server-side secret
- No plaintext passwords in database records or logs
- Protected routes and server-side ownership checks
- Zod request and query validation
- UUID validation for resource identifiers
- Parameterized/Supabase query builder access rather than raw SQL concatenation
- Login and registration rate limiting
- Helmet security headers
- CORS allow-list support
- Service-role database credentials kept server-side
- API errors avoid exposing sensitive internal data

The current rate limiter is an in-memory per-process limiter. For a multi-instance production deployment, it should be moved to a shared store such as Redis.

## Verification

Run static checks after installing dependencies:

```bash
npm run typecheck
npm run lint
npm run build
```

For an end-to-end assessment check, verify this flow against a real PostgreSQL/Supabase database:

1. Register account A
2. Login as A
3. Create and edit a project
4. Create multiple tasks
5. Edit and complete a task
6. Search/filter projects and tasks
7. Verify dashboard statistics
8. Logout
9. Register/login as account B
10. Verify B cannot access A's projects/tasks
11. Verify B sees only B's dashboard data
12. Refresh and verify session restoration
13. Verify logout clears the local session
14. Verify records persist in PostgreSQL

## Project Documentation

- [`ER-DIAGRAM.md`](./ER-DIAGRAM.md) — database relationships
- [`ASSESSMENT-MAPPING.md`](./ASSESSMENT-MAPPING.md) — requirement-to-implementation mapping
- [`INTERVIEW-GUIDE.md`](./INTERVIEW-GUIDE.md) — implementation/design explanation for the interview
- [`SUBMISSION.md`](./SUBMISSION.md) — submission checklist and deployment notes

## Deployment

The architecture supports separate deployment of the frontend and Express API. Set `VITE_API_BASE_URL` on the frontend to the deployed Express API URL and configure `CORS_ORIGIN` on the API to the deployed frontend origin.

Do not place secrets in frontend environment variables or source control.
