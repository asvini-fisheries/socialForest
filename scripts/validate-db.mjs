#!/usr/bin/env node
/**
 * Validates SocialForest Supabase database setup.
 * Usage: node scripts/validate-db.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    console.error('Missing .env.local — copy from .env.example and add credentials.');
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

const EXPECTED_TABLES = [
  'users', 'years', 'csr_partners', 'organisations', 'organisation_contacts',
  'organisation_certificates', 'organisation_employees', 'stakeholder_categories',
  'stakeholders', 'stakeholder_resources', 'stakeholder_category_access_rights',
  'stakeholder_supply_rates', 'projects', 'project_areas', 'project_user_access',
  'activities', 'resources_materials', 'project_activities', 'activity_resource_requirements',
  'activity_contractor_allocations', 'work_contracts', 'work_contract_items',
  'daily_activity_updates', 'daily_activity_images', 'daily_activity_resources_used',
  'daily_attendance', 'stakeholder_bills', 'stakeholder_bill_items',
  'contractor_invoices', 'contractor_invoice_attachments', 'payments_to_stakeholders',
  'csr_payment_receipts', 'csr_payment_receipt_attachments', 'contractor_expenses',
  'contractor_expense_attachments', 'contractor_employee_reports', 'tree_census_updates',
  'tree_census_images', 'contractor_tools_stock', 'tools_stock_transactions',
  'nursery_inwards', 'nursery_issues', 'whatsapp_notifications', 'esg_report_schedules',
  'esg_report_history', 'designations', 'certificates',
];

const EXPECTED_BUCKETS = [
  'activity-images', 'census-images', 'invoice-attachments', 'receipt-attachments',
  'expense-attachments', 'employee-reports', 'org-logos', 'certificates',
];

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function validate() {
  console.log('SocialForest Database Validation\n');
  console.log(`Project: ${url}\n`);

  let passed = 0;
  let failed = 0;

  // Test connection
  const { data: years, error: yearsErr } = await supabase.from('years').select('year_label').order('start_date');
  if (yearsErr) {
    console.log('FAIL  Connection:', yearsErr.message);
    failed++;
  } else {
    console.log(`PASS  Connection — ${years?.length ?? 0} years loaded`);
    passed++;
  }

  // Validate master seed counts
  const seedChecks = [
    { table: 'years', min: 3 },
    { table: 'activities', min: 12 },
    { table: 'resources_materials', min: 13 },
    { table: 'stakeholder_categories', min: 6 },
    { table: 'designations', min: 8 },
    { table: 'certificates', min: 7 },
  ];

  for (const { table, min } of seedChecks) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`FAIL  ${table}: ${error.message}`);
      failed++;
    } else if ((count ?? 0) < min) {
      console.log(`FAIL  ${table}: expected >= ${min}, got ${count}`);
      failed++;
    } else {
      console.log(`PASS  ${table}: ${count} rows`);
      passed++;
    }
  }

  // Validate storage buckets
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.log('FAIL  Storage buckets:', bucketsErr.message);
    failed++;
  } else {
    const bucketIds = buckets?.map((b) => b.id) ?? [];
    const missing = EXPECTED_BUCKETS.filter((b) => !bucketIds.includes(b));
    if (missing.length) {
      console.log(`FAIL  Missing buckets: ${missing.join(', ')}`);
      failed++;
    } else {
      console.log(`PASS  Storage buckets: ${EXPECTED_BUCKETS.length} configured`);
      passed++;
    }
  }

  // Validate nursery stock view
  const { error: viewErr } = await supabase.from('nursery_stock').select('*').limit(1);
  if (viewErr) {
    console.log('FAIL  nursery_stock view:', viewErr.message);
    failed++;
  } else {
    console.log('PASS  nursery_stock view accessible');
    passed++;
  }

  // Check admin user exists
  const { count: adminCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');

  if ((adminCount ?? 0) > 0) {
    console.log(`PASS  Admin user(s): ${adminCount}`);
    passed++;
  } else {
    console.log('WARN  No admin user yet — run scripts/create-admin.mjs');
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

validate().catch((err) => {
  console.error(err);
  process.exit(1);
});
