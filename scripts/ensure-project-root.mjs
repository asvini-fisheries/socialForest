#!/usr/bin/env node
/**
 * Ensures npm commands run from the SocialForest project root (contains src/app).
 */
import { existsSync } from 'fs';
import path from 'path';

const root = process.cwd();
const hasApp = existsSync(path.join(root, 'src', 'app')) || existsSync(path.join(root, 'app'));
const hasPkg = existsSync(path.join(root, 'package.json'));

if (!hasPkg || !hasApp) {
  console.error('\n❌ Wrong folder — Next.js cannot find src/app\n');
  console.error('Current directory:', root);
  console.error('\nRun commands from the socialForest folder that contains:');
  console.error('  package.json');
  console.error('  src/app/');
  console.error('\nExample:');
  console.error('  cd D:\\sak\\Asvini\\payoutstand-dashboard\\socialForest');
  console.error('  npm run dev\n');
  process.exit(1);
}
