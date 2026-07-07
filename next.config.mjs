import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

export default withBundleAnalyzer(nextConfig);
