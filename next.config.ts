import type { NextConfig } from "next";

/**
 * Response headers that do not depend on the request. The Content Security
 * Policy is the exception: it carries a per-request nonce, so `proxy.ts` sets
 * it instead.
 */
const SECURITY_HEADERS = [
  // The page is never meant to be framed; `frame-ancestors` in the CSP says
  // the same to browsers that honour it, this one covers the rest.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The card reads the phone's motion sensors (shake, tilt) from the page
  // itself; everything else stays off.
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(self), gyroscope=(self), camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
