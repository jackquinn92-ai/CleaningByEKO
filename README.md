# Cleaning by EKO

A PIN-first ticketing flow for security guards with an admin portal for sites, budgets, and reporting.

This repository contains **two backend options** for different deployment environments:

1. **Full-stack production backend (TypeScript + PostgreSQL)**
2. **Lightweight zero-dependency prototype backend (plain Node.js + JSON storage)**

The **frontend** (React + Vite) works with either backend.

---

# 1. Full Stack Implementation (Primary System)

## Stack
- **Backend:** Node.js + Express (TypeScript), PostgreSQL via `pg`
- **Frontend:** React + TypeScript (Vite)  
  - Guard-friendly mobile flow  
  - Admin dashboard
- **Email:** `nodemailer` with SMTP placeholders (JSON transport fallback)
- **Exports:** Excel via `exceljs`, PDF tickets via `pdfkit`

---

# Backend (API – TypeScript + PostgreSQL)

Backend lives at the repo root under `src/`.

## Install dependencies
```bash
npm install
