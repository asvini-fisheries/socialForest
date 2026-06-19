#!/usr/bin/env node
/**
 * Apply a SQL migration file to the Supabase Postgres database.
 * Usage: node scripts/apply-migration.mjs <migration-file.sql>
 * Requires DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { loadEnv, getDatabaseUrl } from './load-env.mjs';

async function applyFile(client, filePath) {
  const sql = readFileSync(filePath, 'utf8');
  console.log(`Applying ${basename(filePath)}...`);
  await client.query(sql);
  console.log('  OK');
}

async function main() {
  loadEnv();
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.error('Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local');
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
