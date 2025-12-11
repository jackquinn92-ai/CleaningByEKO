# Cleaning by EKO

A PIN-first ticketing flow for security guards with an admin portal for sites, budgets, and reporting.

## Stack
- Backend: Node.js + Express (TypeScript), PostgreSQL via `pg`
- Frontend: React + TypeScript (Vite) with mobile-friendly guard flow and admin dashboard
- Email: `nodemailer` with SMTP placeholders
- Exports: Excel via `exceljs`, PDF tickets via `pdfkit`

## Backend (API)
The backend lives at the repo root (TypeScript sources under `src/`). It is independent from the Vite frontend in `frontend/`.

### Quick start (backend)
1) Install dependencies
```bash
npm install
```

2) Copy env vars
```bash
cp .env.example .env
```
Update `.env` with your Postgres URL, admin login, JWT secret, and SMTP creds (or leave SMTP blank to use Nodemailer's JSON transport).

3) Create database schema
```bash
createdb cleaning_by_eko              # or your DB name
psql $DATABASE_URL -f src/migrations/001_init.sql
```

4) Run the API server
```bash
npm run dev:server
```
This launches `ts-node-dev` on `PORT` (default 3000) using `src/server.ts`. With the frontend running on port 5173, calls to `/api/...` will reach `http://localhost:3000`.

Key routes:
- `POST /api/pin/resolve` — validate PIN and budget status
- `POST /api/tickets` — submit ticket with budget enforcement, ref generation, email dispatch
- `POST /api/admin/login` — shared admin auth, returns JWT
- Authenticated admin routes (`Authorization: Bearer <token>`):
  - `GET/POST/PUT/DELETE /api/admin/companies`
  - `GET/POST/PUT/DELETE /api/admin/sites`
  - `GET /api/admin/tickets` — filters by date, company, site, search
  - `POST /api/admin/tickets/export` — Excel export of selected tickets
  - `GET /api/admin/reports/monthly` — monthly rollup

## Frontend (Vite)
The `frontend` Vite app contains guard and admin screens with Cleaning by EKO branding (navy/green/white).

### Install & run
```bash
npm install --prefix frontend
npm run dev:client
```
This runs Vite on port 5173 by default.

### Pages/components
- Guard PIN entry -> Order form -> Confirmation modal -> Success screen (enforces print + checkbox before submit)
- Admin login -> dashboard shells for companies, sites, tickets, exports, monthly reports

## Items supported
`jacket, trousers, waistcoat, shirt, dress, skirt, coat, high-vis coat, high-vis vest, tie, top, misc, raincoat, rain jacket, jumpers, aprons, table covers`

## Next steps
- Wire the frontend API calls to a running backend
- Harden validation, error handling, and add automated tests
- Expand admin UI for full CRUD and Excel download actions
