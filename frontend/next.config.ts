import type { NextConfig } from "next";

/**
 * Baseline response security headers.
 *
 * The app previously served none, so it could be framed by any origin
 * (clickjacking), allowed MIME sniffing, and leaked full referrer URLs to the
 * third-party tile and geocoding hosts it calls.
 */
const securityHeaders = [
  // Blocks clickjacking. frame-ancestors is the modern replacement for
  // X-Frame-Options and is honoured by current browsers.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser second-guessing declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin cross-site, so map/geocoding providers never receive
  // the full path a user is viewing.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs these device APIs.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Removes the "X-Powered-By: Next.js" stack disclosure.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
