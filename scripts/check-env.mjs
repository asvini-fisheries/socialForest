#!/usr/bin/env node
/**
 * Diagnose .env.local loading — run: npm run check:env
 */
import { diagnoseEnv, getProjectRoot, loadProjectEnv, getPublicSupabaseEnv } from '../config/load-env-files.mjs';
import { LOCAL_PROJECT_PATH_WINDOWS } from '../config/paths.mjs';

const root = getProjectRoot();
const before = diagnoseEnv(root);
loadProjectEnv(root);
const after = getPublicSupabaseEnv();

console.log('\nSocialForest — env check\n');
console.log('Project root:', before.projectRoot);
console.log('Shell cwd:   ', before.cwd);
console.log('Windows path:', LOCAL_PROJECT_PATH_WINDOWS);
console.log('');
console.log('Env files found:');
if (before.envFilesFound.length === 0) {
  console.log('  (none)');
  console.log('\nCreate:', `${root}/.env.local`);
} else {
  for (const f of before.envFilesFound) console.log(' ', f);
}
console.log('');
console.log('NEXT_PUBLIC_SUPABASE_URL:      ', before.hasUrl ? before.urlPreview : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY: ', before.hasAnonKey ? before.anonKeyPreview : 'MISSING');
console.log('');
if (before.cwd !== before.projectRoot) {
  console.warn('WARN: Shell cwd differs from project root.');
  console.warn('      Always run: cd', LOCAL_PROJECT_PATH_WINDOWS);
  console.warn('      Then: npm run dev\n');
}
if (!after.url || !after.anonKey) {
  console.error('FAIL: Supabase public keys not loaded.\n');
  process.exit(1);
}
console.log('PASS: Env vars load correctly.\n');
