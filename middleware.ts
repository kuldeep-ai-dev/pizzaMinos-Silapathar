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
        if (isPublicPath) return NextResponse.next()
        return NextResponse.redirect(new URL('/maintenance', request.url))
    }

    if (pathname === '/maintenance') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // --- AUTH PROTECTION ---

    // 1. MG Dashboard Protection
    if (pathname.startsWith('/mg-dashboard')) {
        const session = request.cookies.get('mg_dashboard_session')?.value
        if (!session) {
            // Keep on the same page for login if not authenticated, 
            // but the page itself will show login form.
            // Actually, for better security, we check if they are ALREADY on /mg-dashboard 
            // and NOT authenticated.
        }
    }

    // 2. Admin Panel Protection
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const session = request.cookies.get('pizza_admin_session')?.value
        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // 3. KDS Protection
    if (pathname === '/kds') {
        const session = request.cookies.get('kds_session')?.value
        // If not authenticated, the page itself handles showing the login form
        // so we don't necessarily need to redirect here unless we had a /kds/login page.
    }

    // 4. Captain App Protection
    if (pathname.startsWith('/captain') && pathname !== '/captain/login') {
        const session = request.cookies.get('captain_session')?.value
        if (!session) {
            return NextResponse.redirect(new URL('/captain/login', request.url))
        }
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
