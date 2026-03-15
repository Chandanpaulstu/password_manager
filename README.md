# Zero-Knowledge Password Manager

Full-stack password manager built with Laravel 12 (API) and React + Vite (frontend).

## Architecture

- Backend: Laravel 12 API with Sanctum token auth
- Frontend: React + Vite + TanStack Query + Zustand
- Crypto model: client-side AES-GCM encryption/decryption using a key derived from the master password

The backend stores encrypted blobs and metadata only. Secret fields are encrypted in the browser before upload.

## Repository Structure

- `backend/`: Laravel API server, auth, vault CRUD
- `frontend/`: React app, vault UI, browser crypto helpers

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 20+
- npm
- MySQL or PostgreSQL

## Quick Start

1. Backend setup

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

3. Open app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Current Features

- Register/login with Sanctum token flow
- CSRF preflight for auth POST requests
- Master-password vault unlock to derive in-memory key
- Encrypted vault entry create/read/update/delete
- Category-specific vault forms: login, card, note, identity
- Entry list with per-item view/decrypt flow
- Login success message after registration redirect
- Custom app tab icon and title

## Security Notes

- Master password is never sent to the backend
- Derived encryption key is kept in memory only
- Clipboard copy auto-clears after a short timeout in the UI

## Development Notes

- If cookie/session behavior is inconsistent in local dev, verify backend `SESSION_DOMAIN` and CORS settings.
- For auth calls from the frontend, keep `withCredentials` enabled where required.
