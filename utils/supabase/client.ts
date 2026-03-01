import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Supabase requires an absolute URL.
    // If we're on the client, use window.location.origin.
    // If we're rendering on the server (SSR/SSG), we must provide a dummy local URL.
    const isBrowser = typeof window !== 'undefined';
    const baseUrl = isBrowser ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

    const proxyUrl = `${baseUrl}/api/proxy`

    return createBrowserClient(
        proxyUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
