import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server'; 

const intlMiddleware = createMiddleware({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) { 
  const pathname = request.nextUrl.pathname; 

  const excludedPrefixes = [
    '/owner',
    '/admin',
    '/delivery',
    '/api',
    '/_next'
  ];

  const isExcluded = excludedPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isExcluded) {
    return;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};