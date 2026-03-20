import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // must_change_password: redirect to change-password page
  if (payload.must_change_password && pathname !== '/admin/change-password') {
    return NextResponse.redirect(new URL('/admin/change-password', req.url))
  }

  // If already changed, don't allow going back to change-password
  if (!payload.must_change_password && pathname === '/admin/change-password') {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
