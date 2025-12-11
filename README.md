# Cleaning by EKO

A PIN-first ticketing flow for security guards with an admin portal for sites, budgets, and reporting.

This repository contains **two backend options**:

1. **Full-stack production backend (TypeScript + PostgreSQL)** — the primary system  
2. **Lightweight zero-dependency prototype backend (plain Node.js + JSON storage)** — for locked-down environments

The shared **frontend** (React + Vite) works with either backend.

---

# 1. Full Stack Implementation (Primary System)

## Stack
- **Backend:** Node.js + Express (TypeScript), PostgreSQL via `pg`
- **Frontend:** React + TypeScript (Vite)  
  - Guard mobile flow  
  - Admin dashboard  
- **Email:** `nodemailer` (JSON fallback if SMTP is not configured)  
- **Exports:** Excel via `exceljs`, PDF tickets via `pdfkit`

---

# Backend (API — TypeScript + PostgreSQL)

Sources live under `src/` at the repo root.  
Independent from the frontend (`frontend/`).

## Quick start (backend)

### 1) Install dependencies
```bash
npm install
