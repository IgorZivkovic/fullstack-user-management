# Full-stack user management demo

A portfolio-oriented full-stack application for managing users, built with an Angular frontend and a Laravel REST API.

## Features

- Email and password authentication
- Session-based SPA authentication with Laravel Sanctum
- Role-based access control:
  - administrators can create, view, update, and delete users
  - regular users have read-only access
- Paginated user list with name/country search and gender filtering
- Server-side validation and consistent API error responses
- Responsive Angular interface with loading and error states
- OpenAPI documentation generated from the Laravel API
- Automated frontend and backend tests

## Tech stack

- **Frontend:** Angular 21, RxJS, Taiga UI, SCSS
- **Backend:** Laravel 13, PHP 8.3+, Laravel Sanctum, Eloquent ORM
- **Database:** MySQL 8
- **API documentation:** Scramble / OpenAPI
- **Workspace tooling:** Nx for the Angular application and shared TypeScript code

## Repository structure

```text
apps/web/   Angular application
api/        Laravel API
shared/     Shared frontend TypeScript contracts
```

Laravel is kept as a standard Composer application in `api/`. Nx manages the Angular side of the workspace, while the root npm scripts also provide convenient commands for running and testing both applications.

## Prerequisites

Install the following before starting:

- A currently supported Node.js release with npm
- PHP 8.3 or newer with the extensions required by Laravel and MySQL
- Composer 2
- MySQL 8.x

## First-time setup

Run the following commands from the repository root.

### 1. Install dependencies

```powershell
npm ci
cd api
composer install
cd ..
```

### 2. Create the Laravel environment file

PowerShell:

```powershell
Copy-Item api/.env.example api/.env
```

macOS, Linux, or Git Bash:

```bash
cp api/.env.example api/.env
```

The local `api/.env` file is intentionally ignored by Git. The tracked `api/.env.example` contains the safe defaults needed to configure a new clone.

Generate the application key:

```powershell
cd api
php artisan key:generate
cd ..
```

### 3. Create the MySQL database

You can use an existing local MySQL account, or create a dedicated development database and user:

```sql
CREATE DATABASE fullstack_user_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER 'fullstack_app'@'localhost'
    IDENTIFIED BY 'choose_a_local_password';

GRANT ALL PRIVILEGES
    ON fullstack_user_management.*
    TO 'fullstack_app'@'localhost';

FLUSH PRIVILEGES;
```

Set the matching values in `api/.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fullstack_user_management
DB_USERNAME=fullstack_app
DB_PASSWORD=choose_a_local_password
```

Use your own local password instead of the example value above.

### 4. Run migrations and seed demo data

```powershell
cd api
php artisan migrate --seed
cd ..
```

The seeder creates 60 deterministic user records and the two demo accounts listed below.

### 5. Start the application

```powershell
npm run start:all
```

This starts both development servers:

- Angular application: http://localhost:4200
- Laravel API: http://127.0.0.1:8000/api/v1
- Health check: http://127.0.0.1:8000/api/v1/health
- OpenAPI UI: http://127.0.0.1:8000/api/v1/docs
- OpenAPI JSON: http://127.0.0.1:8000/api/v1/docs/openapi.json

## Demo accounts

These credentials exist only for the seeded local demo:

| Access | Email | Password | Permissions |
| --- | --- | --- | --- |
| Administrator | `admin@example.com` | `admin12345` | Full user CRUD |
| Viewer | `viewer@example.com` | `viewer12345` | Read-only user access |

The viewer is represented by the `user` role in the API.

## Authentication

The application uses Laravel Sanctum's stateful SPA authentication. Before login, the Angular client requests `/sanctum/csrf-cookie`; after successful login, the browser uses the Laravel session cookie for authenticated requests. No access token is stored in browser storage.

When testing authentication from another HTTP client, enable cookie persistence and send the CSRF cookie/header pair expected by Sanctum.

## API overview

All application endpoints use the `/api/v1` prefix.

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/health` | Public |
| `POST` | `/auth/login` | Public |
| `POST` | `/auth/logout` | Authenticated |
| `GET` | `/auth/me` | Authenticated |
| `GET` | `/users` | Administrator and viewer |
| `GET` | `/users/{user}` | Administrator and viewer |
| `POST` | `/users` | Administrator |
| `PUT/PATCH` | `/users/{user}` | Administrator |
| `DELETE` | `/users/{user}` | Administrator |

The user collection follows Laravel pagination conventions:

```text
GET /api/v1/users?page=1&per_page=10&search=ana&gender=female
```

The response contains the user records in `data`, navigation URLs in `links`, and pagination information in `meta`.

Validation and application errors use a consistent response containing `statusCode`, `errorCode`, `timestamp`, `path`, and `message`, with optional validation details.

## Useful commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Angular development server |
| `npm run start:api` | Start the Laravel development server |
| `npm run start:all` | Start Angular and Laravel together |
| `npm run start:full` | Apply pending migrations, then start both servers |
| `npm test` | Run the Angular and Laravel test suites |
| `npm run test:web` | Run Angular tests |
| `npm run test:api` | Run Laravel tests |
| `npm run build` | Create the Angular production build |
| `npm run db:migrate` | Apply pending Laravel migrations |
| `npm run db:seed` | Seed the configured database |
| `npm run db:fresh` | Recreate all tables and seed them; existing data is deleted |

## Migration history

The project was initially built with a Node.js/NestJS backend, Drizzle ORM, and SQLite. The backend was later migrated to Laravel, Eloquent, MySQL, and Sanctum while preserving the existing REST functionality and role-based access rules.

The migration also adopted Laravel conventions for request validation, API resources, authorization policies, session authentication, database migrations, seeders, and pagination.

## Production considerations

The included credentials and environment defaults are intended only for local demonstration. For deployment, use unique secrets, disable debug mode, configure the production database and trusted frontend domains, serve both applications over HTTPS, and do not seed the demo accounts.
