# Cleaning by EKO (initial backend draft)

This repository contains a lightweight Node.js HTTP API that maps to the Cleaning by EKO PIN-first guard flow and the admin management workflows described in the brief. It keeps dependencies to zero for portability in locked-down environments.

## Getting started

1. Install Node 18+ (no external packages are required).

2. Set environment variables (optional defaults are used when absent):

```
PORT=3000
ADMIN_TOKEN=supersecret # used as the `x-admin-token` header for admin routes
INTERNAL_MAIL_RECIPIENT=ops@example.com # optional extra inbox for notifications
```

3. Run the API

```bash
npm start
```

The API will start on `http://localhost:3000`. Health endpoint: `/health`.

## Data model

Data is stored in a JSON file at `data/storage.json` to keep this prototype self-contained. It holds three arrays: `companies`, `sites`, and `tickets`. See the file for starter demo data (PIN `1234`).

Key entities:

- **Company**: `id`, `name`
- **Site**: `id`, `companyId`, `siteName`, `siteAddress`, `pin` (1-10 digits), `pricing` map, optional `budget` object (`isActive`, `amount`, `startDate`, `endDate`)
- **Ticket**: `id`, `ref` (4 digits), `createdAt`, `companyId`, `companyName`, `siteId`, `siteName`, guard details, `items`, optional `notes`, and `totalCost` (admin only)

## Guard-facing endpoints

- `POST /api/guard/pin` — body `{ pin }`. Validates the PIN and returns company/site context and pricing when the budget is active and in-window. Invalid PINs return a generic error without revealing company/site names.
- `POST /api/guard/tickets` — body `{ pin, guardName, phone, email, notes?, items }`. Calculates totals using site pricing, enforces budget rules (active flag, date window, and remaining >= total), persists the ticket, and emits notification payloads (guard + internal recipient). Returns the saved ticket (prices included for admin use only) and remaining budget snapshot.

Business rules covered:

- PIN-first flow with no public company/site selectors.
- Rejection path for inactive/expired/overspent budgets using the specified error message.
- 4-digit reference generator that avoids `0000`.
- Per-garment totals based on site-level pricing.
- Remaining budget calculation anchored to the configured start/end window.

## Admin endpoints

All admin endpoints require the header `x-admin-token: <ADMIN_TOKEN>`.

- `GET /api/admin/companies` — list companies.
- `POST /api/admin/companies` — create `{ name }`.
- `PUT /api/admin/companies/:id` — update name.
- `DELETE /api/admin/companies/:id` — remove a company and cascading sites/tickets.
- `GET /api/admin/sites` — list all sites.
- `POST /api/admin/sites` — create a site with `{ companyId, siteName, siteAddress?, pin, pricing, budget? }`.
- `PUT /api/admin/sites/:id` — partial update of the same fields.
- `DELETE /api/admin/sites/:id` — remove a site and its tickets.
- `GET /api/admin/tickets?search=term` — search tickets by guard name, site, or company.
- `GET /api/admin/sites/:id/budget-usage` — show used/remaining budget for the active window.
- `GET /api/admin/reports/monthly?month=8&year=2024` — per-site monthly rollups including garment totals, ticket counts, and budget remaining.

## Notes and next steps

- This is a backend-first prototype; a branded front-end (PIN entry, order form, confirmation and success screens) still needs to be built on top of these endpoints.
- Email delivery is stubbed to console output for now to keep the code dependency-free; integrate a provider to send real messages.
- Export to Excel, printable PDFs, and full admin UI are still pending; this scaffold focuses on core data and budget logic.
