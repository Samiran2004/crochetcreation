import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getApiUrl } from '../../../utils/apiFetch';
import {
  Heart,
  MapPin,
  Globe,
  Instagram,
  Sparkles,
  Gift,
  Star,
} from 'lucide-react';

interface Props {
  params: { name: string; id: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const name = params.name;
  let customerName = name.replace(/-/g, ' '); 
  try {
    const res = await fetch(`${getApiUrl()}/api/thankyou/${name}/${params.id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      customerName = data.name;
    }
  } catch (e) {
    // ignore
  }

  const title = `Thank You, ${customerName}! | Crochet Creation`;
  const description = `A special thank you to ${customerName} for choosing Crochet Creation. Your support helps us keep crafting with love and passion!`;
  const url = `https://crochetcreation.vercel.app/thankU/${name}/${params.id}`;
  const ogImage = 'https://crochetcreation.vercel.app/og-image.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Thank You ${customerName}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    }
  };
}

export default async function ThankYouPage({ params }: Props) {
  const { name, id } = params;

  let data = null;
  let error = false;

  try {
    // Fetch data directly on the server
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || getApiUrl(); // Use env if available on server
    const res = await fetch(`${apiUrl}/api/thankyou/${name}/${id}`, { cache: 'no-store' });
    if (res.ok) {
      data = await res.json();
    } else {
      error = true;
    }
  } catch {
    error = true;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FDF6EE] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#EADCC9] rounded-full flex items-center justify-center">
            <Gift className="w-10 h-10 text-[#8D6E63]" />
          </div>
          <h1 className="text-2xl font-bold text-[#3E2723] mb-3 font-serif">
            Page Not Found
          </h1>
          <p className="text-sm text-[#6D4C41] leading-relaxed">
            This thank-you page doesn't exist or may have been removed.
          </p>
          <a
            href="https://crochetcreation.vercel.app"
            className="inline-block mt-6 px-6 py-3 bg-[#1F4E4A] text-white rounded-xl text-sm font-semibold hover:bg-[#16403C] transition-colors"
          >
            Visit Crochet Creation
          </a>
        </div>
      </div>
    );
  }

  const customerName = data.name;
  const purchaseDate = new Date(data.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#FDF6EE] relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left flowers */}
        <div className="absolute -top-4 -left-4 w-40 h-40 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="50" cy="50" r="8" fill="#E8A0BF" />
            <circle cx="30" cy="70" r="6" fill="#D4A0C0" />
            <circle cx="70" cy="30" r="5" fill="#F0C0D0" />
            <circle cx="80" cy="80" r="7" fill="#D99A86" />
            <circle cx="40" cy="100" r="4" fill="#E8A0BF" />
            <circle cx="100" cy="50" r="6" fill="#F0C0D0" />
            <circle cx="60" cy="120" r="5" fill="#D4A0C0" />
          </svg>
        </div>
        {/* Top-right flowers */}
        <div className="absolute -top-4 -right-4 w-40 h-40 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="150" cy="50" r="8" fill="#E8A0BF" />
            <circle cx="170" cy="70" r="6" fill="#D4A0C0" />
            <circle cx="130" cy="30" r="5" fill="#F0C0D0" />
            <circle cx="120" cy="80" r="7" fill="#D99A86" />
            <circle cx="160" cy="100" r="4" fill="#E8A0BF" />
            <circle cx="100" cy="50" r="6" fill="#F0C0D0" />
          </svg>
        </div>
        {/* Bottom-left leaf */}
        <div className="absolute bottom-10 -left-10 w-48 h-48 opacity-15 rotate-12">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <ellipse cx="80" cy="120" rx="40" ry="70" fill="#6B8E6B" transform="rotate(-30 80 120)" />
            <ellipse cx="120" cy="100" rx="30" ry="55" fill="#7BA37B" transform="rotate(-20 120 100)" />
          </svg>
        </div>
        {/* Bottom-right floral */}
        <div className="absolute -bottom-4 -right-4 w-40 h-40 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="150" cy="150" r="8" fill="#E8A0BF" />
            <circle cx="130" cy="170" r="6" fill="#D4A0C0" />
            <circle cx="170" cy="130" r="5" fill="#F0C0D0" />
            <circle cx="120" cy="140" r="7" fill="#D99A86" />
          </svg>
        </div>

        {/* Floating hearts */}
        <div className="absolute top-[15%] left-[8%] animate-bounce" style={{ animationDuration: '3s' }}>
          <Heart className="w-4 h-4 text-[#D99A86] opacity-30 fill-[#D99A86]" />
        </div>
        <div className="absolute top-[25%] right-[12%] animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Heart className="w-3 h-3 text-[#E8A0BF] opacity-25 fill-[#E8A0BF]" />
        </div>
        <div className="absolute bottom-[30%] left-[15%] animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <Star className="w-3 h-3 text-[#C79A4B] opacity-25 fill-[#C79A4B]" />
        </div>
        <div className="absolute top-[40%] right-[6%] animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}>
          <Sparkles className="w-4 h-4 text-[#C79A4B] opacity-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-lg">

          {/* Main Card */}
          <div
            className="bg-[#FFF9F2] rounded-3xl shadow-xl overflow-hidden border border-[#EADCC9]/60"
            style={{
              boxShadow: '0 20px 60px -15px rgba(139, 110, 80, 0.15), 0 8px 25px -8px rgba(139, 110, 80, 0.10)',
            }}
          >
            {/* Card Header with Logo */}
            <div className="relative pt-8 pb-6 px-6 text-center">
              {/* Logo */}
              <div className="mx-auto mb-4 w-32 h-32 relative">
                <img
                  src="/assets/crochet_creation_logo.png"
                  alt="Crochet Creation Logo"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>

              {/* Brand Title */}
              <h1
                className="text-2xl sm:text-3xl font-bold text-[#3E2723] tracking-wide font-serif"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                CROCHET CREATION
              </h1>
              <p
                className="text-sm text-[#6D4C41] mt-1 italic tracking-wider"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                Handmade crochet products
              </p>
            </div>

            {/* Divider with decorative dots */}
            <div className="flex items-center justify-center gap-3 px-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D99A86]/40 to-transparent" />
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D99A86]/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C79A4B]/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#D99A86]/50" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D99A86]/40 to-transparent" />
            </div>

            {/* Thank You Content */}
            <div className="px-6 sm:px-8 py-8 text-center space-y-6">
              {/* Thank You Heading */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1F4E4A]/8 rounded-full mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-[#C79A4B]" />
                  <span className="text-[10px] font-bold text-[#1F4E4A] uppercase tracking-widest">
                    Special Appreciation
                  </span>
                </div>
                <h2
                  className="text-xl sm:text-2xl font-bold text-[#3E2723] font-serif"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  Thank You, {customerName}!
                </h2>
                <p className="text-sm text-[#6D4C41] mt-3 leading-relaxed max-w-sm mx-auto">
                  We truly appreciate you choosing Crochet Creation! Every purchase
                  supports our artisans and keeps the craft alive.
                </p>
              </div>

              {/* Purchase Date Card */}
              <div className="bg-[#FDF6EE] border border-[#EADCC9] rounded-2xl p-4 max-w-xs mx-auto">
                <p className="text-[10px] font-bold text-[#8D6E63] uppercase tracking-widest mb-1">
                  Purchase Date
                </p>
                <p className="text-sm font-semibold text-[#3E2723]">{purchaseDate}</p>
              </div>

              {/* Message */}
              <div className="bg-gradient-to-br from-[#1F4E4A] to-[#16403C] rounded-2xl p-5 text-left">
                <p className="text-sm text-[#F4EADA] leading-relaxed italic">
                  &ldquo;Every stitch in your handmade piece carries our dedication and
                  love. We hope it brings warmth, joy, and a touch of artistry to
                  your world. Thank you for being part of the Crochet Creation
                  family!&rdquo;
                </p>
                <p className="text-right text-xs text-[#C4D3C9] mt-3 font-semibold">
                  — The Crochet Creation Team 🧶
                </p>
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="bg-[#F4EADA]/50 border-t border-[#EADCC9]/60 px-6 sm:px-8 py-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8A0BF]/15 flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4 text-[#C0663A]" />
                </div>
                <a
                  href="https://instagram.com/crochet_creation_02"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#3E2723] hover:text-[#C0663A] transition-colors"
                >
                  crochet_creation_02
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1F4E4A]/8 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-[#1F4E4A]" />
                </div>
                <a
                  href="https://crochetcreation.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#3E2723] hover:text-[#1F4E4A] transition-colors"
                >
                  https://crochetcreation.vercel.app/
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C0663A]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#C0663A]" />
                </div>
                <span className="text-sm font-semibold text-[#3E2723]">
                  Hooghly-Kolkata
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#3E2723] px-6 sm:px-8 py-5 text-center">
              <p
                className="text-base text-[#F4EADA] font-semibold font-serif"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                Thank you{' '}
                <span className="text-[#D99A86]">|</span>{' '}
                Customisation available
              </p>
              <p className="text-[10px] text-[#A1887F] mt-2 tracking-wider uppercase font-medium">
                © {new Date().getFullYear()} Crochet Creation. Handmade with ❤️
              </p>
            </div>
          </div>

          {/* Subtle CTA */}
          <div className="text-center mt-6">
            <a
              href="https://crochetcreation.vercel.app"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#8D6E63] hover:text-[#5D4037] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explore more at Crochet Creation</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
