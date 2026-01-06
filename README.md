# Full-stack user management demo (Angular + NestJS + Drizzle)

Small full-stack demo with an Angular v21 UI and NestJS API.

This repo is an Nx workspace with:
- Angular app at `apps/web`
- NestJS API at `api`
- Shared library at `shared` for types/interfaces/DTOs (imported via `@shared/*`)

## Overview

The application consists of:

- A **Landing Page** demonstrating layout, SCSS structure, and responsive design
- A **Data Management Page** for managing users via a table and modal dialogs

The two pages are connected via Angular routing.

## Features

- User list displayed in a table with the following fields:
  - id, name, birthday, gender, country
- Full CRUD functionality (API-backed):
  - Add user (modal)
  - Edit user (modal)
  - View user (read-only modal)
  - Delete user (confirmation dialog)
- Pagination and filtering (search + gender)
- Loading indicator while API requests are in flight

## Technical Details

- **Angular v21**
  - Standalone components
  - Modern dependency injection (`inject`)
  - Signals for state and inputs (`signal`, `input`, `model`)
  - Reactive forms
  - New Angular control flow syntax
- **UI**
  - PrimeNG components (table, dialog, buttons, confirm dialog)
  - PrimeIcons for icons (no global PrimeNG theme applied)
  - Reusable standalone confirm dialog component
- **State**
  - UI state stored in a service using signals
  - Data fetched from the API via HttpClient
  - Legacy localStorage persistence kept as commented reference code
  - Loading flag exposed to gate UI while requests are in flight
- **Styling**
  - SCSS with variables and nesting
  - Component-scoped styles
  - Responsive layout
 - **Backend**
  - Request logging middleware (method, path, status, duration)

## Architecture

- Pages orchestrate routing and state interactions
- Presentational components handle table rendering
- Dialog component encapsulates form logic and modes (add/edit/view)
- Service owns application state

## Running the project

Defaults are provided in `.env` (tracked); adjust values there if needed.

Frontend origin for CORS is controlled by `WEB_ORIGIN` in `.env`.

Frontend (web):

```bash
npm install
npm start  # runs: nx serve web
```

Then open http://localhost:4200/.

Backend (api):

```bash
npm run start:api
```

By default the API runs on http://localhost:3000/api/v1.

Health check:

```
GET http://localhost:3000/api/v1/health
```

Swagger docs:

```
http://localhost:3000/api/v1/docs
```

Users endpoints:

```
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
```

Pagination and filtering for the list endpoint:

```
GET /api/v1/users?page=1&pageSize=10&search=ana&gender=female
```

Error responses use a consistent shape with `errorCode` and optional `details` for validation failures:

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2026-01-07T09:15:22.123Z",
  "path": "/api/v1/users",
  "message": "Validation failed",
  "details": ["name should not be empty"]
}
```

Both apps in parallel:

```bash
npm run start:all
```

The Users page pulls data from the API (`GET /api/v1/users`), so make sure the API is running before opening `/users`.

LocalStorage support is kept in the frontend service as commented legacy code (used before the API was wired).

Build:

```bash
npm run build      # web only
npm run build:all  # web + api
```

## Database

The API uses Drizzle ORM with SQLite. Defaults are in `.env`.

```
DATABASE_URL=./user_management.db
```

Generate migrations after changing the schema:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Seed demo data (50+ users):

```bash
npm run db:seed
```

Change the number of seeded users:

```bash
SEED_COUNT=80 npm run db:seed
```

PowerShell:

```powershell
$env:SEED_COUNT=80; npm run db:seed
```

To force reseeding (clears existing users):

```bash
SEED_FORCE=1 npm run db:seed
```

PowerShell:

```powershell
$env:SEED_FORCE=1; npm run db:seed
```

Optional Drizzle Studio:

```bash
npm run db:studio
```

One-shot setup (migrate + seed if empty + both apps):

```bash
npm run start:full
```

## Nx workspace notes

Common tasks:

```bash
nx serve web
nx serve api
nx build web
nx build api
nx test web
```

You can also inspect the project graph with:

```bash
nx graph
```
