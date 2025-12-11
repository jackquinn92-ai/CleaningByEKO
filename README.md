# Cleaning by EKO

A PIN-first ticketing flow for security guards with an admin portal for sites, budgets, and reporting.

## Stack
- Backend: Node.js + Express (TypeScript), PostgreSQL via `pg`
- Frontend: React + TypeScript (Vite) with mobile-friendly guard flow and admin dashboard
- Email: `nodemailer` with SMTP placeholders
- Exports: Excel via `exceljs`, PDF tickets via `pdfkit`

## Backend

### Setup
```
npm install
npm run dev:server
```
Environment variables:
- `PORT` (default 3000)
- `DATABASE_URL` (PostgreSQL connection)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- `JWT_SECRET`
- `EKO_INTERNAL_EMAIL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional; falls back to JSON transport)

Run migrations by executing the SQL in `src/migrations/001_init.sql` against your database.

### Routes (high level)
- `POST /api/pin/resolve` — validate PIN and budget status
- `POST /api/tickets` — submit ticket with budget enforcement, ref generation, email dispatch
- `POST /api/admin/login` — shared admin auth, returns JWT
- Authenticated admin routes (`Authorization: Bearer <token>`):
  - `GET/POST/PUT/DELETE /api/admin/companies`
  - `GET/POST/PUT/DELETE /api/admin/sites`
  - `GET /api/admin/tickets` — filters by date, company, site, search
  - `POST /api/admin/tickets/export` — Excel export of selected tickets
  - `GET /api/admin/reports/monthly` — monthly rollup

## Frontend
The `frontend` Vite app contains guard and admin screens with Cleaning by EKO branding (navy/green/white). Start it with:
```
npm install
npm run dev:client
```

Pages/components:
- Guard PIN entry -> Order form -> Confirmation modal -> Success screen (enforces print + checkbox before submit)
- Admin login -> dashboard shells for companies, sites, tickets, exports, monthly reports

## Items supported
`jacket, trousers, waistcoat, shirt, dress, skirt, coat, high-vis coat, high-vis vest, tie, top, misc, raincoat, rain jacket, jumpers, aprons, table covers`

## Next steps
- Wire the frontend API calls to a running backend
- Harden validation, error handling, and add automated tests
- Expand admin UI for full CRUD and Excel download actions
