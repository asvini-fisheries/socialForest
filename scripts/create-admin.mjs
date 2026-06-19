#!/usr/bin/env node
/**
 * Creates the initial admin user in Supabase Auth + public.users.
 * Usage: node scripts/create-admin.mjs [mobile] [full_name]
 * Example: node scripts/create-admin.mjs 9876543210 "System Admin"
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

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

loadEnv();

const mobile = process.argv[2] || '9999999999';
const fullName = process.argv[3] || 'System Admin';
const email = process.argv[4] || null;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log(`Creating admin user: ${fullName} (+91${mobile})`);

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('mobile', mobile)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin', status: 'active', full_name: fullName, ...(email ? { email } : {}) })
      .eq('id', existing.id);
    if (error) throw error;
    if (email) {
      await supabase.auth.admin.updateUserById(existing.id, { email, email_confirm: true });
    }
    console.log(`Updated existing user ${existing.id} to admin`);
    return;
  }

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    phone: `+91${mobile}`,
    phone_confirm: true,
    ...(email ? { email, email_confirm: true } : {}),
    user_metadata: { full_name: fullName, role: 'admin' },
  });

  if (authErr) throw authErr;

  const { error: profileErr } = await supabase.from('users').upsert({
    id: authUser.user.id,
    mobile,
    email,
    full_name: fullName,
    role: 'admin',
    status: 'active',
  });

  if (profileErr) throw profileErr;

  console.log(`Admin created: ${authUser.user.id}`);
  console.log('Login with this mobile via OTP on the app.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
