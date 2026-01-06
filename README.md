# User Management Angular Demo

Small Angular v21 application demonstrating a user management UI.

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
- Full CRUD functionality:
  - Add user (modal)
  - Edit user (modal)
  - View user (read-only modal)
  - Delete user (confirmation dialog)
- Loading indicator while state initializes
- Frontend-only state management for now; API integration is planned
- State survives page navigation

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
  - In-memory state stored in a service using signals
  - LocalStorage persistence included (enabled by default); remove/skip `persist()` if you prefer purely in-memory
  - Loading flag exposed to gate UI while state hydrates
- **Styling**
  - SCSS with variables and nesting
  - Component-scoped styles
  - Responsive layout

## Architecture

- Pages orchestrate routing and state interactions
- Presentational components handle table rendering
- Dialog component encapsulates form logic and modes (add/edit/view)
- Service owns application state

## Running the project

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

By default the API runs on http://localhost:3000/.

Both apps in parallel:

```bash
npm run start:all
```

Build:

```bash
npm run build      # web only
npm run build:all  # web + api
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
