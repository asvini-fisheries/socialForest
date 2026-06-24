#!/usr/bin/env node
/**
 * Ensures .env.local exists with required Supabase public credentials before dev/build.
 */
import { existsSync, readFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import { LOCAL_PROJECT_PATH_WINDOWS } from '../config/paths.mjs';

const root = process.cwd();
const envLocal = resolve(root, '.env.local');
const envEncLocal = resolve(root, '.enc.local');
const envExample = resolve(root, '.env.example');

function parseEnvFile(filePath) {
  const vars = {};
  if (!existsSync(filePath)) return vars;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function isPlaceholder(value) {
  if (!value) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('your_') ||
    lower === 'your_supabase_project_url' ||
    lower === 'your_supabase_anon_key'
  );
}

if (!existsSync(envLocal) && existsSync(envEncLocal)) {
  copyFileSync(envEncLocal, envLocal);
  console.error('\nFound .enc.local (typo) — copied to .env.local for Next.js.\n');
}

if (!existsSync(envLocal)) {
  if (existsSync(envExample)) {
    copyFileSync(envExample, envLocal);
    console.error('\nCreated .env.local from .env.example');
    console.error('Edit it with your Supabase credentials, then run npm run dev again.\n');
    console.error('Expected file location:');
    console.error(`  ${envLocal}`);
    console.error(`  (Windows: ${LOCAL_PROJECT_PATH_WINDOWS}\\.env.local)\n`);
    process.exit(1);
  }
  console.error('\nMissing .env.local — create it in the project root:\n');
  console.error(`  ${envLocal}`);
  console.error(`  (Windows: ${LOCAL_PROJECT_PATH_WINDOWS}\\.env.local)\n`);
  console.error('Copy .env.example and set at minimum:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('  SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

const env = {
  ...parseEnvFile(envEncLocal),
  ...parseEnvFile(envLocal),
};
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (isPlaceholder(url) || isPlaceholder(anonKey)) {
  console.error('\nSupabase credentials in .env.local are missing or still placeholders.\n');
  console.error('File:', envLocal);
  console.error('\nSet these from Supabase → Project Settings → API:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');
  process.exit(1);
}
