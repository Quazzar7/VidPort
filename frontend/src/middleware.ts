import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const PROTECTED_PREFIX = '/dashboard';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.has('vid_logged_in');

  if (pathname.startsWith(PROTECTED_PREFIX) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (PUBLIC_PATHS.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
