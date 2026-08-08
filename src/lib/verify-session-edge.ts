import { jwtVerify, createLocalJWKSet, importX509, exportJWK } from 'jose';

let cachedKeySet: ReturnType<typeof createLocalJWKSet> | null = null;

async function getFirebasePublicKeySet() {
  if (cachedKeySet) return cachedKeySet;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
  }

  const url = `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com/${projectId}`;
  const response = await fetch(url);
  const data: Record<string, string> = await response.json();

  const keys: any[] = [];
  for (const kid of Object.keys(data)) {
    const cert = data[kid];
    const key = await importX509(cert, 'RS256');
    keys.push(await exportJWK(key));
  }
  cachedKeySet = createLocalJWKSet({ keys });
  return cachedKeySet;
}

export async function verifySessionCookie(cookieValue: string): Promise<{ uid: string } | null> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return null;

    const JWKS = await getFirebasePublicKeySet();
    const { payload } = await jwtVerify(cookieValue, JWKS, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    });

    if (!payload.sub) return null;
    return { uid: payload.sub };
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[verify-session] rejected cookie:', err?.name, err?.code, err?.message, 'len=', cookieValue.length);
    return null;
  }
}
