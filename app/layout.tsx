import type { Metadata } from 'next';
import { Mulish } from 'next/font/google';
import './globals.css';

const mulish = Mulish({
  variable: '--font-mulish',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://clipsearch.ru'),
  title: 'CLIP Search — автоматическая проверка рекламных фотоотчётов',
  description: 'Программа на базе Machine Vision и AI находит рекламные макеты на фото стендов, ускоряет проверку в 5–10 раз и формирует готовый XLSX-отчёт.',
  keywords: [
    'проверка фотоотчётов',
    'автоматизация рекламного агентства',
    'поиск рекламного макета на фото',
    'контроль размещения рекламы',
    'machine vision',
    'распознавание изображений',
    'CLIP Search',
  ],
  alternates: { canonical: '/' },
  icons: { icon: '/assets/logo.png' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/',
    siteName: 'CLIP Search',
    title: 'CLIP Search — фотоотчёты проверяются сами',
    description: 'Автоматическая проверка размещения рекламных макетов на сотнях фотографий за минуты.',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: 'CLIP Search — фотоотчёты проверяются сами' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLIP Search — фотоотчёты проверяются сами',
    description: 'Автоматическая проверка размещения рекламных макетов на сотнях фотографий за минуты.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CLIP Search',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Windows',
    description: 'Программа автоматизации проверки размещения рекламных макетов на фотографиях стендов.',
    url: 'https://clipsearch.ru/',
    image: 'https://clipsearch.ru/og.png',
    provider: {
      '@type': 'Organization',
      name: 'VOID MEDIA',
      url: 'https://voidmedia.ru/',
      telephone: '+7-499-677-68-83',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: '59000',
      description: 'Профессиональная лицензия от 59 000 рублей в год',
    },
    featureList: [
      'Поиск рекламного макета на фотографиях стендов',
      'Обработка сложной перспективы, бликов и частичных перекрытий',
      'Различение похожих версий макетов',
      'Автоматический XLSX-отчёт',
      'Сортировка результатов FOUND и NOTFOUND',
    ],
  };

  return (
    <html lang="ru">
      <body className={`${mulish.variable} antialiased`}>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
