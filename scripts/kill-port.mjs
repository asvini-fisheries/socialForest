#!/usr/bin/env node
/** Kill process on SocialForest port 4350 (Linux/macOS/cloud) */
import { execSync } from 'child_process';
import { APP_PORT } from '../config/ports.mjs';

const port = APP_PORT;

try {
  execSync(`fuser -k ${port}/tcp`, { stdio: 'inherit' });
} catch {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (pids) {
      for (const pid of pids.split('\n')) {
        if (pid) process.kill(Number(pid), 'SIGTERM');
      }
    }
  } catch {
    console.log(`No process found on port ${port}`);
  }
}

console.log(`Port ${port} cleared.`);
