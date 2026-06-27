/** Shared boolean parser for Excel import (client-safe, no server-only deps) */
export function parseBoolean(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1' || v === 'y';
}
