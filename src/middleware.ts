import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  console.log(`Middleware running for path: ${request.nextUrl.pathname}`);
  console.log(`User authenticated: ${!!token}`);
  
  // Add a custom header to indicate if this is a chat page
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-is-chat-page', request.nextUrl.pathname.startsWith('/chat') ? 'true' : 'false')
  
  if (token) {
    console.log(`User must change password: ${!!token.mustChangePassword}`);
    
    // PRIORITY CHECK: Force password change if mustChangePassword is true
    // This check must come first, before any other checks
    if (token.mustChangePassword === true) {
      const isChangePasswordRoute = request.nextUrl.pathname === '/auth/change-password';
      const isAllowedApiRoute = 
        request.nextUrl.pathname.startsWith('/api/auth/change-password') || 
        request.nextUrl.pathname.startsWith('/api/auth/signout');
      
      console.log('--- Must Change Password Check ---');
      console.log('Current path:', request.nextUrl.pathname);
      console.log('mustChangePassword flag:', token.mustChangePassword);
      console.log('isChangePasswordRoute:', isChangePasswordRoute);
      console.log('isAllowedApiRoute:', isAllowedApiRoute);
      
      if (!isChangePasswordRoute && !isAllowedApiRoute) {
        console.log('Must change password, redirecting to change-password');
        const changePasswordUrl = new URL('/auth/change-password', request.url);
        return NextResponse.redirect(changePasswordUrl, { status: 307 }); // Use 307 to prevent caching
      }
      
      // If we're already on the change-password route or allowed API route, continue
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // Allow health check without auth (for DB diagnostics)
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // If not authenticated and not on auth routes, redirect to sign-in
  if (!token && !request.nextUrl.pathname.startsWith('/auth') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    console.log('Not authenticated, redirecting to sign-in');
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Handle USER role - must be checked before admin routes
  if (token && token.role === 'USER') {
    // Always redirect to /chat unless already on chat, auth, or api routes
    if (!request.nextUrl.pathname.startsWith('/chat') && 
        !request.nextUrl.pathname.startsWith('/api/') && 
        !request.nextUrl.pathname.startsWith('/auth/')) {
      console.log('Redirecting USER to /chat from:', request.nextUrl.pathname);
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Only allow ADMIN and SUPER_ADMIN roles
    if (!token || !['SUPER_ADMIN', 'ADMIN'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Additional check for organization routes (SUPER_ADMIN only)
    if (request.nextUrl.pathname.startsWith('/admin/organizations') && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  console.log('Middleware allowing access to:', request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * 
     * Also exclude specific Next-auth related API routes that shouldn't be
     * intercepted by the middleware.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ]
}; 