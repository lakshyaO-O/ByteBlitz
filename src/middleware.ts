import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  const isAuthenticated = !!sessionCookie;
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
  const isAuthRoute = authRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
  const isAdminRoute = adminRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (!isAuthenticated && isProtectedRoute) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('mode', 'login');
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isAuthenticated && isAdminRoute) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('mode', 'login');
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  if (isAuthenticated) {
    response.cookies.set('__session', sessionCookie!, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon-16x16.png|favicon-32x32.png|logo.svg|manifest.webmanifest|sw.js|icons/).*)',
  ],
};
