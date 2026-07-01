export function generatePublicId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return 'u_' + Array.from(arr, (b) => chars[b % chars.length]).join('');
}

export function validateUsername(name: string): string | null {
  if (name.length < 3) return 'Username must be at least 3 characters';
  if (name.length > 20) return 'Username must be 20 characters or less';
  if (!/^[a-zA-Z0-9._]+$/.test(name)) return 'Only lowercase letters (a-z), numbers (0-9), underscores (_), and periods (.) allowed';
  if (/^[._]/.test(name)) return 'Username cannot start with . or _';
  if (/[._]$/.test(name)) return 'Username cannot end with . or _';
  if (/[._]{2,}/.test(name)) return 'Username cannot contain consecutive dots or underscores';
  if (/[A-Z]/.test(name)) return 'Username must be lowercase';
  return null;
}

export function normalizeUsername(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._]/g, '');
}
