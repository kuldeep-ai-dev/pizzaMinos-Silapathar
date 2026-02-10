import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Check if maintenance mode is enabled via environment variable
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'
    const { pathname } = request.nextUrl

    // Define paths that are always accessible
    // You might want to add other public paths here if needed
    const isPublicPath =
        pathname === '/maintenance' ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        /\.(.*)$/.test(pathname) // Matches any file with an extension (e.g., images)

    if (isMaintenanceMode) {
        // If it's a public path, allow it
        if (isPublicPath) {
            return NextResponse.next()
        }

        // Otherwise, redirect to /maintenance
        return NextResponse.redirect(new URL('/maintenance', request.url))
    }

    // If NOT in maintenance mode, redirect /maintenance to home
    if (pathname === '/maintenance') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         */
        '/((?!api|_next/static|_next/image).*)',
    ],
}
