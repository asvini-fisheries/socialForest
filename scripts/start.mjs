#!/usr/bin/env node
/** Production start — uses Hostinger PORT when set, else 4350 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { APP_PORT, APP_HOST } from '../config/ports.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || String(APP_PORT);

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next', 'start', '.', '-p', port, '-H', APP_HOST],
  { cwd: root, stdio: 'inherit', env: process.env }
);

child.on('exit', (code) => process.exit(code ?? 0));
