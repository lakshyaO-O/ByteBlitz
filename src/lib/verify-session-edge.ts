import { jwtVerify, createLocalJWKSet, importX509, exportJWK } from 'jose';

// Session-cookie verification for the Edge runtime (middleware).
//
// IMPORTANT: Firebase session cookies are NOT signed with the
// securetoken@system.gserviceaccount.com keys (those sign ID tokens only).
// They are signed by the Identity Toolkit session-cookie signer whose certs
// are published at
//   https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys
//   (JSON object: kid -> X.509 certificate)
// Verifying against the ID-token key set always fails with
// JWKSNoMatchingKey / signature failure; the redirect loop on /auth was
// caused by exactly that.
//
// The Firebase project is derived from the signed token itself (aud),
// so this works even where NEXT_PUBLIC_* env is not available to the
// edge runtime; an existing env value is only used as a cross-check.

const SESSION_COOKIE_KEYS_URL =
  'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

let cachedKeys: { jwks: ReturnType<typeof createLocalJWKSet>; kids: string[]; expires: number } | null = null;

function getProjectIdFromEnv(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '';
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const b64 = token.split('.')[1];
    if (!b64) return null;
    const base64 = b64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64.length / 4) * 4, '=');
    const bin = atob(base64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  } catch {
    return null;
  }
}

async function getIdentityToolkitKeySet() {
  if (cachedKeys && Date.now() < cachedKeys.expires) return cachedKeys;

  const response = await fetch(SESSION_COOKIE_KEYS_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch session-cookie public keys: HTTP ${response.status}`);
  }

  // Server instructs with Cache-Control (currently public, max-age=86400);
  // cap the in-isolate cache at 1h to stay close to source-of-truth.
  const data: Record<string, string> = await response.json();
  const kids = Object.keys(data);
  const keys: any[] = [];
  for (const kid of kids) {
    const key = await importX509(data[kid], 'RS256');
    const jwk = await exportJWK(key);
    keys.push({ ...jwk, kid, alg: 'RS256', use: 'sig' });
  }

  const maxAge = parseInt(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || '3600', 10);
  const ttl = Math.min(maxAge || 3600, 3600) * 1000;

  cachedKeys = { jwks: createLocalJWKSet({ keys }), kids, expires: Date.now() + ttl };
  return cachedKeys;
}

export async function verifySessionCookie(cookieValue: string): Promise<{ uid: string } | null> {
  if (!cookieValue) return null;
  try {
    const decoded = decodeJwtPayload(cookieValue);
    const aud = decoded && typeof decoded.aud === 'string' ? decoded.aud : '';
    const envProjectId = getProjectIdFromEnv();

    if (envProjectId && aud && aud !== envProjectId) {
      // eslint-disable-next-line no-console
      console.error(`[verify-session] project mismatch: cookie aud=${aud} env=${envProjectId}`);
      return null;
    }

    const projectId = envProjectId || aud;
    if (!projectId) {
      // eslint-disable-next-line no-console
      console.error('[verify-session] no projectId available (env unset, token unreadable)');
      return null;
    }

    const { jwks } = await getIdentityToolkitKeySet();
    const { payload } = await jwtVerify(cookieValue, jwks, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    });

    if (!payload.sub) return null;
    return { uid: payload.sub };
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(
      '[verify-session] rejected cookie:',
      err?.name,
      err?.code,
      err?.message,
      'envProjectId=',
      getProjectIdFromEnv() || '(unset)',
      'len=',
      cookieValue.length
    );
    return null;
  }
}
