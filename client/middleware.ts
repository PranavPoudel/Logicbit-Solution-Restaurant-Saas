import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { isPrivatePath } from '@/lib/seo';

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

  const response = isExcluded ? NextResponse.next() : intlMiddleware(request);
  // Pages for one person or one restaurant's staff must not show up in search results.
  if (isPrivatePath(pathname)) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};