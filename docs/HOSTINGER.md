# Deploy SocialForest on Hostinger

**Domain:** `socialforest.co.in`  
**Repo:** `https://github.com/asvini-fisheries/socialForest`  
**Branch:** `main`

## 1. Environment variables (required before build)

In **hPanel → Websites → socialforest.co.in → Environment variables**, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://spdwkacfkzokoausdnkp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key_from_supabase
SUPABASE_SERVICE_ROLE_KEY=your_secret_key_from_supabase
NEXT_PUBLIC_APP_URL=https://socialforest.co.in
```

Get keys from **Supabase → Project Settings → API**.

You can **Import .env** and paste your local `.env.local` (never commit secrets to Git).

Click **Save**, then **Redeploy**.

## 2. Build settings (Deployments → Settings)

| Setting | Value |
|---------|--------|
| Framework | Next.js |
| Branch | `main` |
| Root directory | `./` |
| Node version | **20.x** (or 22.x) |
| Install command | `npm ci` or `npm install` |
| Build command | `npm run build` |
| Start command | `npm run start` |

Hostinger sets `PORT` automatically — the app uses it in production.

## 3. After each code update

1. Push to GitHub: `git push origin main`
2. Hostinger auto-deploys, or click **Redeploy** in Deployments
3. Run new SQL migrations in **Supabase SQL Editor** (not on Hostinger)

## 4. Supabase auth for live domain

**Supabase → Authentication → URL configuration:**

- Site URL: `https://socialforest.co.in`
- Redirect URLs: `https://socialforest.co.in/**`

## 5. Build failed — common causes

| Error in logs | Fix |
|---------------|-----|
| `Supabase credentials missing for build` | Add env vars in Hostinger panel → Redeploy |
| `Created .env.local from .env.example` | Same — env vars not set in Hostinger |
| `Module not found` | Check build logs; run `npm run build` locally |
| App loads but login fails | Fix Supabase redirect URLs + env vars |

## 6. Database

All migrations live in `supabase/migrations/`. Apply in **Supabase SQL Editor** only.

Latest after masters work:

- `015_project_masters.sql`
- `016_remaining_masters.sql`
