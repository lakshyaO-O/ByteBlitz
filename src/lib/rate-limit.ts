import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: parseInt(process.env.ADMIN_RATE_LIMIT || '60', 10),
};

const store = new Map<string, RateLimitEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > DEFAULT_CONFIG.windowMs * 2) {
      store.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, DEFAULT_CONFIG.windowMs);
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export function checkRateLimit(
  uid: string,
  request: Request,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { allowed: boolean; retryAfterMs: number } {
  const ip = getClientIp(request);
  const now = Date.now();

  const uidKey = `uid:${uid}`;
  const ipKey = `ip:${ip}`;

  for (const key of [uidKey, ipKey]) {
    const entry = store.get(key);
    if (!entry || now - entry.windowStart > config.windowMs) {
      store.set(key, { count: 1, windowStart: now });
    } else if (entry.count >= config.maxRequests) {
      const retryAfterMs = config.windowMs - (now - entry.windowStart);
      return { allowed: false, retryAfterMs };
    } else {
      entry.count++;
    }
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs: number): NextResponse {
  return NextResponse.json(
    { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.` },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
  );
}
