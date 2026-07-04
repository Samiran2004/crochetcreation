import './globals.css';
import type { Metadata, Viewport } from 'next';
import CartDrawer from './components/CartDrawer';

export const metadata: Metadata = {
  metadataBase: new URL('https://crochetcreation.vercel.app'),
  title: {
    default: 'Crochet Creation | Premium Handcrafted Items',
    template: '%s | Crochet Creation',
  },
  description: 'Discover aesthetic, handmade crochet plushies, cozy apparel, and DIY masterclasses crafted with love.',
  manifest: '/manifest.json',
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
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-[#FEF9F6] text-[#2D2525] font-sans">
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}
