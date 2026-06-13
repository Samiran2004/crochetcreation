import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crochet Creation | Handcrafted Yarn Wonders',
  description: 'Discover beautiful, custom-made crochet plushies, apparel, and accessories crafted with love.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-orange-50/20 text-stone-900">
        {children}
      </body>
    </html>
  );
}
