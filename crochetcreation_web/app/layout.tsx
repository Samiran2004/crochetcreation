import './globals.css';
import type { Metadata } from 'next';
import CartDrawer from './components/CartDrawer';

export const metadata: Metadata = {
  title: 'Crochet Creation | Handcrafted Knitwear & Crochet Studio',
  description: 'A modern, feminine, artisanal e-commerce shop featuring bespoke crochet plushies, cozy apparel, and DIY masterclasses.',
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
