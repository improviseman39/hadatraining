/** @type {import('next').NextConfig} */
const nextConfig = {
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
