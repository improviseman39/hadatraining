/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
