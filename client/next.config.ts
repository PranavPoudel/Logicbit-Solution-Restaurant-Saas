import createNextIntlPlugin from 'next-intl/plugin';
import { API_URL } from './lib/api-config';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const apiUrl = new URL(API_URL);

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
        ...(apiUrl.port ? { port: apiUrl.port } : {}),
        pathname: '/uploads/**',
      },
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
    ],
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
};

export default withNextIntl(nextConfig);
