import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Qvix — Warp Speed Video', template: '%s | Qvix' },
  description:
    'Qvix is the next-generation video sharing platform powered by the Quantum Feed — breaking echo chambers with 70/30 Warp Split technology.',
  keywords: ['video', 'sharing', 'quantum feed', 'short videos', 'creator platform'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://qvix.app',
    siteName: 'Qvix',
    title: 'Qvix — Warp Speed Video',
    description: 'The next-generation video platform with Quantum Feed technology.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@qvixapp',
    creator: '@qvixapp',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-qvix-bg text-qvix-text font-sans antialiased overflow-hidden h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
