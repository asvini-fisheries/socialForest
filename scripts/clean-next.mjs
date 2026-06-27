#!/usr/bin/env node
/** Remove .next build cache (fixes webpack "a[d] is not a function" on Windows) */
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { getProjectRoot } from '../config/load-env-files.mjs';

const nextDir = join(getProjectRoot(), '.next');

if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log('Removed .next cache');
} else {
  console.log('.next not found (already clean)');
}
