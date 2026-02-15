import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes
    if (path.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Assessment creation
    if (path === '/assessments/new') {
      if (token?.role === 'reader') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /auth/* (sign-in, error pages)
     * - /unauthorized (access denied page)
     * - /api/auth/* (NextAuth API endpoints)
     * - /api/health (public health check)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /images/*, static assets
     */
    '/((?!auth|unauthorized|api/auth|api/health|_next|favicon\\.ico|images).*)',
  ],
}
