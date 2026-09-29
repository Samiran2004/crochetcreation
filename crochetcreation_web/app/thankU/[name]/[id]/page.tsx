import { Great_Vibes, Montserrat } from 'next/font/google';
import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getApiUrl } from '../../../utils/apiFetch';
import { Globe, Instagram, MapPin } from 'lucide-react';

const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' });
const montserrat = Montserrat({ weight: ['300', '400', '500'], subsets: ['latin'], display: 'swap' });

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || getApiUrl();
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
      <div className="min-h-screen bg-[#F2EFE9] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className={`${montserrat.className} text-2xl text-[#1C1C1C] mb-3`}>
            PAGE NOT FOUND
          </h1>
          <p className={`${montserrat.className} text-sm text-[#555] font-light leading-relaxed mb-6`}>
            This thank-you page doesn't exist or may have been removed.
          </p>
          <a
            href="https://crochetcreation.vercel.app"
            className={`${montserrat.className} inline-block px-6 py-3 border border-[#1C1C1C] text-[#1C1C1C] rounded-full text-xs tracking-widest hover:bg-[#1C1C1C] hover:text-[#F2EFE9] transition-colors`}
          >
            RETURN HOME
          </a>
        </div>
      </div>
    );
  }

  const customerName = data.name;

  return (
    <div className="min-h-screen bg-[#E5E0D8] flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-[#E6C8B4]/40">
      
      {/* The Physical Card Wrapper */}
      <div className="relative w-full max-w-[900px] aspect-[4/5] sm:aspect-[1.5/1] bg-[#F2EFE9] shadow-2xl overflow-hidden rounded-sm animate-in fade-in zoom-in-[0.98] duration-1000">
        
        {/* --- BACKGROUND SVG ELEMENTS --- */}
        
        {/* 1. Paper Texture Overlay (Subtle noise) */}
        <div className="absolute inset-0 opacity-[0.4] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        {/* 2. Top-Left Peach Blob */}
        <svg className="absolute top-0 left-0 w-[60%] sm:w-[45%] h-[50%] sm:h-[80%] z-0" viewBox="0 0 400 400" preserveAspectRatio="none">
          <path d="M0,0 L380,0 C320,100 350,220 220,280 C120,330 50,380 0,400 Z" fill="#E6C8B4" />
        </svg>

        {/* 3. Bottom-Left Grey Blob */}
        <svg className="absolute bottom-0 left-0 w-[55%] sm:w-[45%] h-[35%] sm:h-[45%] z-0" viewBox="0 0 400 250" preserveAspectRatio="none">
          <path d="M0,250 L0,120 C80,90 180,180 260,140 C340,100 400,200 400,250 Z" fill="#D3D3CB" />
        </svg>

        {/* 4. Bottom-Right Dark Blob */}
        <svg className="absolute bottom-0 right-0 w-[45%] sm:w-[35%] h-[35%] sm:h-[60%] z-0" viewBox="0 0 300 300" preserveAspectRatio="none">
          <path d="M300,300 L300,80 C270,140 180,160 120,210 C60,260 30,300 0,300 Z" fill="#2F2E2C" />
        </svg>

        {/* 5. Gold Wavy Lines & Splatters */}
        <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 800 500" preserveAspectRatio="none">
          {/* Top-left gold line intersecting peach blob */}
          <path d="M-20,250 C120,130 220,30 400,-20" fill="none" stroke="#B8955A" strokeWidth="1.5" />
          {/* Bottom-spanning gold line */}
          <path d="M50,550 C250,420 400,480 550,380 C680,290 750,420 850,380" fill="none" stroke="#B8955A" strokeWidth="1.5" />
          
          {/* Gold splatters/dots */}
          <circle cx="700" cy="50" r="1.5" fill="#B8955A" />
          <circle cx="740" cy="80" r="2.5" fill="#B8955A" />
          <circle cx="680" cy="90" r="1" fill="#B8955A" />
          <circle cx="760" cy="40" r="1.5" fill="#B8955A" />
          <circle cx="790" cy="110" r="2" fill="#B8955A" />
          <circle cx="650" cy="70" r="1" fill="#B8955A" />
          <circle cx="720" cy="120" r="1.5" fill="#B8955A" />
          
          {/* Dark dots on the left */}
          <circle cx="80" cy="60" r="1.5" fill="#1C1C1C" />
          <circle cx="120" cy="40" r="1" fill="#1C1C1C" />
          <circle cx="90" cy="90" r="2" fill="#1C1C1C" />
          <circle cx="140" cy="450" r="1.5" fill="#1C1C1C" />
          <circle cx="180" cy="480" r="2" fill="#1C1C1C" />
          <circle cx="110" cy="420" r="1" fill="#1C1C1C" />
        </svg>

        {/* 6. Botanical Line Art */}
        <svg className="absolute bottom-0 left-[2%] sm:left-[5%] w-[40%] sm:w-[28%] h-[60%] sm:h-[80%] z-0" viewBox="0 0 200 400" preserveAspectRatio="xMinYMax meet">
          <g stroke="#1C1C1C" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Main stem */}
            <path d="M10,400 Q80,200 130,50" />
            
            {/* Leaves outline */}
            <path d="M130,50 Q145,20 160,35 Q145,60 130,50" />
            <path d="M115,90 Q85,70 80,95 Q105,105 115,90" />
            <path d="M100,135 Q135,115 145,140 Q120,155 100,135" />
            <path d="M85,185 Q50,165 40,195 Q75,205 85,185" />
            <path d="M70,240 Q115,220 130,255 Q95,270 70,240" />
            <path d="M50,310 Q10,290 0,330 Q40,335 50,310" />
            
            {/* Center veins */}
            <path d="M130,50 Q145,40 160,35" strokeWidth="0.8"/>
            <path d="M115,90 Q95,85 80,95" strokeWidth="0.8"/>
            <path d="M100,135 Q125,130 145,140" strokeWidth="0.8"/>
            <path d="M85,185 Q60,185 40,195" strokeWidth="0.8"/>
            <path d="M70,240 Q100,240 130,255" strokeWidth="0.8"/>
            <path d="M50,310 Q20,315 0,330" strokeWidth="0.8"/>
            
            {/* Delicate dots near leaves */}
            <circle cx="165" cy="25" r="1.5" fill="#1C1C1C" stroke="none"/>
            <circle cx="75" cy="85" r="1.5" fill="#1C1C1C" stroke="none"/>
            <circle cx="150" cy="130" r="1.5" fill="#1C1C1C" stroke="none"/>
            <circle cx="35" cy="180" r="1.5" fill="#1C1C1C" stroke="none"/>
            <circle cx="135" cy="240" r="1.5" fill="#1C1C1C" stroke="none"/>
          </g>
        </svg>

        {/* --- FOREGROUND TEXT CONTENT --- */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 sm:px-12 pl-[15%] sm:pl-0 sm:ml-[10%] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          
          {/* Main "Thank You" Script */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <h1 className={`${greatVibes.className} text-6xl sm:text-7xl md:text-[5.5rem] text-[#1C1C1C] leading-none`}>
              Thank You
            </h1>
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#B8955A] -mt-4 sm:-mt-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>

          {/* Divider Line with Heart */}
          <div className="flex items-center justify-center w-full max-w-[180px] sm:max-w-[280px] mb-6 sm:mb-8">
            <div className="h-[1px] flex-1 bg-[#1C1C1C]/70"></div>
            <div className="mx-3 sm:mx-4">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1C1C1C] fill-current" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <div className="h-[1px] flex-1 bg-[#1C1C1C]/70"></div>
          </div>

          {/* Message Text */}
          <div className={`${montserrat.className} text-[10px] sm:text-[13px] tracking-[0.2em] sm:tracking-[0.25em] text-[#1C1C1C] font-light leading-[2] sm:leading-loose mb-6 sm:mb-8 uppercase`}>
            DEAR {customerName},<br />
            YOUR KINDNESS<br />
            TRULY MEANS A LOT.
          </div>

          {/* With Love Signature */}
          <div className={`${greatVibes.className} text-2xl sm:text-4xl text-[#B8955A] mb-3 sm:mb-5 flex items-center justify-center gap-2`}>
            with love, 
            <span className="text-xl sm:text-2xl">♡</span>
          </div>

          {/* Business Name */}
          <div className={`${montserrat.className} text-[9px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] text-[#1C1C1C] uppercase`}>
            Crochet Creation
          </div>

        </div>
      </div>

      {/* External Links (Below the card) */}
      <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 animate-in fade-in duration-1000 delay-700">
        <a
          href="https://instagram.com/crochet_creation_02"
          target="_blank"
          rel="noopener noreferrer"
          className={`${montserrat.className} flex items-center gap-2 text-[10px] sm:text-xs tracking-widest uppercase text-[#555] hover:text-[#1C1C1C] transition-colors`}
        >
          <Instagram className="w-3.5 h-3.5" />
          <span>@crochet_creation_02</span>
        </a>
        <a
          href="https://crochetcreation.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className={`${montserrat.className} flex items-center gap-2 text-[10px] sm:text-xs tracking-widest uppercase text-[#555] hover:text-[#1C1C1C] transition-colors`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Website</span>
        </a>
      </div>

    </div>
  );
}
