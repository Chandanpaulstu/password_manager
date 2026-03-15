# Frontend App (React + Vite)

Client application for the zero-knowledge password manager.

## Setup

```bash
npm install
npm run dev
```

Dev server default: `http://localhost:5173`

## Environment Expectations

- Backend API should run on `http://localhost:8000`
- Axios client is configured to send cookies and bearer token headers

## Core Flows

- Register and login with CSRF preflight call before POST requests
- Registration success message is shown on the login screen after redirect
- Vault unlock derives crypto key from master password + server-provided salt
- Vault entries are encrypted/decrypted in-browser

## Vault UX Highlights

- Category-specific forms: login, card, note, identity
- Card inputs use stable formatting:
	- Number grouped in 4-digit chunks
	- Expiry auto-formatted as `MM/YY`
	- CVV restricted to digits
- View mode supports masked password with Show/Hide toggle
- Edit flow loads full encrypted entry before rendering editable state to avoid input reset races

## Branding

- Browser tab title: `Password Manager`
- Custom app icon: `public/app-icon.svg`
