// Vimeo's resumable upload endpoint isn't a fixed hostname (varies by
// upload session), so connect-src whitelists the whole vimeo.com family
// rather than one host — only reachable from the admin-only upload form.
// Local dev's Supabase runs on 127.0.0.1 (see images.remotePatterns below)
// rather than *.supabase.co, so that origin is only added outside prod.
const isProd = process.env.NODE_ENV === "production";
const localSupabase = isProd ? "" : " http://127.0.0.1:*";

// 'unsafe-eval' is needed only for Next dev mode's Fast Refresh runtime
// (webpack HMR eval()) — the production build never evals script.
//
// 'unsafe-inline' on script-src is required in production too: the App
// Router injects small inline <script> tags at runtime to progressively
// reveal streamed Suspense boundaries (React's "$RC"-style hydration
// wiring) on every single page, not just ones that look async. Without
// it, the browser silently blocks those scripts per CSP with no visible
// error to the user — every click site-wide just does nothing forever,
// looking exactly like the page "freezing" (a component stuck on its
// Suspense fallback, or a form silently never running its onSubmit).
// The safe fix is a per-request nonce instead of a blanket allowance;
// that requires wiring a nonce through middleware into headers() (which
// this static config can't do) — worth doing as a follow-up, but
// 'unsafe-inline' unblocks the whole site immediately in the meantime.
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://images.unsplash.com https://*.supabase.co${localSupabase}`,
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co https://*.vimeo.com${localSupabase}`,
  `frame-src https://player.vimeo.com https://*.supabase.co${localSupabase}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        // Uploaded announcement images are served from the public
        // announcement-images Supabase Storage bucket.
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        // Same bucket, but local dev's Supabase runs on 127.0.0.1 instead
        // of a *.supabase.co domain.
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Next.js caps Server Action request bodies at 1MB by default. PDF
    // handouts are submitted straight through the updateBlock/addBlock
    // Server Actions (unlike video, which bypasses our server entirely via
    // direct-to-Vimeo upload), so anything over ~1MB was silently rejected.
    // Raised to match the app's own 20MB PDF size check in actions.ts.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
