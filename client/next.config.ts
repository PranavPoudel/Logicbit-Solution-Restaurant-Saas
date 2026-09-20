import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  // Your existing config (e.g., images, etc.)
};

export default withNextIntl(nextConfig);