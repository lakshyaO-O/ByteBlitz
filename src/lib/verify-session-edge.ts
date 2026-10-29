import { jwtVerify, createRemoteJWKSet } from 'jose';

// Session-cookie verification for the Edge runtime (middleware).
// Must not depend on build-time env inlining: it derives the Firebase
// projectId from the signed token itself (aud/iss), and only falls back to
// env vars for a cross-check. Signature verification is still done against
// Google's published JWKS, so a forged aud cannot pass.

const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

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

function getJwks() {
  if (!cachedJwks) {
    cachedJwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  }
  return cachedJwks;
}

export async function verifySessionCookie(cookieValue: string): Promise<{ uid: string } | null> {
  if (!cookieValue) return null;
  try {
    const decoded = decodeJwtPayload(cookieValue);
    const aud = decoded && typeof decoded.aud === 'string' ? decoded.aud : '';
    const envProjectId = getProjectIdFromEnv();

    if (envProjectId && aud && aud !== envProjectId) {
      // eslint-disable-next-line no-console
      console.error(
        `[verify-session] project mismatch: cookie aud=${aud} env=${envProjectId}`
      );
      return null;
    }

    const projectId = envProjectId || aud;
    if (!projectId) {
      // eslint-disable-next-line no-console
      console.error('[verify-session] no projectId available (env unset, token unreadable)');
      return null;
    }

    const { payload } = await jwtVerify(cookieValue, getJwks(), {
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
