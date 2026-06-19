#!/usr/bin/env node
/**
 * Apply a SQL migration file to the Supabase Postgres database.
 * Usage: node scripts/apply-migration.mjs [migration-file]
 * Requires DATABASE_URL in .env.local (Supabase → Settings → Database → Connection string)
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

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

async function applyFile(client, filePath) {
  const sql = readFileSync(filePath, 'utf8');
  console.log(`Applying ${basename(filePath)}...`);
  await client.query(sql);
  console.log(`  OK`);
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (password) {
    const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || 'spdwkacfkzokoausdnkp';
    return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
  }
  return null;
}

async function main() {
  loadEnv();
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.error('Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local');
    console.error('(Supabase → Settings → Database → connection URI or password)');
    process.exit(1);
  }

  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/apply-migration.mjs <migration-file.sql>');
    process.exit(1);
  }

  const file = resolve(arg);
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await applyFile(client, file);
    console.log('\nMigration applied successfully.');
  } catch (err) {
    console.error('\nMigration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
