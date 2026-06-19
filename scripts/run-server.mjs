#!/usr/bin/env node
/**
 * Start SocialForest on its dedicated isolated port from config/ports.mjs
 * Usage: node scripts/run-server.mjs [dev|start]
 */
import { spawn } from 'child_process';
import { APP_HOST, APP_PORT } from '../config/ports.mjs';

const mode = process.argv[2] || 'dev';
const command = mode === 'start' ? 'start' : 'dev';

console.log(`SocialForest → http://localhost:${APP_PORT} (${command})`);

const child = spawn(
  'npx',
  ['next', command, '-p', String(APP_PORT), '-H', APP_HOST],
  { stdio: 'inherit', shell: true, env: { ...process.env, PORT: String(APP_PORT) } }
);

child.on('exit', (code) => process.exit(code ?? 0));
