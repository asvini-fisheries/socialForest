#!/usr/bin/env node
/**
 * Start SocialForest on its dedicated isolated port from config/ports.mjs
 * Usage: node scripts/run-server.mjs [dev|start] [--webpack]
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_HOST, APP_PORT } from '../config/ports.mjs';

const projectRoot = path.dirname(fileURLToPath(new URL('..', import.meta.url)));

const mode = process.argv[2] || 'dev';
const useWebpack = process.argv.includes('--webpack');
const command = mode === 'start' ? 'start' : 'dev';

const nextArgs = ['next', command, '-p', String(APP_PORT), '-H', APP_HOST];
if (useWebpack && command === 'dev') nextArgs.push('--webpack');

console.log(`SocialForest → http://localhost:${APP_PORT} (${command}${useWebpack ? ', webpack' : ''})`);

const child = spawn('npx', nextArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: projectRoot,
  env: { ...process.env, PORT: String(APP_PORT) },
});

child.on('exit', (code) => process.exit(code ?? 0));
