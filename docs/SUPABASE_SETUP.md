# Supabase Setup Status

**Project:** `spdwkacfkzokoausdnkp` (ap-southeast-1)  
**URL:** `https://spdwkacfkzokoausdnkp.supabase.co`

## Validation Results (All Passed)

| Check | Status |
|-------|--------|
| 45 database tables | PASS |
| 11 enum types | PASS |
| Row-level security | PASS |
| Seed data (years, activities, resources) | PASS |
| 8 storage buckets | PASS |
| nursery_stock view | PASS |
| Phone auth enabled | PASS |
| Admin user created | PASS |
| Demo project loaded | PASS |

## Demo Data

| Entity | Details |
|--------|---------|
| CSR Partner | Green Earth Foundation (GEF) |
| Organisation | Asvini Fisheries Pvt Ltd (ASVINI) |
| Contractor | Forest Works Contractors (FWC) |
| Project | Chennai Coastal Agroforestry 2025-26 (CCAF-2526) |
| Project Areas | 3-level: Zone A → Block A1 → Plot A1-1 |

## Admin Login

- **Mobile:** `9999999999`
- **Role:** admin
- **OTP:** Requires Twilio SMS configuration in Supabase Dashboard

To create additional admins:
```bash
npm run create:admin 9876543210 "Admin Name"
```

## Pending Configuration

1. **Twilio SMS** — Add credentials in Supabase → Authentication → Providers → Phone for live OTP delivery
2. **WhatsApp API** — Set `WHATSAPP_API_*` in `.env.local`
3. **Email/ESG** — Set `EMAIL_API_KEY` for periodic ESG report mailing

## Scripts

```bash
npm run validate:db    # Validate all tables, seed data, buckets
npm run create:admin     # Create admin user in auth + users table
```
