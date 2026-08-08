// Structured diagnostic logging for the auth lifecycle.
// Gated behind NEXT_PUBLIC_AUTH_DEBUG (defaults to off) so shipping the
// compiled bundle never prints noisy auth logs in production.
// Removable — the guards just call authLog().

export const AUTH_DEBUG: boolean =
  typeof process !== 'undefined' &&
  (process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true' ||
    process.env.NEXT_PUBLIC_AUTH_DEBUG === '1');

export function authLog(tag: string, ...args: any[]) {
  if (!AUTH_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(`[${tag}]`, ...args);
}