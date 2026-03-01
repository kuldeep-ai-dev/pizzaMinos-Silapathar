import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handleProxy(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    // Reconstruct the nested path
    const params = await props.params;
    const pathParams = params.path ? params.path.join('/') : '';
    const searchParams = request.nextUrl.search;

    // Construct the actual Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const targetUrl = `${supabaseUrl}/${pathParams}${searchParams}`;

    // Extract everything we need to proxy securely
    const method = request.method;
    const requestHeaders = new Headers(request.headers);

    // Default Supabase headers
    requestHeaders.set('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    if (!requestHeaders.has('Authorization')) {
        requestHeaders.set('Authorization', `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`);
    }

    // Next.js doesn't allow host forwarding
    requestHeaders.delete('host');

    try {
        // Forward the request body if it exists (POST, PUT, PATCH)
        let bodyToForward = undefined;
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const rawBody = await request.text();
            if (rawBody) bodyToForward = rawBody;
        }

        const supabaseResponse = await fetch(targetUrl, {
            method,
            headers: requestHeaders,
            body: bodyToForward,
            cache: 'no-store'
        });

        // Forward the exact status and headers back to the browser
        const responseData = await supabaseResponse.arrayBuffer();
        const responseHeaders = new Headers(supabaseResponse.headers);

        // Remove headers that might cause Next.js response issues
        responseHeaders.delete('content-encoding');

        return new NextResponse(responseData, {
            status: supabaseResponse.status,
            statusText: supabaseResponse.statusText,
            headers: responseHeaders,
        });

    } catch (error: any) {
        console.error("Supabase Proxy Error:", error);
        return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
    }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
