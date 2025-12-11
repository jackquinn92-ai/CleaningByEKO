# Cleaning by EKO

A PIN-first ticketing flow for security guards with an admin portal for sites, budgets, and reporting.

This repo describes **two backend variants** for the same product:

1. A **full-stack TypeScript + PostgreSQL** implementation (with React frontend, emails, Excel/PDF exports).
2. An **initial zero-dependency backend prototype** using plain Node.js and JSON-file storage.

Use whichever better fits your environment (locked-down vs production-ready).

---

## 1. Full Stack Implementation

### Stack

- **Backend:** Node.js + Express (TypeScript), PostgreSQL via `pg`
- **Frontend:** React + TypeScript (Vite) with mobile-friendly guard flow and admin dashboard
- **Email:** `nodemailer` with SMTP placeholders
- **Exports:** Excel via `exceljs`, PDF tickets via `pdfkit`

---

## Backend (TypeScript + PostgreSQL)

### Setup

```bash
npm install
npm run dev:server
