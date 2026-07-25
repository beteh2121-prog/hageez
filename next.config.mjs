import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare's OpenNext adapter needs either a paid Cloudflare Images
    // binding or unoptimized mode for next/image. unoptimized:true is the
    // zero-cost, zero-extra-setup path: images render as plain <img> tags
    // pointing directly at the original URL, so nothing can silently break
    // — you just lose Next's automatic resizing/format conversion, which
    // Fourthwall/Gumroad/Supabase/Sanity already handle CDN-side anyway.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'imgproxy.fourthwall.dev' },
      { protocol: 'https', hostname: '**.fourthwall.com' },
      { protocol: 'https', hostname: 'public-files.gumroad.com' },
      { protocol: 'https', hostname: '**.gumroad.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

// Enables Cloudflare bindings (KV cache, etc.) during `next dev`.
// No-op in production/CI builds — safe to always call.
if (process.env.NODE_ENV === 'development') {
  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare');
  await initOpenNextCloudflareForDev();
}

export default withBundleAnalyzer(nextConfig);
