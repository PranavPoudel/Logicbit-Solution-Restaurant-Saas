import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { theme } from '@/config/theme';
import { OG_LOCALE } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: { default: theme.brand.name, template: `%s | ${theme.brand.name}` },
    description: t('description'),
    // A relative canonical resolves to each page's own address, so every page names itself as the original.
    alternates: { canonical: './' },
    openGraph: { type: 'website', siteName: theme.brand.name, locale: OG_LOCALE[locale] },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    // NextIntlClientProvider wraps only the customer routes
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}