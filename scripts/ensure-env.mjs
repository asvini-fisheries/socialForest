#!/usr/bin/env node
/**
 * Ensures .env.local exists with required Supabase public credentials before dev/build.
 */
import { existsSync, readFileSync, copyFileSync } from 'fs';
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

if (!existsSync(envLocal) && existsSync(envEncLocal)) {
  copyFileSync(envEncLocal, envLocal);
  console.error('\nFound .enc.local (typo) — copied to .env.local for Next.js.\n');
}

if (!existsSync(envLocal)) {
  if (existsSync(envExample)) {
    copyFileSync(envExample, envLocal);
    console.error('\nCreated .env.local from .env.example');
    console.error('Edit it with your Supabase credentials, then run npm run dev again.\n');
    process.exit(1);
  }
  const diag = diagnoseEnv(root);
  console.error('\nMissing .env.local\n');
  console.error('Expected:', envLocal);
  console.error('Windows: ', `${LOCAL_PROJECT_PATH_WINDOWS}\\.env.local`);
  if (diag.envFilesFound.length) {
    console.error('\nFound other env files (wrong name?):');
    diag.envFilesFound.forEach((f) => console.error(' ', f));
  }
  console.error('\nRun: npm run check:env\n');
  process.exit(1);
}

loadProjectEnv(root);
const { url, anonKey } = getPublicSupabaseEnv();

if (isPlaceholder(url) || isPlaceholder(anonKey)) {
  console.error('\nSupabase credentials in .env.local are missing or placeholders.\n');
  console.error('File:', envLocal);
  console.error('Run: npm run check:env\n');
  process.exit(1);
}
