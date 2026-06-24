import type { NextConfig } from 'next';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/** Load .env.local (and .enc.local typo) so NEXT_PUBLIC_* are available at build/dev time */
function loadEnvFiles() {
  const root = process.cwd();
  for (const name of ['.env.local', '.enc.local', '.env']) {
    const filePath = resolve(root, name);
    if (!existsSync(filePath)) continue;
    for (const line of readFileSync(filePath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvFiles();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const nextConfig: NextConfig = {
  // Force client bundle to receive public Supabase vars (fixes missing .env at compile time)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
};

export default nextConfig;
