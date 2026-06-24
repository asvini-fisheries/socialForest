import type { NextConfig } from 'next';
import { loadProjectEnv, getPublicSupabaseEnv } from './config/load-env-files.mjs';

// Always load from project root (where package.json lives), not shell cwd
loadProjectEnv();

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseEnv();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '\n⚠️  Supabase env missing — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local\n' +
      '   Expected: <project-root>/.env.local\n' +
      '   Run: npm run check:env\n'
  );
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
};

export default nextConfig;
