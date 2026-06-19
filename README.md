# SocialForest

CSR Agroforestry Project Management Platform — track plantation projects, stakeholders, daily activities, billing, nursery stock, tree census, and ESG reporting.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Auth:** Mobile number + OTP verification
- **Deployment:** Desktop web + mobile-responsive PWA

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy the environment template and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run Database Migrations

Migrations are in `supabase/migrations/`. Apply via Supabase SQL Editor, CLI, or:

```bash
# Validate after setup
npm run validate:db

# Create admin user (after migrations)
npm run create:admin 9876543210 "Your Name"
```

Migration order:
1. `001_initial_schema.sql` — 45 tables, 11 enums
2. `002_rls_policies.sql` — Row-level security
3. `003_seed_data.sql` — Master data seed
4. `004_storage_buckets.sql` — 8 storage buckets
5. `005_auth_triggers.sql` — Auto-create user profile on OTP signup
6. `006_demo_data.sql` — Sample CSR, org, project (optional)
7. `007_fix_auth_trigger.sql` — Auth trigger fixes

### 4. Enable Phone Auth in Supabase

In Supabase Dashboard → Authentication → Providers → Phone:
- Enable phone provider
- Configure **Twilio** credentials (Account SID, Auth Token, Message Service SID) for India +91 OTP delivery

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:4350](http://localhost:4350)

> Port `4350` is dedicated to SocialForest. See [docs/PORTS.md](docs/PORTS.md) for the full port registry.

---

## Database Schema Overview

### Master Tables

| Table | Description |
|-------|-------------|
| `users` | Application users with role-based access |
| `years` | Financial year master |
| `csr_partners` | CSR partner organisations |
| `certificates` | Certificate types master |
| `designations` | Employee designation master |
| `organisations` | Executing organisations |
| `organisation_contacts` | Multiple contact persons per org |
| `organisation_certificates` | Certificate attachments per org |
| `organisation_employees` | Employees with full statutory columns |
| `stakeholder_categories` | Contractor, supplier, nursery, etc. |
| `stakeholders` | Contractors and service providers |
| `stakeholder_resources` | Resources a stakeholder can supply |
| `stakeholder_category_access_rights` | Module-level app access per category |
| `stakeholder_supply_rates` | Stakeholder-wise resource rates |

### Project Tables

| Table | Description |
|-------|-------------|
| `projects` | Year-wise projects linked to CSR + Organisation |
| `project_areas` | Up to 3-level area hierarchy with land/trees |
| `project_user_access` | User-to-project access mapping |
| `project_activities` | Activities planned per project/area |
| `activity_resource_requirements` | Material planning per activity |
| `activity_contractor_allocations` | Contractor assignment to activities |
| `work_contracts` | Formal contracts with stakeholders |
| `work_contract_items` | Contract line items with rates |

### Operations Tables

| Table | Description |
|-------|-------------|
| `daily_activity_updates` | Daily work entries by stakeholders |
| `daily_activity_images` | Proof-of-work image attachments |
| `daily_activity_resources_used` | Materials consumed per entry |
| `daily_attendance` | Organisation employee attendance |
| `stakeholder_bills` | Bills generated from daily activities |
| `contractor_invoices` | Invoices to CSR partners |
| `payments_to_stakeholders` | Organisation payments to stakeholders |
| `csr_payment_receipts` | CSR payment receipts with attachments |
| `contractor_expenses` | Contractor expense entries with proof |
| `contractor_employee_reports` | Monthly attendance/salary sheets |
| `tree_census_updates` | Periodic tree health census |
| `contractor_tools_stock` | Tools inventory per contractor |
| `tools_stock_transactions` | Stock movements (damage, missing, etc.) |
| `nursery_inwards` | Tree sapling inward entries |
| `nursery_issues` | Plantation/replacement issue entries |
| `whatsapp_notifications` | WhatsApp message log |
| `esg_report_schedules` | Periodic ESG report scheduling |
| `esg_report_history` | Sent ESG report history |

---

## User Roles & Access

| Role | Access |
|------|--------|
| **Admin** | Full access — create users, projects, stakeholders |
| **CSR Partner** | View linked projects, progress, ESG reports |
| **Organisation** | Manage activities, attendance, bills, payments, nursery |
| **Stakeholder** | Submit daily activities, bills, expenses, nursery inwards |
| **Org Employee** | Record daily activities and attendance |

Login flow: Mobile OTP → Year selection → Project selection (filtered by role)

---

## Application Modules

- **Dashboard** — Project-wise budget, trees, activities overview
- **Daily Activities** — Work entries with image proof and resource usage
- **Attendance** — Organisation employee daily attendance
- **Bills** — Auto-generated from daily activities, stakeholder-wise
- **Invoices** — Contractor invoices to CSR with org-branded templates
- **Payments** — Organisation to stakeholder payment tracking
- **Expenses** — Contractor expense entries with invoice attachments
- **Nursery** — Centralized stock management (inward/issue/transaction)
- **Tree Census** — Periodic health status with image attachments
- **Tools Stock** — Contractor tools inventory and transactions
- **Reports** — Attendance sheets, salary sheets, ESG reports
- **Masters** — All master data management (admin only)

---

## Integrations (Pending Configuration)

- **WhatsApp** — Notifications at all workflow stages (`/api/whatsapp`)
- **ESG Reports** — Periodic email to CSR partners (`/api/esg-report`)
- **SMS/OTP** — Supabase Phone Auth provider

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (WhatsApp, ESG)
│   ├── dashboard/          # Project dashboard
│   ├── daily-activities/   # Daily work entries
│   ├── masters/            # Master data management
│   ├── nursery/            # Nursery stock management
│   └── page.tsx            # Login page
├── components/
│   ├── auth/               # Login form with OTP
│   ├── layout/             # Sidebar navigation
│   └── ui/                 # Reusable UI components
├── contexts/               # Auth context (user, year, project)
├── lib/
│   ├── supabase/           # Supabase client (browser + server)
│   └── utils.ts            # Utility functions
└── types/
    └── database.ts         # TypeScript types for all entities
supabase/
└── migrations/             # SQL schema, RLS, seed data
```

---

## Next Steps

1. Share Supabase credentials for validation
2. Run migrations and verify all tables
3. Create admin user and test OTP login
4. Configure WhatsApp and email providers
5. Build out individual module CRUD screens
