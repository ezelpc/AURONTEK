export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    // @ts-ignore
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        return new Response('Configuration Error: BACKEND_URL not set', { status: 500 });
    }

    const url = new URL(request.url);

    // 1. Handle CORS Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
            },
        });
    }

    // 2. Proxy Logic
    // Replace the origin (https://vercel-app) with backend (http://ip:port)
    const targetUrl = request.url.replace(url.origin, backendUrl);

    // Prepare headers: Remove host/origin to avoid backend rejection/loops
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('origin');

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: request.body,
            redirect: 'follow',
        });

        // 3. Forward response with CORS headers
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Proxy Error:', error);
        return new Response('Proxy Error', { status: 502 });
    }
}
