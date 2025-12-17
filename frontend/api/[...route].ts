export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const url = new URL(request.url);
    // @ts-ignore
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        return new Response('Configuration Error: BACKEND_URL not set', { status: 500 });
    }

    // Construct target URL
    // Remove '/api' prefix if your backend expects paths without it, 
    // OR keep it if backend is mounted at /api.
    // Based on previous configs: Backend is http://.../api
    // So we just replace the host.

    // request.url comes as https://vercel-domain/api/users...
    // We want http://backend-ip/api/users...

    // Logic: Replace local origin with backend url
    const targetUrl = request.url.replace(url.origin, backendUrl);

    // Prepare headers
    const headers = new Headers(request.headers);
    // Remove host header to avoid confusion at backend
    headers.delete('host');
    // Ensure we communicate we are a proxy? (Optional)

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: request.body,
            redirect: 'follow',
        });

        // Forward response
        return response;
    } catch (error) {
        console.error('Proxy Error:', error);
        return new Response('Proxy Error', { status: 502 });
    }
}
