import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ENV_FILE_NAMES = ['.env.local', '.enc.local', '.env'];

/** Project root = parent of config/ */
export function getProjectRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnvContent(content) {
  const vars = {};
  for (const line of stripBom(content).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = unquote(trimmed.slice(eq + 1).trim());
    vars[key] = val;
  }
  return vars;
}

function findEnvFiles(root) {
  const found = [];
  for (const name of ENV_FILE_NAMES) {
    const filePath = resolve(root, name);
    if (existsSync(filePath)) found.push(filePath);
  }
  // Windows Notepad sometimes saves as ".env.local.txt"
  try {
    for (const entry of readdirSync(root)) {
      if (entry.toLowerCase() === '.env.local.txt' || entry.toLowerCase() === 'env.local') {
        found.push(resolve(root, entry));
      }
    }
  } catch {
    // ignore
  }
  return [...new Set(found)];
}

/** Load env files from project root into process.env */
export function loadProjectEnv(root = getProjectRoot()) {
  const files = findEnvFiles(root);
  for (const filePath of files) {
    const parsed = parseEnvContent(readFileSync(filePath, 'utf8'));
    for (const [key, val] of Object.entries(parsed)) {
      if (!process.env[key]) process.env[key] = val;
    }
  }
  return files;
}

export function getPublicSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };
}

export function diagnoseEnv(root = getProjectRoot()) {
  const files = findEnvFiles(root);
  const merged = {};
  for (const filePath of files) {
    Object.assign(merged, parseEnvContent(readFileSync(filePath, 'utf8')));
  }
  return {
    projectRoot: root,
    cwd: process.cwd(),
    envFilesFound: files,
    hasUrl: Boolean(merged.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(merged.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    urlPreview: merged.NEXT_PUBLIC_SUPABASE_URL
      ? `${merged.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...`
      : '(missing)',
    anonKeyPreview: merged.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${merged.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 12)}...`
      : '(missing)',
  };
}
