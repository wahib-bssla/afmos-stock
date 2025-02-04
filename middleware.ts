import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Role-based paths
  const adminPaths = ['/admin'];
  const moderatorPaths = ['/moderator'];
  const technicianPaths = ['/technician'];

  // Redirect unauthenticated users
  if (!token && pathname !== '/login' && pathname !== '/register') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  if (token) {
    // Redirect authenticated users from auth pages
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Admin path protection
    if (adminPaths.some(path => pathname.startsWith(path)) && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Moderator path protection
    if (moderatorPaths.some(path => pathname.startsWith(path)) && token.role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Technician path protection
    if (technicianPaths.some(path => pathname.startsWith(path)) && token.role !== 'TECHNICIAN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/admin/:path*',
    '/moderator/:path*',
    '/technician/:path*'
  ],
};