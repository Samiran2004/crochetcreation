import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Instrument_Sans } from 'next/font/google';
import CartDrawer from './components/CartDrawer';
import SmoothScroll from './components/motion/SmoothScroll';

/**
 * Typography is a two-role system from one matched family.
 *
 * Instrument Serif carries the large editorial moments — hero, section titles,
 * band headings. It ships a single weight, which at display sizes is exactly
 * the point: a high-contrast serif set in regular reads far more expensive
 * than a bolded one. Anything small (card titles, labels, UI) uses Instrument
 * Sans instead, where a 400-weight serif would look thin.
 *
 * Both are self-hosted by next/font, so there is no render-blocking request and
 * no flash of fallback type.
 */
const display = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const body = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://crochetcreation.vercel.app'),
  title: {
    default: 'Crochet Creation | Premium Handcrafted Items',
    template: '%s | Crochet Creation',
  },
  description: 'Discover aesthetic, handmade crochet plushies, cozy apparel, and DIY masterclasses crafted with love.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Crochet',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crochetcreation.vercel.app',
    siteName: 'Crochet Creation',
    title: 'Crochet Creation | Premium Handcrafted Items',
    description: 'Discover aesthetic, handmade crochet plushies, cozy apparel, and DIY masterclasses crafted with love.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Crochet Creation - Premium Handcrafted Items & Crochet Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crochet Creation | Premium Handcrafted Items',
    description: 'Discover aesthetic, handmade crochet plushies, cozy apparel, and DIY masterclasses crafted with love.',
    images: ['/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#F4EADA',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} scroll-smooth`}>
      <body className="antialiased min-h-screen bg-paper text-bodytext font-sans">
        <SmoothScroll />
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}
