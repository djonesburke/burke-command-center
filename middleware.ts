export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/brain-dump/:path*',
    '/improvements/:path*',
    '/projects/:path*',
    '/audit-log/:path*',
  ],
}
