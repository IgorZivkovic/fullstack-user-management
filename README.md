# User Management Angular Demo

Small Angular v21 application built as a take-home assignment.

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
- Frontend-only state management (no backend, no external APIs)
- State survives page navigation

## Technical Details

- **Angular v21**
  - Standalone components
  - Modern dependency injection (`inject`)
  - Signals for state management (`signal`, `input`, `effect`)
  - Reactive forms
  - New Angular control flow syntax
- **UI**
  - PrimeNG components (table, dialog, buttons, confirm dialog)
  - PrimeNG preset-based theming (v19+ approach)
- **State**
  - In-memory state stored in a service using signals
  - Optional localStorage persistence shown in code (disabled by default)
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

```bash
npm install
npm start  # or ng serve
```

Then open http://localhost:4200/.
