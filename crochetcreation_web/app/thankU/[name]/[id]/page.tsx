import { Great_Vibes, Montserrat } from 'next/font/google';
import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getApiUrl } from '../../../utils/apiFetch';
import { Globe, Instagram } from 'lucide-react';

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
    openGraph: { title, description, url, images: [{ url: ogImage, width: 1200, height: 630, alt: `Thank You ${customerName}` }], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function ThankYouPage({ params }: Props) {
  const { name, id } = params;

  let data = null;
  let error = false;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || getApiUrl();
    const res = await fetch(`${apiUrl}/api/thankyou/${name}/${id}`, { cache: 'no-store' });
    if (res.ok) { data = await res.json(); } else { error = true; }
  } catch { error = true; }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F2EFE9] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className={`${montserrat.className} text-2xl text-[#1C1C1C] mb-3`}>PAGE NOT FOUND</h1>
          <p className={`${montserrat.className} text-sm text-[#555] font-light leading-relaxed mb-6`}>
            This thank-you page doesn&apos;t exist or may have been removed.
          </p>
          <a href="https://crochetcreation.vercel.app" className={`${montserrat.className} inline-block px-6 py-3 border border-[#1C1C1C] text-[#1C1C1C] rounded-full text-xs tracking-widest hover:bg-[#1C1C1C] hover:text-[#F2EFE9] transition-colors`}>
            RETURN HOME
          </a>
        </div>
      </div>
    );
  }

  const customerName = data.name;

  return (
    <>
      {/* Embedded CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ty-card-enter {
          0% { opacity: 0; transform: scale(0.96) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ty-plant-sway {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(0.8deg) translateX(2px); }
          75% { transform: rotate(-0.5deg) translateX(-1px); }
        }
        @keyframes ty-plant-draw {
          0% { stroke-dashoffset: 800; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ty-leaf-grow {
          0% { opacity: 0; transform: scale(0.3); }
          60% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ty-gold-line-draw {
          0% { stroke-dashoffset: 600; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ty-dot-pop {
          0% { opacity: 0; transform: scale(0); }
          70% { transform: scale(1.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ty-text-rise {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ty-heart-beat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.2); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          60% { transform: scale(1); }
        }
        @keyframes ty-gold-shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes ty-blob-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }

        .ty-card { animation: ty-card-enter 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .ty-plant { animation: ty-plant-sway 8s ease-in-out infinite; transform-origin: bottom center; }
        .ty-stem { stroke-dasharray: 800; animation: ty-plant-draw 2.5s ease-out 0.5s forwards; stroke-dashoffset: 800; }
        .ty-leaf-1 { opacity: 0; transform-origin: center; animation: ty-leaf-grow 0.6s ease-out 1.2s forwards; }
        .ty-leaf-2 { opacity: 0; transform-origin: center; animation: ty-leaf-grow 0.6s ease-out 1.5s forwards; }
        .ty-leaf-3 { opacity: 0; transform-origin: center; animation: ty-leaf-grow 0.6s ease-out 1.8s forwards; }
        .ty-leaf-4 { opacity: 0; transform-origin: center; animation: ty-leaf-grow 0.6s ease-out 2.1s forwards; }
        .ty-leaf-5 { opacity: 0; transform-origin: center; animation: ty-leaf-grow 0.6s ease-out 2.4s forwards; }
        .ty-leaf-6 { opacity: 0; transform-origin: center; animation: ty-leaf-grow 0.6s ease-out 2.7s forwards; }
        .ty-leaf-7 { opacity: 0; transform-origin: center; animation: ty-leaf-grow 0.6s ease-out 3.0s forwards; }
        .ty-gold-line { stroke-dasharray: 600; animation: ty-gold-line-draw 3s ease-out 0.8s forwards; stroke-dashoffset: 600; }
        .ty-gold-dot { opacity: 0; animation: ty-dot-pop 0.4s ease-out forwards; }
        .ty-dark-dot { opacity: 0; animation: ty-dot-pop 0.4s ease-out forwards; }
        .ty-title { opacity: 0; animation: ty-text-rise 1s ease-out 0.6s forwards; }
        .ty-divider { opacity: 0; animation: ty-text-rise 0.8s ease-out 1.0s forwards; }
        .ty-message { opacity: 0; animation: ty-text-rise 1s ease-out 1.3s forwards; }
        .ty-love { opacity: 0; animation: ty-text-rise 0.8s ease-out 1.7s forwards; }
        .ty-brand { opacity: 0; animation: ty-text-rise 0.8s ease-out 2.0s forwards; }
        .ty-heart-icon { animation: ty-heart-beat 3s ease-in-out 2.5s infinite; }
        .ty-gold-shimmer { animation: ty-gold-shimmer 3s ease-in-out infinite; }
        .ty-blob-peach { animation: ty-blob-breathe 10s ease-in-out infinite; transform-origin: top left; }
        .ty-blob-grey { animation: ty-blob-breathe 12s ease-in-out 2s infinite; transform-origin: bottom left; }
        .ty-blob-dark { animation: ty-blob-breathe 11s ease-in-out 4s infinite; transform-origin: bottom right; }
        .ty-links { opacity: 0; animation: ty-text-rise 0.8s ease-out 2.4s forwards; }
      `}} />

      <div className="min-h-screen bg-[#E5E0D8] flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-[#E6C8B4]/40">

        {/* The Card */}
        <div className="ty-card relative w-full max-w-[900px] aspect-[4/5] sm:aspect-[1.5/1] bg-[#F2EFE9] shadow-2xl overflow-hidden rounded-sm">

          {/* Paper Texture */}
          <div className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }}></div>

          {/* Peach Blob */}
          <svg className="ty-blob-peach absolute top-0 left-0 w-[60%] sm:w-[45%] h-[55%] sm:h-[85%] z-0" viewBox="0 0 400 400" preserveAspectRatio="none">
            <path d="M0,0 L400,0 C340,80 360,200 240,280 C150,340 70,390 0,400 Z" fill="#E6C8B4" />
          </svg>

          {/* Grey Blob */}
          <svg className="ty-blob-grey absolute bottom-0 left-0 w-[55%] sm:w-[48%] h-[32%] sm:h-[42%] z-0" viewBox="0 0 400 250" preserveAspectRatio="none">
            <path d="M0,250 L0,100 C60,70 160,160 250,120 C330,85 400,180 400,250 Z" fill="#D3D3CB" />
          </svg>

          {/* Dark Blob */}
          <svg className="ty-blob-dark absolute bottom-0 right-0 w-[45%] sm:w-[38%] h-[32%] sm:h-[55%] z-0" viewBox="0 0 300 300" preserveAspectRatio="none">
            <path d="M300,300 L300,60 C265,120 190,150 130,200 C70,250 30,300 0,300 Z" fill="#2F2E2C" />
          </svg>

          {/* Gold Lines */}
          <svg className="absolute inset-0 w-full h-full z-[1]" viewBox="0 0 800 500" preserveAspectRatio="none">
            <path className="ty-gold-line" d="M-10,280 C100,160 200,40 420,-20" fill="none" stroke="#B8955A" strokeWidth="1.2" />
            <path className="ty-gold-line" style={{ animationDelay: '1.2s' }} d="M30,530 C200,430 380,490 530,400 C650,320 740,400 820,370" fill="none" stroke="#B8955A" strokeWidth="1.2" />

            {/* Gold splatters */}
            <circle className="ty-gold-dot ty-gold-shimmer" style={{ animationDelay: '2.0s' }} cx="680" cy="55" r="1.2" fill="#B8955A" />
            <circle className="ty-gold-dot" style={{ animationDelay: '2.2s' }} cx="720" cy="80" r="2.2" fill="#B8955A" />
            <circle className="ty-gold-dot ty-gold-shimmer" style={{ animationDelay: '2.4s' }} cx="660" cy="90" r="0.8" fill="#B8955A" />
            <circle className="ty-gold-dot" style={{ animationDelay: '2.6s' }} cx="750" cy="38" r="1.3" fill="#B8955A" />
            <circle className="ty-gold-dot ty-gold-shimmer" style={{ animationDelay: '2.8s' }} cx="700" cy="110" r="1.8" fill="#B8955A" />
            <circle className="ty-gold-dot" style={{ animationDelay: '3.0s' }} cx="640" cy="70" r="0.9" fill="#B8955A" />
            <circle className="ty-gold-dot" style={{ animationDelay: '3.2s' }} cx="770" cy="95" r="1.5" fill="#B8955A" />
            <circle className="ty-gold-dot ty-gold-shimmer" style={{ animationDelay: '3.4s' }} cx="695" cy="130" r="1.0" fill="#B8955A" />

            {/* Dark scatter dots */}
            <circle className="ty-dark-dot" style={{ animationDelay: '1.5s' }} cx="85" cy="55" r="1.5" fill="#1C1C1C" />
            <circle className="ty-dark-dot" style={{ animationDelay: '1.7s' }} cx="115" cy="35" r="1.0" fill="#1C1C1C" />
            <circle className="ty-dark-dot" style={{ animationDelay: '1.9s' }} cx="95" cy="85" r="2.0" fill="#1C1C1C" />
            <circle className="ty-dark-dot" style={{ animationDelay: '2.1s' }} cx="135" cy="440" r="1.3" fill="#1C1C1C" />
            <circle className="ty-dark-dot" style={{ animationDelay: '2.3s' }} cx="170" cy="465" r="1.8" fill="#1C1C1C" />
            <circle className="ty-dark-dot" style={{ animationDelay: '2.5s' }} cx="105" cy="415" r="1.0" fill="#1C1C1C" />

            {/* Gold heart outline (top-right area) */}
            <path className="ty-heart-icon" d="M695,28 C695,22 702,18 707,22 C712,18 719,22 719,28 C719,35 707,42 707,42 C707,42 695,35 695,28 Z" fill="none" stroke="#B8955A" strokeWidth="1" />
          </svg>

          {/* Botanical Plant */}
          <svg className="ty-plant absolute bottom-0 left-[3%] sm:left-[6%] w-[35%] sm:w-[22%] h-[65%] sm:h-[90%] z-[2]" viewBox="0 0 180 500" preserveAspectRatio="xMidYMax meet">
            <g stroke="#2A2A2A" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Main stem */}
              <path className="ty-stem" d="M40,500 C45,420 55,340 65,280 C75,220 85,160 95,100 C102,60 108,30 112,10" />

              {/* Leaves - alternating sides, realistic elongated shapes */}
              {/* Leaf 1 - top, right */}
              <g className="ty-leaf-1">
                <path d="M112,15 C120,5 135,2 140,12 C145,22 130,32 112,25" />
                <path d="M112,20 C125,14 140,12" strokeWidth="0.6" />
              </g>

              {/* Leaf 2 - left */}
              <g className="ty-leaf-2">
                <path d="M108,55 C95,40 78,38 75,50 C72,62 88,70 108,60" />
                <path d="M108,57 C92,50 75,50" strokeWidth="0.6" />
              </g>

              {/* Leaf 3 - right */}
              <g className="ty-leaf-3">
                <path d="M102,100 C115,85 132,84 135,96 C138,108 120,118 102,108" />
                <path d="M102,104 C118,96 135,96" strokeWidth="0.6" />
              </g>

              {/* Leaf 4 - left */}
              <g className="ty-leaf-4">
                <path d="M92,155 C75,140 56,142 55,155 C54,168 72,175 92,165" />
                <path d="M92,160 C74,155 55,155" strokeWidth="0.6" />
              </g>

              {/* Leaf 5 - right */}
              <g className="ty-leaf-5">
                <path d="M82,215 C100,198 118,200 118,215 C118,230 98,235 82,225" />
                <path d="M82,220 C100,212 118,215" strokeWidth="0.6" />
              </g>

              {/* Leaf 6 - left */}
              <g className="ty-leaf-6">
                <path d="M72,280 C52,265 34,270 35,284 C36,298 55,302 72,290" />
                <path d="M72,285 C54,278 35,284" strokeWidth="0.6" />
              </g>

              {/* Leaf 7 - right, lower */}
              <g className="ty-leaf-7">
                <path d="M58,355 C78,340 92,348 90,362 C88,376 70,378 58,365" />
                <path d="M58,360 C74,354 90,362" strokeWidth="0.6" />
              </g>

              {/* Small accent dots along stem */}
              <circle className="ty-dark-dot" style={{ animationDelay: '1.6s' }} cx="143" cy="8" r="1.5" fill="#2A2A2A" stroke="none" />
              <circle className="ty-dark-dot" style={{ animationDelay: '1.8s' }} cx="70" cy="48" r="1.2" fill="#2A2A2A" stroke="none" />
              <circle className="ty-dark-dot" style={{ animationDelay: '2.0s' }} cx="140" cy="92" r="1.5" fill="#2A2A2A" stroke="none" />
              <circle className="ty-dark-dot" style={{ animationDelay: '2.2s' }} cx="50" cy="152" r="1.2" fill="#2A2A2A" stroke="none" />
              <circle className="ty-dark-dot" style={{ animationDelay: '2.4s' }} cx="123" cy="212" r="1.5" fill="#2A2A2A" stroke="none" />
              <circle className="ty-dark-dot" style={{ animationDelay: '2.6s' }} cx="30" cy="278" r="1.2" fill="#2A2A2A" stroke="none" />
              <circle className="ty-dark-dot" style={{ animationDelay: '2.8s' }} cx="95" cy="358" r="1.5" fill="#2A2A2A" stroke="none" />
            </g>
          </svg>

          {/* --- FOREGROUND TEXT --- */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 sm:px-12 sm:ml-[8%]">

            {/* "Thank You" */}
            <div className="ty-title flex items-baseline justify-center gap-2 sm:gap-3 mb-3 sm:mb-5">
              <h1 className={`${greatVibes.className} text-[3.2rem] sm:text-7xl md:text-[5.5rem] text-[#1C1C1C] leading-none`}>
                Thank You
              </h1>
              <svg className="ty-heart-icon w-5 h-5 sm:w-7 sm:h-7 text-[#B8955A] -mt-3 sm:-mt-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>

            {/* Divider */}
            <div className="ty-divider flex items-center justify-center w-[140px] sm:w-[260px] mb-5 sm:mb-7">
              <div className="h-[1px] flex-1 bg-[#1C1C1C]/60"></div>
              <div className="mx-3">
                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#1C1C1C] fill-current" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <div className="h-[1px] flex-1 bg-[#1C1C1C]/60"></div>
            </div>

            {/* Message */}
            <div className={`ty-message ${montserrat.className} text-[9px] sm:text-[13px] tracking-[0.18em] sm:tracking-[0.25em] text-[#1C1C1C] font-light leading-[2.2] sm:leading-[2] mb-5 sm:mb-7 uppercase`}>
              DEAR {customerName},<br />
              YOUR KINDNESS<br />
              TRULY MEANS A LOT.
            </div>

            {/* With love */}
            <div className={`ty-love ${greatVibes.className} text-2xl sm:text-[2.5rem] text-[#B8955A] mb-2 sm:mb-4 flex items-center justify-center gap-2`}>
              with love,{' '}
              <span className="ty-heart-icon inline-block text-lg sm:text-2xl">♡</span>
            </div>

            {/* Brand */}
            <div className={`ty-brand ${montserrat.className} text-[8px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.35em] text-[#1C1C1C] font-medium uppercase`}>
              Crochet Creation
            </div>
          </div>
        </div>

        {/* Links below */}
        <div className={`ty-links mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10`}>
          <a href="https://instagram.com/crochet_creation_02" target="_blank" rel="noopener noreferrer"
            className={`${montserrat.className} flex items-center gap-2 text-[10px] sm:text-xs tracking-widest uppercase text-[#777] hover:text-[#1C1C1C] transition-colors duration-300`}>
            <Instagram className="w-3.5 h-3.5" />
            <span>@crochet_creation_02</span>
          </a>
          <a href="https://crochetcreation.vercel.app" target="_blank" rel="noopener noreferrer"
            className={`${montserrat.className} flex items-center gap-2 text-[10px] sm:text-xs tracking-widest uppercase text-[#777] hover:text-[#1C1C1C] transition-colors duration-300`}>
            <Globe className="w-3.5 h-3.5" />
            <span>Website</span>
          </a>
        </div>
      </div>
    </>
  );
}

