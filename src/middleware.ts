import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = new Set([
  '/',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/icons',
  '/api/auth',
  '/api/ai',
  '/api/community',
  '/api/career',
  '/api/study-groups',
  '/api/missions',
  '/api/shop',
  '/api/github',
  '/api/projects',
  '/sw.js',
  '/sitemap.xml',
  '/robots.txt',
  '/arena',
  '/practice',
  '/problems',
  '/leaderboard',
  '/contests',
  '/contest-calendar',
  '/challenges',
  '/hackathons',
  '/community',
  '/learning',
  '/rooms',
  '/feed',
  '/forum',
  '/code-share',
  '/career-hub',
  '/ai-mentor',
  '/ai-code-review',
  '/ai-debugger',
  '/ai-interviewer',
  '/ai-roadmap',
  '/resume-reviewer',
  '/replay',
  '/search',
  '/shop',
  '/monetization',
  '/achievements',
  '/missions',
  '/projects',
  '/study-groups',
  '/mentors',
  '/weekly-challenges',
]);

const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp|avif|xml|txt)$/;

function isPublicRoute(pathname: string): boolean {
  if (STATIC_EXTENSIONS.test(pathname)) return true;
  for (const route of PUBLIC_ROUTES) {
    if (pathname === route || pathname.startsWith(route + '/')) return true;
  }
  return false;
}

function decodeTokenPayload(token: string): { sub?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('__session')?.value;

  if (sessionCookie) {
    const payload = decodeTokenPayload(sessionCookie);
    if (payload && payload.sub) {
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.sub);
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    }
  }

  const authUrl = new URL('/auth', request.url);
  authUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp|avif|xml|txt)$).*)'],
};
