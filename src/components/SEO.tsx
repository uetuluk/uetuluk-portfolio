import { useHead } from '@unhead/react';
import { useTranslation } from 'react-i18next';
import { useTranslatedPortfolio } from '@/hooks/useTranslatedPortfolio';

const SITE_URL = 'https://uetuluk.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

// Map language codes to og:locale format
const localeMap: Record<string, string> = {
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
  tr: 'tr_TR',
};

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

export function SEO({
  title: customTitle,
  description: customDescription,
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = 'website',
  noindex = false,
}: SEOProps) {
  const { i18n } = useTranslation();
  const portfolio = useTranslatedPortfolio();

  const pageTitle = customTitle
    ? `${customTitle} | ${portfolio.personal.name}`
    : `${portfolio.personal.name} | ${portfolio.personal.title}`;

  const pageDescription = customDescription || portfolio.personal.bio;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const canonicalUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const ogLocale = localeMap[i18n.language] || 'en_US';

  useHead({
    title: pageTitle,
    meta: [
      // Primary meta tags
      { name: 'title', content: pageTitle },
      { name: 'description', content: pageDescription },
      ...(noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),

      // Open Graph / Facebook
      { property: 'og:type', content: type },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:site_name', content: `${portfolio.personal.name} Portfolio` },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: pageDescription },
      { property: 'og:image', content: imageUrl },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        property: 'og:image:alt',
        content: `${portfolio.personal.name} - ${portfolio.personal.title}`,
      },
      { property: 'og:locale', content: ogLocale },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:url', content: canonicalUrl },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: pageDescription },
      { name: 'twitter:image', content: imageUrl },
      {
        name: 'twitter:image:alt',
        content: `${portfolio.personal.name} - ${portfolio.personal.title}`,
      },
    ],
    link: [{ rel: 'canonical', href: canonicalUrl }],
  });

  return null;
}
