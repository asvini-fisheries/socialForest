#!/usr/bin/env node
/** Production start — uses Hostinger PORT when set, else 4350 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { APP_PORT, APP_HOST } from '../config/ports.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || String(APP_PORT);
const host = APP_HOST;

const nextBin = resolve(root, 'node_modules/next/dist/bin/next');
if (!existsSync(nextBin)) {
  console.error('Next.js is not installed. Run npm ci && npm run build on the server.');
  process.exit(1);
}

// Use node + next binary directly (more reliable on Hostinger than npx)
const child = spawn(process.execPath, [nextBin, 'start', '.', '-p', port, '-H', host], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
