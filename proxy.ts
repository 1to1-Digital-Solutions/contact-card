import { NextResponse, type NextRequest } from "next/server";

/**
 * Content Security Policy with a per-request nonce.
 *
 * The App Router inlines scripts of its own (the RSC payload) and the layout
 * inlines the theme script, so `script-src` cannot be just `'self'`. A nonce
 * lets those scripts run while anything injected does not: Next.js reads the
 * nonce from this header and stamps it on every script it emits, and the
 * layout reads it back from `x-nonce` for the theme script.
 *
 * `style-src` keeps `'unsafe-inline'` because React Three Fiber sizes its
 * canvas with inline `style` attributes, and so do a few of the components.
 * Nothing is loaded from other origins at runtime, hence the `'self'` lists;
 * `blob:` is what the vCard download link points at.
 */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  // The request headers are what the layout reads (`headers()`); the response
  // header is what the browser enforces. Next.js looks for the nonce in the
  // request's CSP header, so it goes on both.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Only the HTML page needs a nonce. Static files, the share images, the
  // favicon, `robots.txt` and the sitemap are built once and served as they
  // are; running the proxy on them would gain nothing.
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|icon.svg|opengraph-image|twitter-image|robots.txt|sitemap.xml|.*\\.svg$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
