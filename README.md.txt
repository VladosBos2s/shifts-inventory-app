# WashSaaS — Car Wash Shift, POS & Chemical Inventory Management System

A full-stack B2B SaaS platform built for multi-bay car wash operations. The system automates chemical inventory deduction per wash service, manages operator shifts across bays, and provides real-time cash reconciliation and revenue analytics.

🔗 **Live Demo:** [https://shifts-inventory-app.vercel.app](https://shifts-inventory-app.vercel.app)

### Demo Credentials
*(Sandbox environment with protected default records and automated 24-hour data reset)*

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@washsaas.com` | `admin123` | Revenue analytics, warehouse stock, wash recipes, bays & staff management |
| **Operator (Active Shift)** | `alex@washsaas.com` | `1234` | Bay POS terminal, wash registration (`CASH`/`CARD`/`BLIK`), cash drawer reconciliation |
| **New Employee (Onboarding)** | `newbie@washsaas.com` | *(leave blank)* | Demonstrates self-service password setup on first login |

---

## Core Features

* **Role-Based Access Control (RBAC):** JWT-authenticated API and dedicated workspaces for `ADMIN` and `OPERATOR` roles.
* **First-Time Password Setup Flow:** Administrators create employee accounts without temporary passwords; new staff set their personal credentials on initial sign-in.
* **Atomic Chemical Deduction:** Each wash tier is linked to specific warehouse consumables (foam, wax, sealants, wheel cleaners). Recording a wash deducts exact milliliter recipes inside an atomic Prisma transaction.
* **Multi-Bay Shift & Cash Reconciliation:** Operators open shifts on available bays with a starting cash float, record `CASH`, `CARD`, and `BLIK` transactions, and reconcile expected vs. actual register cash upon closing.
* **Real-Time Low-Stock Alerts:** Automated threshold monitoring (`minStockLimit`) with instant restock actions.
* **Executive Revenue Analytics:** 7-day revenue performance chart, cash vs. electronic payment breakdown, and per-bay shift audit logs.

---

## Interface Overview

### 1. Executive Dashboard & 7-Day Revenue Analytics
![Executive Dashboard](./docs/screenshots/dashboard.png)

### 2. Operator POS Terminal (Active Shift)
![Operator POS](./docs/screenshots/operator-pos.png)

### 3. Wash Programs & Chemical Recipes
![Wash Programs](./docs/screenshots/wash-programs.png)

### 4. Warehouse Inventory & Low-Stock Alerts
![Warehouse Inventory](./docs/screenshots/inventory.png)

### 5. Per-Bay Shift History & Cash Reconciliation
![Shift Reconciliation](./docs/screenshots/shift-reconciliation.png)

---

## Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Recharts, Lucide Icons
* **Backend:** Node.js, Express.js, TypeScript, JWT, bcryptjs, Helmet
* **Database & ORM:** PostgreSQL (Neon), Prisma ORM
* **Hosting:** Vercel (Frontend) & Render (Backend API)

---

## Local Installation

### 1. Clone the repository
```bash
git clone [https://github.com/VladosBos2s/shifts-inventory-app.git](https://github.com/YOUR_GITHUB_USERNAME/shifts-inventory-app.git)
cd shifts-inventory-app
2. Backend Setup (carwash-backend)
```Bash
cd carwash-backend
npm install
Create carwash-backend/.env:


DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
PORT=3000
Generate Prisma client, push schema, seed demo data, and run the API:

```Bash
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
3. Frontend Setup (carwash-frontend)
```Bash
cd ../carwash-frontend
npm install
Create carwash-frontend/.env.local:


NEXT_PUBLIC_API_URL="http://localhost:3000"

Run the development server:

```Bash
npm run dev
