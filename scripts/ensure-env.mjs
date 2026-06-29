#!/usr/bin/env node
/**
 * Ensures Supabase credentials exist before dev/build.
 * Supports local .env.local AND platform env vars (Hostinger, CI, Vercel).
 */
import { existsSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import {
  getProjectRoot,
  loadProjectEnv,
  getPublicSupabaseEnv,
  diagnoseEnv,
} from '../config/load-env-files.mjs';
import { LOCAL_PROJECT_PATH_WINDOWS } from '../config/paths.mjs';

const root = getProjectRoot();
const envLocal = resolve(root, '.env.local');
const envEncLocal = resolve(root, '.enc.local');
const envExample = resolve(root, '.env.example');

function isPlaceholder(value) {
  if (!value) return true;
  const lower = value.toLowerCase();
  return lower.includes('your_') || lower === 'your_supabase_project_url' || lower === 'your_supabase_anon_key';
}

function credentialsReady() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return !isPlaceholder(url) && !isPlaceholder(anonKey);
}

// Load .env.local if present (does not override existing process.env — Hostinger panel vars win)
loadProjectEnv(root);

if (credentialsReady()) {
  process.exit(0);
}

if (!existsSync(envLocal) && existsSync(envEncLocal)) {
  copyFileSync(envEncLocal, envLocal);
  console.error('\nFound .enc.local (typo) — copied to .env.local for Next.js.\n');
  loadProjectEnv(root);
  if (credentialsReady()) process.exit(0);
}

if (!existsSync(envLocal)) {
  if (existsSync(envExample)) {
    copyFileSync(envExample, envLocal);
  }
  const diag = diagnoseEnv(root);
  console.error('\n❌ Supabase credentials missing for build\n');
  console.error('Local dev: create .env.local with your Supabase keys');
  console.error('Hostinger:  Websites → socialforest.co.in → Environment variables');
  console.error('            Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,');
  console.error('            SUPABASE_SERVICE_ROLE_KEY, then Redeploy\n');
  console.error('Expected file:', envLocal);
  console.error('Windows:      ', `${LOCAL_PROJECT_PATH_WINDOWS}\\.env.local`);
  if (diag.envFilesFound.length) {
    console.error('\nFound env files (may contain placeholders):');
    diag.envFilesFound.forEach((f) => console.error(' ', f));
  }
  console.error('\nRun: npm run check:env\n');
  process.exit(1);
}

loadProjectEnv(root);

if (!credentialsReady()) {
  console.error('\nSupabase credentials in .env.local are missing or placeholders.\n');
  console.error('File:', envLocal);
  console.error('Run: npm run check:env\n');
  process.exit(1);
}
