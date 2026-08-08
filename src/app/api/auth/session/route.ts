import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decoded;
    try {
      decoded = await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

const expiresIn = 60 * 60 * 24 * 7 * 1000;
    const session = await getAdminAuth().createSessionCookie(idToken, { expiresIn });

    if (session.length > 4000) {
      console.warn(`[Auth Session] session cookie is ${session.length} chars — some browsers drop cookies > 4KB`);
    }

    const response = NextResponse.json({ uid: decoded.uid });
    response.cookies.set('__session', session, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('[Auth Session] Error:', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('__session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
}
