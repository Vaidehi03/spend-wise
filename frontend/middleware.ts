import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/register'

  // Try to get the token from the cookie
  const token = request.cookies.get('token')?.value

  // Redirect logic
  if (isPublicPath && token) {
    // If user is logged in and tries to access public paths, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isPublicPath && !token) {
    // If user is not logged in and tries to access protected paths, redirect to login
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/expenses/:path*',
    '/categories/:path*',
    '/reports/:path*',
    '/register',
  ],
}

