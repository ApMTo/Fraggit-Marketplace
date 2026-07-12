import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: '..',
  },
  images: {
    remotePatterns: [
      // Cloudinary uploads (lots, categories, avatars)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // Seed / third-party mock media
      {
        protocol: 'https',
        hostname: 'sm.ign.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.sketchfab.com',
        pathname: '/**',
      },
      // Allow other https CDNs without blocking Image
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
