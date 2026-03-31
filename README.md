# Zero-Knowledge Password Manager

A full-stack password manager with client-side encryption.

- Backend: Laravel 12 API + Sanctum
- Frontend: React 19 + Vite + TanStack Query + Zustand
- Crypto model: browser-side encryption/decryption (AES-GCM) with a key derived from the master password

The API stores encrypted payloads and metadata only. Secrets are encrypted in the browser before upload.

## Project Structure

- `backend/`: Laravel API, auth, vault CRUD, migrations
- `frontend/`: React SPA, vault UI, crypto helpers, API client

## Features

- User registration and login
- Sanctum-protected API routes
- Vault entry CRUD (encrypted fields)
- Category-based entries (login, card, note, identity)
- Per-entry decrypt/view flow in the client
- Master-password-based key derivation in browser memory

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 20+
- npm
- A database engine supported by Laravel

Note: Default Laravel config in `backend/.env.example` uses SQLite, so you can start quickly without MySQL/PostgreSQL.

## Quick Start (Local)

### 1) Start the backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Backend runs at `http://localhost:8000`.

Alternative one-command bootstrap:

```bash
cd backend
composer run setup
php artisan serve
```

### 2) Start the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Authentication + API Notes

- Frontend uses `withCredentials: true` for cookie-based CSRF/session flow where required.
- CSRF preflight call: `/sanctum/csrf-cookie`
- Bearer token is stored in `localStorage` under `vault_token` and attached by Axios interceptor.

Core API routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (auth required)
- `GET /api/auth/me` (auth required)
- `GET /api/auth/kdf-salt` (auth required)
- `GET|POST|PUT|DELETE /api/vault...` (auth required)

## Development Commands

Backend:

```bash
cd backend
composer run dev      # serve + queue + logs + vite (backend workspace)
composer run test
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

## Security Model

- Master password is not sent to the backend.
- Encryption/decryption happens in the browser.
- Derived key is kept in memory only during unlocked session.
- Backend stores encrypted blobs and non-sensitive metadata.

## Troubleshooting

- If auth/CSRF fails locally:
	- confirm backend is running on `http://localhost:8000`
	- confirm frontend is running on `http://localhost:5173`
	- check `VITE_API_BASE` in `frontend/.env`
	- verify `backend/config/cors.php` includes frontend origin
	- run in backend:

```bash
php artisan config:clear
php artisan cache:clear
```

## Roadmap Ideas

- Password generator and strength estimator
- Search/filter by tags and category
- Export/import encrypted vault backup
- Optional 2FA for account login
