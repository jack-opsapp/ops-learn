import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'ops-learn-session';

export function middleware(request: NextRequest) {
  // Just pass through — the session cookie is checked in server components.
  // Middleware only ensures the cookie is forwarded properly.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
