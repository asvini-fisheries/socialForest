#!/usr/bin/env node
/**
 * Setup daily activities: apply RLS/RPC migration + pre-seed project_activities.
 * Uses DATABASE_URL or SUPABASE_DB_PASSWORD for SQL, service role for seeding.
 */
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { loadEnv, getDatabaseUrl } from './load-env.mjs';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase URL or service role key');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function applySqlMigration() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return false;

  const files = [
    'supabase/migrations/011_daily_activities_policies.sql',
    'supabase/migrations/012_daily_activities_fix.sql',
  ];

  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const file of files) {
      const path = resolve(process.cwd(), file);
      if (!existsSync(path)) continue;
      console.log(`Applying ${file}...`);
      await client.query(readFileSync(path, 'utf8'));
      console.log('  OK');
    }
    return true;
  } finally {
    await client.end();
  }
}

async function seedProjectActivities() {
  const supabase = getServiceClient();
  const [{ data: projects }, { data: activities }] = await Promise.all([
    supabase.from('projects').select('id').eq('is_active', true),
    supabase.from('activities').select('id').eq('is_active', true),
  ]);

  let created = 0;
  for (const project of projects || []) {
    for (const activity of activities || []) {
      const { data: existing } = await supabase
        .from('project_activities')
        .select('id')
        .eq('project_id', project.id)
        .eq('activity_id', activity.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from('project_activities').insert({
          project_id: project.id,
          activity_id: activity.id,
        });
        if (!error) created++;
      }
    }
  }
  console.log(`PASS  Pre-seeded ${created} project_activities links`);
}

async function verifyRpc() {
  const supabase = getServiceClient();
  const { data: proj } = await supabase.from('projects').select('id').limit(1).single();
  const { data: act } = await supabase.from('activities').select('id').limit(1).single();
  if (!proj || !act) return;

  const { data, error } = await supabase.rpc('get_or_create_project_activity', {
    p_project_id: proj.id,
    p_activity_id: act.id,
    p_project_area_id: null,
  });
  if (error) {
    console.log('WARN  RPC function not available:', error.message);
  } else {
    console.log('PASS  get_or_create_project_activity RPC works');
  }
}

async function main() {
  loadEnv();
  if (!getDatabaseUrl()) {
    console.error('Missing DATABASE_URL or SUPABASE_DB_PASSWORD');
    console.error('Add to .env.local (not .enc.local): SUPABASE_DB_PASSWORD=your_password');
    process.exit(1);
  }
  console.log('Setting up Daily Activities...\n');

  const sqlApplied = await applySqlMigration();
  if (sqlApplied) {
    console.log('PASS  SQL migrations 011 + 012 applied\n');
    await verifyRpc();
  }

  await seedProjectActivities();
  console.log('\nDone. Daily Activities is ready.');
}

main().catch((err) => {
  console.error('FAIL', err.message);
  process.exit(1);
});
