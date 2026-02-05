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
    '/admin/:path*',
    '/assessments/:path*',
    '/reports/:path*',
  ],
}
