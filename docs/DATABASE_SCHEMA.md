# SocialForest Database Schema Reference

## Entity Relationship Summary

```
years ──┐
        ├── projects ──┬── project_areas (3 levels)
csr_partners ──┘       ├── project_activities ── activity_contractor_allocations
organisations ─────────┤                        └── activity_resource_requirements
                       ├── daily_activity_updates ── daily_activity_images
                       │                            └── daily_activity_resources_used
                       ├── daily_attendance
                       ├── stakeholder_bills
                       ├── contractor_invoices
                       ├── payments_to_stakeholders
                       ├── csr_payment_receipts
                       ├── contractor_expenses
                       ├── tree_census_updates
                       ├── contractor_tools_stock
                       ├── nursery_inwards
                       └── nursery_issues

users ── (linked to csr_partners | organisations | stakeholders | org_employees)
stakeholders ── stakeholder_resources ── stakeholder_supply_rates
activities (master) ── project_activities
resources_materials (master) ── used across nursery, activities, contracts
```

## Table Count: 42 tables + 1 view

## Key Design Decisions

1. **Multi-tenant via projects** — All operational data is scoped to a project
2. **Role-based RLS** — Supabase Row Level Security enforces access per role
3. **3-level area hierarchy** — `project_areas.parent_area_id` with `level` 1-3
4. **Statutory compliance** — Full employee master with PF, ESIC, UAN, Aadhaar, PAN
5. **Image attachments** — Separate tables for activity proof, census, invoices, receipts
6. **Bill auto-generation** — Bills link back to `daily_activity_updates` via `stakeholder_bill_items`
7. **Nursery stock view** — Computed view from inwards minus issues
8. **Org-branded invoices** — `organisations.logo_url`, `header_template`, `footer_template`

## Validation Checklist

When Supabase credentials are provided, validate:

- [ ] All 42 tables created successfully
- [ ] All enums created (11 types)
- [ ] Foreign key constraints intact
- [ ] RLS policies active on all tables
- [ ] Seed data loaded (years, activities, resources, categories)
- [ ] Phone auth provider enabled
- [ ] Storage buckets for image uploads configured
- [ ] `update_updated_at` triggers working

## Storage Buckets Needed

| Bucket | Purpose |
|--------|---------|
| `activity-images` | Daily activity proof photos |
| `census-images` | Tree census photos |
| `invoice-attachments` | Contractor invoice documents |
| `receipt-attachments` | CSR payment receipt documents |
| `expense-attachments` | Contractor expense proofs |
| `employee-reports` | Attendance/salary sheet uploads |
| `org-logos` | Organisation logos for invoice templates |
| `certificates` | Organisation certificate documents |

## Sample Admin User Creation

After migrations, create admin via Supabase Auth + users table:

```sql
-- After creating auth user via Supabase dashboard or API:
INSERT INTO users (id, mobile, full_name, role, status)
VALUES ('<auth-user-uuid>', '9999999999', 'System Admin', 'admin', 'active');
```
