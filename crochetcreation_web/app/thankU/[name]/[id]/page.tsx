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
    <div className="min-h-screen bg-parchment-warm relative overflow-hidden font-sans">
      {/* Subtle Floating Ornaments */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-[10%] left-[8%] animate-float-soft">
          <Heart className="w-5 h-5 text-blush opacity-30" strokeWidth={1.5} />
        </div>
        <div className="absolute top-[25%] right-[12%] animate-float-soft" style={{ animationDelay: '1.5s' }}>
          <Sparkles className="w-6 h-6 text-gold opacity-20" strokeWidth={1} />
        </div>
        <div className="absolute bottom-[20%] left-[15%] animate-float-soft" style={{ animationDelay: '0.5s' }}>
          <Star className="w-4 h-4 text-terracotta-soft opacity-20" strokeWidth={1.5} />
        </div>
        <div className="absolute top-[60%] right-[8%] animate-float-soft" style={{ animationDelay: '2.5s' }}>
          <Heart className="w-4 h-4 text-blush opacity-25" strokeWidth={1.5} />
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 py-12">
        <div className="w-full max-w-lg">
          
          {/* Main Card */}
          <div className="bg-parchment-card rounded-2xl shadow-panel overflow-hidden border border-line-soft animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
            
            {/* Header Section */}
            <div className="relative pt-12 pb-8 px-6 sm:px-10 text-center animate-in fade-in zoom-in-95 duration-1000 delay-150 fill-mode-both">
              {/* Logo */}
              <div className="mx-auto mb-6 w-28 h-28 relative group">
                <div className="absolute inset-0 bg-blush/20 rounded-full blur-2xl group-hover:bg-blush/30 transition-colors duration-700"></div>
                <img
                  src="/assets/ydvosqobemjif56aj4xu.jpg"
                  alt="Crochet Creation Logo"
                  className="w-full h-full object-cover rounded-full shadow-soft ring-1 ring-line/50 relative z-10 p-1 bg-white"
                />
              </div>

              {/* Brand Identity */}
              <h1 className="text-3xl font-display text-ink tracking-tight mb-2">
                Crochet Creation
              </h1>
              <p className="text-sm font-serif text-terracotta-soft italic tracking-wide">
                Handmade with love & care
              </p>
            </div>

            {/* Elegant Divider */}
            <div className="flex items-center justify-center px-10">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-line to-transparent opacity-60"></div>
              <Heart className="w-3 h-3 mx-4 text-line" strokeWidth={2} />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-line to-transparent opacity-60"></div>
            </div>

            {/* Body Section */}
            <div className="px-6 sm:px-10 py-10 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
              
              {/* Greeting */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-parchment rounded-full mb-6 border border-line-soft shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span className="text-[10px] font-bold text-teal-deep uppercase tracking-[0.2em]">
                    Special Appreciation
                  </span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-display text-ink leading-tight mb-4">
                  Thank You,<br />{customerName}!
                </h2>
                
                <p className="text-base text-bodytext leading-relaxed font-serif max-w-sm mx-auto">
                  I truly appreciate you choosing Crochet Creation! Every purchase supports my craft and means the world to me.
                </p>
              </div>

              {/* Purchase Details */}
              <div className="flex flex-col items-center">
                <p className="text-[9px] font-bold text-muted uppercase tracking-[0.15em] mb-1.5">
                  Order Date
                </p>
                <div className="bg-parchment px-5 py-2 rounded-lg border border-line-soft text-[15px] font-semibold text-ink shadow-sm">
                  {purchaseDate}
                </div>
              </div>

              {/* Personal Message Card */}
              <div className="relative bg-parchment-warm rounded-xl p-8 text-left border border-line-soft overflow-hidden group hover:shadow-soft transition-shadow duration-500">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blush/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-blush/10 transition-colors duration-700"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
                
                <p className="text-[15px] text-bodytext leading-relaxed font-serif italic relative z-10 text-center">
                  &ldquo;Every stitch in your handmade piece carries my dedication and love. I hope it brings warmth, joy, and a touch of artistry to your world.&rdquo;
                </p>
                
                <p className="text-center text-[13px] text-terracotta-deep mt-6 font-display italic relative z-10">
                  — Samiran
                </p>
              </div>
            </div>

            {/* Social & Contact */}
            <div className="bg-parchment/60 border-t border-line-soft px-6 sm:px-10 py-8 animate-in fade-in duration-1000 delay-500 fill-mode-both">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="https://instagram.com/crochet_creation_02"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-line-soft group"
                >
                  <div className="w-8 h-8 rounded-full bg-parchment-card border border-line-soft flex items-center justify-center shrink-0 group-hover:shadow-sm transition-all">
                    <Instagram className="w-4 h-4 text-terracotta" />
                  </div>
                  <span className="text-sm font-semibold text-ink group-hover:text-terracotta transition-colors">
                    @crochet_creation_02
                  </span>
                </a>

                <a
                  href="https://crochetcreation.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-line-soft group"
                >
                  <div className="w-8 h-8 rounded-full bg-parchment-card border border-line-soft flex items-center justify-center shrink-0 group-hover:shadow-sm transition-all">
                    <Globe className="w-4 h-4 text-teal" />
                  </div>
                  <span className="text-sm font-semibold text-ink group-hover:text-teal transition-colors">
                    Official Website
                  </span>
                </a>
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-6 text-xs font-semibold text-muted">
                <MapPin className="w-3.5 h-3.5" />
                <span>Hooghly, Kolkata</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-teal-deep px-6 sm:px-10 py-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/assets/ydvosqobemjif56aj4xu.jpg')] opacity-[0.03] bg-cover bg-center mix-blend-overlay"></div>
              <p className="text-[15px] text-ondark font-serif italic relative z-10 tracking-wide">
                Customisation always available
              </p>
              <p className="text-[10px] text-ondark-muted mt-3 tracking-[0.15em] uppercase font-bold relative z-10">
                © {new Date().getFullYear()} Crochet Creation
              </p>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="text-center mt-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700 fill-mode-both">
            <a
              href="https://crochetcreation.vercel.app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/80 backdrop-blur-sm text-[11px] font-bold text-ink hover:text-teal-deep rounded-full shadow-sm transition-all border border-line hover:border-teal/30 hover:shadow-soft"
            >
              <Globe className="w-4 h-4" />
              <span className="tracking-[0.1em] uppercase">Return to Store</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
