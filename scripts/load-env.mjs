import { getProjectRoot, loadProjectEnv } from '../config/load-env-files.mjs';

/** Load .env.local and .enc.local (common typo) into process.env */
export function loadEnv() {
  loadProjectEnv(getProjectRoot());
}

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) return null;
  const ref =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ||
    'spdwkacfkzokoausdnkp';
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
}
