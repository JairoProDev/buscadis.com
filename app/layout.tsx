import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdisosGratuitosCacheProvider } from '@/contexts/AdisosGratuitosCache';
import { defaultLocale } from '@/i18n';
import MotionProvider from '@/components/MotionProvider';
import FloatingChatbot from '@/components/FloatingChatbot';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { UIProvider } from '@/contexts/UIContext';
import { FavoritosProvider } from '@/contexts/FavoritosContext';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import SessionTracker from '@/components/SessionTracker';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import {
  buildDefaultOgImageMeta,
  buildDefaultTwitterImageMeta,
  getSiteUrl,
} from '@/lib/seo/og-image';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: {
    default: 'Buscadis - Adisos Clasificados',
    template: '%s | Buscadis',
  },
  description: 'Publica y encuentra adisos clasificados en Perú. Empleos, inmuebles, vehículos, servicios, productos, eventos, negocios y más.',
  keywords: ['clasificados', 'avisos', 'empleos', 'inmuebles', 'vehículos', 'servicios', 'productos', 'eventos', 'negocios', 'Perú', 'Cusco'],
  authors: [{ name: 'Buscadis' }],
  creator: 'Buscadis',
  publisher: 'Buscadis',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: siteUrl,
    siteName: 'Buscadis',
    title: 'Buscadis — Encuentra ofertas y oportunidades',
    description:
      'Empleos, inmuebles, vehículos, servicios, productos, eventos y negocios. Rápido, fácil y gratis.',
    images: buildDefaultOgImageMeta(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buscadis — Encuentra ofertas y oportunidades',
    description:
      'Empleos, inmuebles, vehículos, servicios, productos, eventos y negocios. Rápido, fácil y gratis.',
    images: buildDefaultTwitterImageMeta(),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Agregar cuando tengas Google Search Console
    // google: 'verification-code',
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Buscadis',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        <link rel="canonical" href={siteUrl} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'auto';
                  const root = document.documentElement;
                  const meta = document.querySelector('meta[name="theme-color"]');
                  const setColor = function(dark) {
                    if (meta) meta.setAttribute('content', dark ? '#13171d' : '#ffffff');
                  };
                  if (theme === 'dark') {
                    root.classList.add('dark-mode', 'dark');
                    setColor(true);
                  } else if (theme === 'light') {
                    root.classList.add('light-mode', 'light');
                    setColor(false);
                  } else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      root.classList.add('dark-mode', 'dark');
                      setColor(true);
                    } else {
                      root.classList.add('light-mode', 'light');
                      setColor(false);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <MotionProvider>
            <AuthProvider>
              <FavoritosProvider>
                <UIProvider>
                  <AdisosGratuitosCacheProvider>
                    <NavigationProvider>
                      <SessionTracker />
                      <AnalyticsProvider />
                      <OfflineIndicator />
                      {children}
                      <InstallPrompt />
                    </NavigationProvider>
                  </AdisosGratuitosCacheProvider>
                </UIProvider>
              </FavoritosProvider>
            </AuthProvider>
          </MotionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
