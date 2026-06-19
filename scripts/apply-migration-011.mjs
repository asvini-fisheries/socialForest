#!/usr/bin/env node
/**
 * Apply migration 011 using service role (data) + optional DATABASE_URL (DDL policies).
 * If DATABASE_URL is missing, applies RLS policies via direct postgres when SUPABASE_DB_PASSWORD is set.
 */
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    console.error('Missing .env.local');
    process.exit(1);
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (password) {
    return `postgresql://postgres.spdwkacfkzokoausdnkp:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
  }
  return null;
}

async function applySqlPolicies() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return false;

  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/011_daily_activities_policies.sql'),
    'utf8'
  );
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('PASS  RLS policies applied via DATABASE_URL');
    return true;
  } finally {
    await client.end();
  }
}

async function verifyServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase URL or service role key');
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.from('daily_activity_updates').select('id').limit(1);
  if (error) {
    console.error('FAIL  Service role connection:', error.message);
    process.exit(1);
  }
  console.log('PASS  Service role can access daily_activity_updates');
  return supabase;
}

async function main() {
  loadEnv();
  console.log('Applying Daily Activities migration (011)...\n');
  await verifyServiceRole();
  const policiesApplied = await applySqlPolicies();
  if (!policiesApplied) {
    console.log('\nNote: RLS policies not applied (no DATABASE_URL / SUPABASE_DB_PASSWORD).');
    console.log('Daily Activities will work via API routes using service role.');
    console.log('To apply policies, add DATABASE_URL to .env.local and re-run.');
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
