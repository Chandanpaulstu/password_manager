# Backend API (Laravel 12)

Laravel API for authentication and encrypted vault entry storage.

## Setup

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

Server default: `http://localhost:8000`

## Auth Model

- Sanctum personal access token auth
- Frontend performs CSRF preflight (`/sanctum/csrf-cookie`) before auth POSTs
- API rate limiting configured for `api` group (60 requests/min per user/IP)

## Vault Data Model

`vault_entries` columns:

- `user_id`
- `title_encrypted`
- `data_encrypted`
- `iv`
- `category`

The backend never decrypts vault content. Encryption and decryption happen in the browser.

## Key Endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/kdf-salt`

Vault:

- `GET /api/vault` (list metadata)
- `POST /api/vault` (create encrypted entry)
- `GET /api/vault/{id}` (fetch full encrypted entry)
- `PUT /api/vault/{id}` (update encrypted entry)
- `DELETE /api/vault/{id}`

## Local Dev Notes

- `SESSION_DOMAIN` is configured for local development defaults.
- If frontend auth fails with cookie/CSRF issues, clear config cache:

```bash
php artisan config:clear
php artisan cache:clear
```
