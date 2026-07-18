import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/verify-session-edge';

const protectedRoutes = [
  '/dashboard', '/practice', '/arena', '/profile', '/settings',
  '/notifications', '/friends', '/chats', '/leaderboard',
  '/projects', '/code-share', '/study-groups', '/mentors',
  '/progress', '/learning', '/achievements', '/missions',
  '/challenges', '/weekly-challenges', '/contests',
  '/admin', '/admin/',
];

const authRoutes = ['/auth'];

const adminRoutes = ['/admin', '/admin/'];

function isMatching(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  const needsSession = isMatching(pathname, protectedRoutes);
  const needsAdmin = isMatching(pathname, adminRoutes);
  const onAuthPage = isMatching(pathname, authRoutes);

  if (sessionCookie && (needsSession || needsAdmin || onAuthPage)) {
    const session = await verifySessionCookie(sessionCookie);
    if (!session) {
      if (onAuthPage) {
        return NextResponse.next();
      }
      const url = new URL('/auth', request.url);
      url.searchParams.set('mode', 'login');
      url.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(url);
      res.cookies.set('__session', '', { path: '/', maxAge: 0 });
      return res;
    }
  }

  if (needsSession) {
    if (!sessionCookie) {
      const url = new URL('/auth', request.url);
      url.searchParams.set('mode', 'login');
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    const session = await verifySessionCookie(sessionCookie);
    if (!session) {
      const url = new URL('/auth', request.url);
      url.searchParams.set('mode', 'login');
      url.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(url);
      res.cookies.set('__session', '', { path: '/', maxAge: 0 });
      return res;
    }
  }

  if (sessionCookie && onAuthPage) {
    const session = await verifySessionCookie(sessionCookie);
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (needsAdmin && !sessionCookie) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('mode', 'login');
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  if (sessionCookie) {
    response.cookies.set('__session', sessionCookie, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon-16x16.png|favicon-32x32.png|logo.svg|manifest.webmanifest|sw.js|icons/).*)',
  ],
};
