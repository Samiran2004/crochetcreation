'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { 
  Heart, 
  Gift, 
  ShoppingBag, 
  Lightbulb, 
  Send, 
  Scissors, 
  Search, 
  Instagram, 
  Facebook, 
  Twitter, 
  ChevronRight,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

// Local image assets — copied directly into public/assets/
const IMAGES = {
  heroYarn: '/assets/marilyn_hero_yarn.png',
  craftingTools: '/assets/marilyn_crafting_tools.png',
  stackedSweaters: '/assets/marilyn_stacked_sweaters.png',
  womanKnitting: '/assets/marilyn_woman_knitting.png',
  knitTexture: '/assets/marilyn_knit_texture.png',
  customerAlice: '/assets/marilyn_customer_alice.png',
  logo: '/assets/crochet_creation_logo.png',
};


export default function CrochetCreationPage() {
  const [activeFilter, setActiveFilter] = useState('TOYS');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customRequestModal, setCustomRequestModal] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', details: '' });
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [pointerPos, setPointerPos] = useState({ x: 20, y: 0 });
  const pathRef = useRef<SVGPathElement>(null);

  // Generates a smooth, flowing crochet chain stitch path (interlocking loops)
  const crochetPathD = useMemo(() => {
    let d = "M 20 0";
    const step = 40;
    const totalPoints = 140; // 140 * 40 = 5600 height
    for (let i = 0; i < totalPoints; i++) {
      const y = i * step;
      if (i % 2 === 0) {
        // Loop sweeping right and crossing back to center
        d += ` C 55 ${(y + 12).toFixed(1)}, -15 ${(y + 28).toFixed(1)}, 20 ${y + step}`;
      } else {
        // Loop sweeping left and crossing back to center
        d += ` C -15 ${(y + 12).toFixed(1)}, 55 ${(y + 28).toFixed(1)}, 20 ${y + step}`;
      }
    }
    return d;
  }, []);


  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
      setScrollProgress(progress);

      if (pathRef.current) {
        const totalLen = pathRef.current.getTotalLength();
        const currentLen = progress * totalLen;
        try {
          const point = pathRef.current.getPointAtLength(currentLen);
          setPointerPos({ x: point.x, y: point.y });
        } catch (err) {
          // Fallback if layout is not fully painted yet
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    const timeout = setTimeout(handleScroll, 100);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [pathLength]);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
    const handleResize = () => {
      if (pathRef.current) {
        setPathLength(pathRef.current.getTotalLength());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitted(true);
    setTimeout(() => {
      setCustomRequestModal(false);
      setRequestSubmitted(false);
      setFormData({ name: '', email: '', details: '' });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#FEF9F6]">
      
      {/* 1. Header/Hero Panel (Dark Textured #6B5656) */}
      <section className="relative lg:sticky lg:top-0 z-0 bg-crochet-charcoal text-[#FEF9F6] pt-6 pb-20 overflow-hidden h-[90vh] min-h-[700px] w-full flex flex-col justify-between">
        
        {/* Parallax inner wrapper */}
        <div 
          className="w-full flex-grow flex flex-col justify-between relative"
          style={{ transform: `translate3d(0, ${scrollY * 0.3}px, 0)` }}
        >
        
        {/* Top Navigation */}
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-20">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D9B4B4]/30 shadow-sm bg-white flex-shrink-0">
              <Image 
                src={IMAGES.logo} 
                alt="CrochetCreation Logo" 
                fill 
                sizes="36px"
                className="object-cover" 
              />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-widest text-[#FEF9F6]">
              CrochetCreation
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase">
            <a href="#home" className="hover:text-[#D9B4B4] transition-colors">HOME</a>
            <span className="relative">
              <a href="#shop" className="hover:text-[#D9B4B4] transition-colors">SHOP</a>
              <span className="absolute -top-3 -right-6 bg-[#D9B4B4] text-[#6B5656] text-[8px] font-black px-1.5 py-0.5 rounded-full">NEW</span>
            </span>
            <a href="#blog" className="hover:text-[#D9B4B4] transition-colors">BLOG</a>
            <a href="#pages" className="hover:text-[#D9B4B4] transition-colors">PAGES</a>
            <a href="#portfolio" className="hover:text-[#D9B4B4] transition-colors">PORTFOLIO</a>
            <a href="#elements" className="hover:text-[#D9B4B4] transition-colors">ELEMENTS</a>
          </nav>

          {/* Icons & Utility */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium tracking-wider">
            <div className="flex items-center gap-1.5 hover:text-[#D9B4B4] cursor-pointer">
              <ShoppingBag className="w-4 h-4 text-[#D9B4B4]" />
              <span>2 items</span>
            </div>
            <span className="text-stone-400">|</span>
            <button className="hover:text-[#D9B4B4]">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="lg:hidden p-2 text-[#FEF9F6] hover:text-[#D9B4B4] transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-18 left-0 w-full bg-crochet-charcoal border-b border-[#FEF9F6]/10 py-6 px-6 z-30 flex flex-col gap-4 text-sm font-semibold tracking-widest uppercase text-center shadow-lg">
            <a href="#home" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4]">HOME</a>
            <a href="#shop" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4]">SHOP</a>
            <a href="#blog" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4]">BLOG</a>
            <a href="#pages" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4]">PAGES</a>
            <a href="#portfolio" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4]">PORTFOLIO</a>
            <a href="#elements" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4]">ELEMENTS</a>
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#FEF9F6]/10">
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4 text-[#D9B4B4]" />
                <span>2 items</span>
              </div>
              <span>|</span>
              <Search className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Left Decorative Column (Pink ribbon, spool, buttons) */}
        <div className="hidden md:flex absolute left-8 top-24 w-36 flex-col items-center gap-6 select-none pointer-events-none z-10">
          {/* Spool */}
          <svg className="w-8 h-10 text-amber-100" viewBox="0 0 32 40" fill="currentColor">
            <rect x="6" y="2" width="20" height="4" rx="1" fill="#D3C1B5" />
            <rect x="10" y="6" width="12" height="28" fill="#E8D1C5" />
            <rect x="6" y="34" width="20" height="4" rx="1" fill="#D3C1B5" />
            <path d="M10,8 L22,12 M10,16 L22,20 M10,24 L22,28" stroke="#D9B4B4" strokeWidth="2" />
          </svg>
          {/* Curled Ribbon */}
          <svg className="w-12 h-44 text-[#D9B4B4]" viewBox="0 0 50 180" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <path d="M10 10 C 35 30, 40 50, 20 70 C 0 90, 5 110, 30 130 C 45 150, 30 170, 15 180" />
          </svg>
          {/* Scattered Buttons */}
          <div className="flex flex-col gap-2 -mt-4">
            <div className="w-5 h-5 rounded-full bg-[#D9B4B4] border border-stone-200 flex items-center justify-center shadow-sm">
              <div className="grid grid-cols-2 gap-0.5 w-1.5 h-1.5"><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div></div>
            </div>
            <div className="w-4 h-4 rounded-full bg-[#B67E7E] border border-stone-200 flex items-center justify-center translate-x-2 shadow-sm">
              <div className="grid grid-cols-2 gap-0.5 w-1.5 h-1.5"><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div></div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#E8D3D3] border border-stone-200 flex items-center justify-center -translate-x-3 shadow-sm">
              <div className="grid grid-cols-2 gap-0.5 w-2 h-2"><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div></div>
            </div>
          </div>
        </div>

        {/* Right Decorative Column (Thread spools, needles) */}
        <div className="hidden md:flex absolute right-8 top-24 w-36 flex-col items-center gap-6 select-none pointer-events-none z-10">
          {/* Spools stack */}
          <div className="flex flex-col gap-3">
            {/* Spool 1: Pink */}
            <div className="relative w-12 h-6 bg-[#D9B4B4] rounded-sm flex items-center justify-center border-y border-stone-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-200"></div>
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-200"></div>
              <span className="text-[7px] text-[#6B5656] font-bold">PINK</span>
            </div>
            {/* Spool 2: White */}
            <div className="relative w-12 h-6 bg-[#FEF9F6] rounded-sm flex items-center justify-center border-y border-stone-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-200"></div>
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-200"></div>
              <span className="text-[7px] text-[#6B5656] font-bold">COTTON</span>
            </div>
            {/* Spool 3: Lavender */}
            <div className="relative w-12 h-6 bg-[#C0B4D9] rounded-sm flex items-center justify-center border-y border-stone-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-200"></div>
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-200"></div>
              <span className="text-[7px] text-[#6B5656] font-bold">WOOL</span>
            </div>
          </div>
          
          {/* Diagonal Knitting Needles */}
          <svg className="w-12 h-24 text-stone-300 -mt-2" viewBox="0 0 50 100" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="90" x2="40" y2="10" strokeLinecap="round" />
            <circle cx="40" cy="10" r="3" fill="#D9B4B4" />
            <line x1="40" y1="90" x2="10" y2="10" strokeLinecap="round" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3" fill="#C0B4D9" />
          </svg>
        </div>

        {/* Center Content */}
        <div className="max-w-3xl mx-auto text-center mt-12 md:mt-20 px-6 relative z-20 flex flex-col items-center">
          
          {/* Logo Icon details */}
          <div className="w-12 h-12 rounded-full border border-[#D9B4B4] flex items-center justify-center mb-6">
            <Heart className="w-5 h-5 fill-[#D9B4B4] text-[#D9B4B4]" />
          </div>

          <h2 className="text-3xl md:text-6xl font-normal tracking-wide leading-tight max-w-xl">
            Find Something You Love
          </h2>
          <p className="text-xs md:text-sm tracking-widest text-[#D9B4B4] uppercase mt-4 mb-8">
            and personalize it to be 100% yours
          </p>

          <button 
            onClick={() => setCustomRequestModal(true)}
            className="border-2 border-[#D9B4B4] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-[#D9B4B4] text-xs uppercase tracking-widest font-bold px-8 py-3.5 rounded-full transition-all duration-300 active:scale-95 shadow-lg"
          >
            View all products
          </button>

          {/* Heart shaped yarn ball */}
          <div className="mt-12 md:mt-16 w-56 h-56 md:w-64 md:h-64 relative animate-pulse duration-[3000ms]">
            <Image 
              src={IMAGES.heroYarn} 
              alt="Marilyn Heart Yarn" 
              fill
              sizes="(max-width: 768px) 224px, 256px"
              className="object-contain rounded-full shadow-2xl border-4 border-[#D9B4B4]/20"
              priority
            />
          </div>
        </div>

        </div> {/* End of Parallax inner wrapper */}
      </section>

      {/* 2. Scrollable Content Wrapper with Parallax Cover Effect */}
      <div className="relative z-10 bg-[#FEF9F6] shadow-[0_-15px_30px_rgba(107,86,86,0.08)]">
        {/* Wavy transition edge sticking out above the content */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-20 transform -translate-y-[98%] pointer-events-none">
          <svg className="relative block w-full h-10 text-[#FEF9F6]" viewBox="0 0 1440 40" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,25 Q15,15 30,25 T60,25 T90,20 T120,30 T150,22 T180,27 T210,18 T240,25 T270,30 T300,20 T330,28 T360,22 T390,27 T420,18 T450,25 T480,30 T510,20 T540,28 T570,22 T600,27 T630,18 T660,25 T690,30 T720,20 T750,28 T780,22 T810,27 T840,18 T870,25 T900,30 T930,20 T960,28 T990,22 T1020,27 T1050,18 T1080,25 T1110,30 T1140,20 T1170,28 T1200,22 T1230,27 T1260,18 T1290,25 T1320,30 T1350,20 T1380,28 T1410,22 T1440,25 L1440,40 L0,40 Z"></path>
          </svg>
        </div>

        {/* Scroll-Triggered SVG Crochet Thread Animation */}
        <div className="absolute left-1 md:left-6 top-0 h-full w-12 md:w-28 pointer-events-none z-30">
          <svg className="w-full h-full overflow-visible" viewBox="-40 0 120 5600" preserveAspectRatio="none">
            {/* Delicate template path representing the base crochet lace draft */}
            <path 
              d={crochetPathD}
              fill="none" 
              stroke="#EADBDB" 
              strokeWidth="1.2" 
              strokeLinecap="round"
              strokeDasharray="6 4"
              opacity="0.35"
            />
            {/* Dynamic active glowing path being crocheted on scroll (using mask for dashed yarn texture) */}
            <path 
              d={crochetPathD}
              fill="none" 
              stroke="url(#thread-gradient)" 
              strokeWidth="4" 
              strokeLinecap="round"
              mask="url(#scroll-mask)"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(217, 180, 180, 0.95)) drop-shadow(0 0 12px rgba(107, 86, 86, 0.6))',
              }}
            />
            {/* Thread active tip (Yarn Ball / Crochet Needle Core) */}
            {scrollProgress > 0.01 && scrollProgress < 0.99 && (
              <g 
                transform={`translate(${pointerPos.x}, ${pointerPos.y})`}
                style={{ transition: 'transform 0.05s ease-out' }}
              >
                {/* Glowing Aura */}
                <circle r="16" fill="#D9B4B4" className="animate-ping opacity-30" />
                
                {/* Rotating Yarn Ball Group */}
                <g style={{ transform: `rotate(${scrollY * 0.7}deg)`, transformOrigin: '0px 0px', transition: 'transform 0.05s ease-out' }}>
                  {/* Yarn ball body */}
                  <circle r="10" fill="#6B5656" stroke="#FEF9F6" strokeWidth="1.2" />
                  {/* Yarn strands overlay to make it look like a real yarn ball */}
                  <path d="M-8,-5 Q0,-10 8,-5 M-10,0 Q0,-5 10,0 M-8,5 Q0,10 8,5 M-5,-8 Q5,0 -5,8" stroke="#FEF9F6" strokeWidth="0.9" fill="none" opacity="0.8" />
                  {/* Thread center core */}
                  <circle r="3.5" fill="#D9B4B4" />
                </g>

                {/* Crochet hook positioned dynamically at the stitching point */}
                <g style={{ transform: 'rotate(-15deg) translate(2px, -2px)' }}>
                  <path d="M-6,-6 L12,12 M10,6 C10,6 14,3 11,-1" stroke="#D9B4B4" strokeWidth="2" strokeLinecap="round" fill="none" />
                </g>
              </g>
            )}


            {/* 1. Crochet Flower Motif at y = 800 */}
            <g 
              style={{
                transformOrigin: '20px 800px',
                transform: `scale(${scrollProgress >= 0.14 ? 1.15 : 0.9})`,
                opacity: scrollProgress >= 0.14 ? 1 : 0.4,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <circle cx="20" cy="800" r="22" fill="#FEF9F6" stroke="#EADBDB" strokeWidth="1" />
              {/* Petals */}
              <circle cx="20" cy="788" r="6" fill={scrollProgress >= 0.14 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              <circle cx="30" cy="794" r="6" fill={scrollProgress >= 0.14 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              <circle cx="30" cy="806" r="6" fill={scrollProgress >= 0.14 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              <circle cx="20" cy="812" r="6" fill={scrollProgress >= 0.14 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              <circle cx="10" cy="806" r="6" fill={scrollProgress >= 0.14 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              <circle cx="10" cy="794" r="6" fill={scrollProgress >= 0.14 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              {/* Inner core */}
              <circle cx="20" cy="800" r="6" fill="#6B5656" />
              <circle cx="20" cy="800" r="3.5" fill="#FEF9F6" />
            </g>

            {/* 2. Crochet Heart Motif at y = 2200 */}
            <g 
              style={{
                transformOrigin: '20px 2200px',
                transform: `scale(${scrollProgress >= 0.39 ? 1.15 : 0.9})`,
                opacity: scrollProgress >= 0.39 ? 1 : 0.4,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <circle cx="20" cy="2200" r="22" fill="#FEF9F6" stroke="#EADBDB" strokeWidth="1" />
              <path 
                d="M20,2192 C15,2187 8,2187 8,2194 C8,2201 17,2208 20,2211 C23,2208 32,2201 32,2194 C32,2187 25,2187 20,2192 Z" 
                fill={scrollProgress >= 0.39 ? '#D9B4B4' : '#EADBDB'} 
                style={{ transition: 'fill 0.4s' }}
              />
              <path 
                d="M20,2195 C17,2191 11,2191 11,2196 C11,2201 18,2206 20,2208 C22,2206 29,2201 29,2196 C29,2191 23,2191 20,2195 Z" 
                fill="#6B5656" 
              />
            </g>

            {/* 3. Crochet Bow Motif at y = 3600 */}
            <g 
              style={{
                transformOrigin: '20px 3600px',
                transform: `scale(${scrollProgress >= 0.64 ? 1.15 : 0.9})`,
                opacity: scrollProgress >= 0.64 ? 1 : 0.4,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <circle cx="20" cy="3600" r="22" fill="#FEF9F6" stroke="#EADBDB" strokeWidth="1" />
              {/* Loops */}
              <path d="M 20 3600 C 8 3588, 2 3594, 8 3602 C 12 3605, 17 3602, 20 3600" fill={scrollProgress >= 0.64 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              <path d="M 20 3600 C 32 3588, 38 3594, 32 3602 C 28 3605, 23 3602, 20 3600" fill={scrollProgress >= 0.64 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              {/* Tails */}
              <path d="M 18 3601 L 12 3612 C 11 3614, 13 3615, 14 3613 L 20 3603" stroke="#6B5656" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 22 3601 L 28 3612 C 29 3614, 27 3615, 26 3613 L 20 3603" stroke="#6B5656" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Center Knot */}
              <circle cx="20" cy="3600" r="3" fill="#6B5656" />
            </g>

            {/* 4. Crochet Ball of Yarn Motif at y = 4800 */}
            <g 
              style={{
                transformOrigin: '20px 4800px',
                transform: `scale(${scrollProgress >= 0.85 ? 1.15 : 0.9})`,
                opacity: scrollProgress >= 0.85 ? 1 : 0.4,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <circle cx="20" cy="4800" r="22" fill="#FEF9F6" stroke="#EADBDB" strokeWidth="1" />
              <circle cx="20" cy="4800" r="11" fill={scrollProgress >= 0.85 ? '#D9B4B4' : '#EADBDB'} style={{ transition: 'fill 0.4s' }} />
              {/* Yarn strands */}
              <path d="M12,4795 Q20,4790 28,4795 M10,4800 Q20,4795 30,4800 M12,4805 Q20,4810 28,4805 M15,4792 Q25,4800 15,4808" stroke="#6B5656" strokeWidth="1" fill="none" />
              {/* Crochet Hook */}
              <path d="M8,4812 L32,4788 M30,4790 C30,4790 33,4787 31,4785" stroke="#6B5656" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>

            <defs>
              {/* Mask that draws a solid white path on scroll */}
              <mask id="scroll-mask">
                <path 
                  ref={pathRef}
                  d={crochetPathD}
                  fill="none" 
                  stroke="#FFFFFF" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray={pathLength || 1000}
                  strokeDashoffset={pathLength ? pathLength - (scrollProgress * pathLength) : 1000}
                  style={{
                    transition: 'stroke-dashoffset 0.1s ease-out'
                  }}
                />
              </mask>
              <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D9B4B4" />
                <stop offset="50%" stopColor="#6B5656" />
                <stop offset="100%" stopColor="#D9B4B4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

      {/* 2. Value Proposition (Cream Background) */}
      <section className="py-20 md:py-28 pl-14 pr-6 md:px-12 bg-[#FEF9F6] border-b border-[#EADBDB]/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-12">
          
          {/* Card 1 */}
          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-14 h-14 rounded-full border border-[#D9B4B4] flex items-center justify-center text-[#D9B4B4] group-hover:bg-[#D9B4B4] group-hover:text-white transition-all duration-300">
              <Heart className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B5656]">Find something you love</h4>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">Our store is a world of vintage and beautiful items designed to inspire warmth.</p>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-14 h-14 rounded-full border border-[#D9B4B4] flex items-center justify-center text-[#D9B4B4] group-hover:bg-[#D9B4B4] group-hover:text-white transition-all duration-300">
              <Gift className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B5656]">If you are looking for a gift</h4>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">The best present is a handmade one that tells a story and lasts a lifetime.</p>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-14 h-14 rounded-full border border-[#D9B4B4] flex items-center justify-center text-[#D9B4B4] group-hover:bg-[#D9B4B4] group-hover:text-white transition-all duration-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B5656]">Buy and sell with confidence</h4>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">It would be easier, faster and safer to buy items from verified organic knits.</p>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-14 h-14 rounded-full border border-[#D9B4B4] flex items-center justify-center text-[#D9B4B4] group-hover:bg-[#D9B4B4] group-hover:text-white transition-all duration-300">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B5656]">Create any idea</h4>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">Models of any complexity in a short time, stitched according to your details.</p>
          </div>

          {/* Card 5 */}
          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-14 h-14 rounded-full border border-[#D9B4B4] flex items-center justify-center text-[#D9B4B4] group-hover:bg-[#D9B4B4] group-hover:text-white transition-all duration-300">
              <Send className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B5656]">Worldwide shipping</h4>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">Express delivery of parcels around the world with full tracking details.</p>
          </div>

          {/* Card 6 */}
          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-14 h-14 rounded-full border border-[#D9B4B4] flex items-center justify-center text-[#D9B4B4] group-hover:bg-[#D9B4B4] group-hover:text-white transition-all duration-300">
              <Scissors className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B5656]">Knitwear restoration</h4>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">Restoration of holes, elimination of puffs and care services for knits.</p>
          </div>

        </div>
      </section>

      {/* 3. "Buy A Finished Product" Section */}
      <section id="shop" className="py-20 pl-14 pr-6 md:px-12 max-w-7xl mx-auto w-full">
        
        {/* Title row */}
        <div className="flex items-center justify-between mb-8 border-b border-[#EADBDB] pb-4">
          <h2 className="text-lg font-black tracking-widest text-[#6B5656] uppercase">BUY A FINISHED PRODUCT</h2>
          <a href="#shop" className="text-xs font-bold text-[#D9B4B4] hover:text-[#6B5656] uppercase tracking-widest flex items-center gap-1 transition-colors">
            SEE ALL <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Filter bar with subtle stripe pattern */}
        <div className="bg-crochet-stripe h-12 rounded-lg flex items-center px-4 overflow-x-auto gap-4 md:gap-8 justify-between shadow-inner mb-12">
          <div className="flex items-center gap-4 md:gap-8 min-w-max">
            {['TOYS', 'SCARVES AND HATS', 'ACCESSORIES', 'PULLOVERS', 'DRESSES', 'FOR KIDS'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1 rounded ${
                  activeFilter === filter 
                    ? 'bg-[#6B5656] text-[#FEF9F6] shadow-sm' 
                    : 'text-[#6B5656] hover:text-black'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B5656] shrink-0 animate-pulse" />
        </div>

        {/* Product Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Product 1 */}
          <div className="bg-white border border-[#EADBDB] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="h-64 bg-amber-50/20 relative overflow-hidden">
              <Image 
                src={IMAGES.craftingTools} 
                alt="Knitted Teddy Bear" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute top-4 left-4 bg-[#D9B4B4] text-[#6B5656] text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                POPULAR
              </span>
            </div>
            <div className="p-6 flex flex-col justify-between border-t border-[#EADBDB]/50">
              <div>
                <span className="text-[9px] font-bold text-[#D9B4B4] uppercase tracking-widest">TOYS</span>
                <h4 className="text-base font-bold text-[#6B5656] mt-1 mb-2">Crochet Teddy Bear Amigurumi</h4>
                <p className="text-xs text-stone-500 leading-relaxed">Handmade with premium cotton yarn, hypoallergenic padding.</p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-50">
                <span className="text-lg font-black text-[#6B5656]">$24.99</span>
                <button className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white p-2.5 rounded-full transition-colors active:scale-95 shadow">
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product 2 */}
          <div className="bg-white border border-[#EADBDB] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="h-64 bg-amber-50/20 relative overflow-hidden">
              <Image 
                src={IMAGES.stackedSweaters} 
                alt="Pastel Sweaters" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute top-4 left-4 bg-[#6B5656] text-[#FEF9F6] text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                HANDMADE
              </span>
            </div>
            <div className="p-6 flex flex-col justify-between border-t border-[#EADBDB]/50">
              <div>
                <span className="text-[9px] font-bold text-[#D9B4B4] uppercase tracking-widest">PULLOVERS</span>
                <h4 className="text-base font-bold text-[#6B5656] mt-1 mb-2">Pastel Cozy Wool Cardigan</h4>
                <p className="text-xs text-stone-500 leading-relaxed">Warm, loose-fit design crafted with soft organic merino wool.</p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-50">
                <span className="text-lg font-black text-[#6B5656]">$89.00</span>
                <button className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white p-2.5 rounded-full transition-colors active:scale-95 shadow">
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product 3 */}
          <div className="bg-white border border-[#EADBDB] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="h-64 bg-amber-50/20 relative overflow-hidden">
              <Image 
                src={IMAGES.heroYarn} 
                alt="Heart Yarn Ball" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute top-4 left-4 bg-[#D9B4B4] text-[#6B5656] text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                NEW RELEASE
              </span>
            </div>
            <div className="p-6 flex flex-col justify-between border-t border-[#EADBDB]/50">
              <div>
                <span className="text-[9px] font-bold text-[#D9B4B4] uppercase tracking-widest">ACCESSORIES</span>
                <h4 className="text-base font-bold text-[#6B5656] mt-1 mb-2">Heart Crochet Yarn Basket</h4>
                <p className="text-xs text-stone-500 leading-relaxed">Perfect desktop organizer for your needles, hooks, and yarns.</p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-50">
                <span className="text-lg font-black text-[#6B5656]">$18.50</span>
                <button className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white p-2.5 rounded-full transition-colors active:scale-95 shadow">
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. "Do It Yourself" (DIY) Section */}
      <section className="py-12 bg-stone-100/30 border-y border-[#EADBDB]/30">
        <div className="max-w-7xl mx-auto pl-14 pr-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column Block */}
          <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-[#EADBDB] shadow-sm">
            {/* Top: Crafting Tools Image */}
            <div className="h-56 relative">
              <Image 
                src={IMAGES.craftingTools} 
                alt="Crafting Tools" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover" 
              />
            </div>
            {/* Middle: Dark Textured Sub-block */}
            <div className="bg-crochet-charcoal text-[#FEF9F6] p-8 flex-grow flex flex-col justify-center items-center text-center space-y-4">
              <span className="text-[10px] font-black tracking-widest text-[#D9B4B4] uppercase">DO IT YOURSELF</span>
              <h3 className="text-lg font-bold tracking-wide leading-snug">
                STEP-BY-STEP MASTER CLASSES WITH PHOTO AND VIDEO LESSONS
              </h3>
              <p className="text-xs text-stone-300 italic">
                “LITTLE CROCHET HEART, MASTER CLASS!”
              </p>
              <button 
                onClick={() => setCustomRequestModal(true)}
                className="bg-[#D9B4B4] hover:bg-[#FEF9F6] text-[#6B5656] text-[10px] uppercase font-black tracking-widest px-6 py-3.5 rounded-full transition-colors shadow mt-2"
              >
                enroll in courses
              </button>
            </div>
            {/* Bottom: Wood textured decorative bar */}
            <div className="bg-crochet-wood h-14 flex items-center justify-center border-t border-stone-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200/50">CROCHETCREATION WORKSHOP</span>
            </div>
          </div>

          {/* Right Column Block */}
          <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-[#EADBDB] shadow-sm relative group min-h-[500px]">
            {/* Main Photo of Woman Knitting */}
            <Image 
              src={IMAGES.womanKnitting} 
              alt="Marilyn Knitting" 
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover" 
            />
            {/* Hover Dark Text Overlay at Bottom */}
            <div className="absolute bottom-0 left-0 w-full bg-crochet-charcoal/95 text-[#FEF9F6] p-6 border-t border-[#D9B4B4]/20 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8px] font-black tracking-wider uppercase text-[#D9B4B4]">LEARN FROM CROCHETCREATION</span>
                <p className="text-xs text-stone-300">Discover masterclasses for all experience levels.</p>
              </div>
              <a href="#about" className="text-xs font-black uppercase tracking-widest text-[#D9B4B4] hover:text-[#FEF9F6] flex items-center gap-1 transition-colors">
                SEE MORE <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 5. "Crochet and Hand Knitting" Section */}
      <section id="about" className="py-24 pl-14 pr-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column (Text & Buttons) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-normal tracking-wide text-[#6B5656] leading-tight">
                CROCHET AND HAND KNITTING
              </h2>
              <p className="text-xs font-black tracking-widest text-[#D9B4B4] uppercase">
                CLOTHES FOR KIDS, ADULTS ACCORDING TO INDIVIDUAL SIZES!
              </p>
            </div>

            {/* Vertical Button Stack */}
            <div className="flex flex-col gap-4 max-w-sm">
              <button 
                onClick={() => setCustomRequestModal(true)}
                className="w-full text-left border border-[#D9B4B4] hover:bg-[#D9B4B4]/10 text-[#6B5656] text-[10px] uppercase font-black tracking-widest px-6 py-4 rounded-lg flex items-center justify-between transition-all"
              >
                <span>HOW TO MAKE AN ORDER</span>
                <ChevronRight className="w-4 h-4 text-[#D9B4B4]" />
              </button>
              
              <button 
                onClick={() => setCustomRequestModal(true)}
                className="w-full text-left border border-[#D9B4B4] hover:bg-[#D9B4B4]/10 text-[#6B5656] text-[10px] uppercase font-black tracking-widest px-6 py-4 rounded-lg flex items-center justify-between transition-all"
              >
                <span>CALCULATE THE COST</span>
                <ChevronRight className="w-4 h-4 text-[#D9B4B4]" />
              </button>
              
              <button 
                onClick={() => setCustomRequestModal(true)}
                className="w-full bg-[#D9B4B4] hover:bg-[#6B5656] hover:text-[#FEF9F6] text-[#6B5656] text-[10px] uppercase font-black tracking-widest px-6 py-4 rounded-lg flex items-center justify-between transition-all shadow-sm"
              >
                <span>MAKE AN ORDER</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column (Images & Text) */}
          <div className="lg:col-span-7 space-y-12">
            {/* Stacked Sweaters Image */}
            <div className="h-96 relative rounded-2xl overflow-hidden border border-[#EADBDB] shadow-md">
              <Image 
                src={IMAGES.stackedSweaters} 
                alt="Stacked Sweaters" 
                fill 
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover" 
              />
            </div>

            {/* Verbatim Texts */}
            <div className="space-y-8 bg-white p-8 rounded-2xl border border-[#EADBDB]/60 shadow-sm leading-relaxed text-stone-600">
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-[#6B5656] flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-[#D9B4B4]"></span> Hi, Welcome to CrochetCreation
                </h4>
                <p className="text-sm">
                  I Started Crocheting In My First Year. Then, In Parallel With My Basic Education, I Received A Second Higher Education. And In The Break Between Classes I Managed To Go To Knitting Courses. I Devoted Two Years To The Courses, After Which I Was Given A Certificate. But I Learned The Simplest Things There - Hold The Hook, Learned The Types Of Loops, Read The Diagrams.
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-stone-100">
                <p className="text-sm">
                  In Order To Become A Real Master Of Crochet Or Knitting, It Is Absolutely Not Necessary To Graduate From A University Or Expensive Courses. All You Need To Get Started Is A Ball Of Wool Yarn, A Hook Or Knitting Needles And Your Boundless Desire To Create.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Customer Reviews (Knit Textured Background) */}
      <section className="relative py-24 overflow-hidden text-center">
        {/* Full Knit Background */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={IMAGES.knitTexture} 
            alt="Knit background" 
            fill 
            sizes="100vw"
            className="object-cover opacity-20 filter grayscale" 
          />
          <div className="absolute inset-0 bg-[#FEF9F6]/90 mix-blend-overlay" />
        </div>

        <div className="max-w-3xl mx-auto pl-14 pr-6 md:px-12 relative z-10 space-y-8">
          <span className="text-[10px] font-black tracking-widest text-[#D9B4B4] uppercase block">WHAT THEY SAY</span>
          <h2 className="text-2xl md:text-4xl font-normal text-[#6B5656]">CUSTOMER REVIEWS</h2>
          
          <div className="flex flex-col items-center space-y-6">
            {/* Alice avatar in pink ring */}
            <div className="relative w-20 h-20 rounded-full p-1 border-2 border-[#D9B4B4]">
              <div className="w-full h-full relative rounded-full overflow-hidden">
                <Image 
                  src={IMAGES.customerAlice} 
                  alt="Alice Review" 
                  fill 
                  sizes="80px"
                  className="object-cover" 
                />
              </div>
            </div>

            {/* Testimonial */}
            <p className="text-sm md:text-base leading-relaxed text-stone-600 max-w-2xl italic">
              "Thanks A Lot Parcel With A Jacket Came Very Quickly. Great Service! Prosperity To Your Store! As Always, Everything Is Impeccable, Neat, Very Touching Gifts From The Catalog, A Piece Of Canvas With A Leaf Is Different Every Time. This Emphasizes The Personal Care For Each Customer."
            </p>
            
            {/* Sign-off */}
            <span className="text-xs font-black tracking-widest text-[#6B5656] uppercase">
              ALICE, 23/03/2021
            </span>
          </div>
        </div>
      </section>

      {/* 7. Footer Panel (Dark Textured #6B5656) */}
      <footer id="contact" className="relative bg-crochet-charcoal text-[#FEF9F6] pt-16 pb-12 overflow-hidden border-t border-[#FEF9F6]/10">
        
        {/* Torn paper edge top (pointing down/inverted) */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10 rotate-180">
          <svg className="relative block w-full h-4 text-[#FEF9F6]" viewBox="0 0 1440 40" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,25 Q15,15 30,25 T60,25 T90,20 T120,30 T150,22 T180,27 T210,18 T240,25 T270,30 T300,20 T330,28 T360,22 T390,27 T420,18 T450,25 T480,30 T510,20 T540,28 T570,22 T600,27 T630,18 T660,25 T690,30 T720,20 T750,28 T780,22 T810,27 T840,18 T870,25 T900,30 T930,20 T960,28 T990,22 T1020,27 T1050,18 T1080,25 T1110,30 T1140,20 T1170,28 T1200,22 T1230,27 T1260,18 T1290,25 T1320,30 T1350,20 T1380,28 T1410,22 T1440,25 L1440,40 L0,40 Z"></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto pl-14 pr-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-20">
          
          {/* Left Side: Logo & Question */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#D9B4B4]/30 shadow-sm bg-white flex-shrink-0">
                <Image 
                  src={IMAGES.logo} 
                  alt="CrochetCreation Logo" 
                  fill 
                  sizes="32px"
                  className="object-cover" 
                />
              </div>
              <span className="text-xl font-bold tracking-widest text-[#FEF9F6]">
                CrochetCreation
              </span>
            </div>
            <p className="text-sm font-light text-stone-300 max-w-xl leading-relaxed">
              IF YOU HAVE QUESTIONS OR WANT TO ARRANGE A PERSONAL MEETING AND A MASTER CLASS?
            </p>

            {/* Scattered pink/purple buttons visual representation */}
            <div className="flex flex-wrap gap-2 pt-4">
              <button onClick={() => setCustomRequestModal(true)} className="w-6 h-6 rounded-full bg-[#D9B4B4] border border-[#FEF9F6]/20 flex items-center justify-center hover:scale-110 transition-transform"><div className="grid grid-cols-2 gap-0.5 w-1.5 h-1.5"><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div></div></button>
              <button onClick={() => setCustomRequestModal(true)} className="w-5 h-5 rounded-full bg-[#B67E7E] border border-[#FEF9F6]/20 flex items-center justify-center hover:scale-110 transition-transform"><div className="grid grid-cols-2 gap-0.5 w-1.5 h-1.5"><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div></div></button>
              <button onClick={() => setCustomRequestModal(true)} className="w-7 h-7 rounded-full bg-[#E8D3D3] border border-[#FEF9F6]/20 flex items-center justify-center hover:scale-110 transition-transform"><div className="grid grid-cols-2 gap-0.5 w-2 h-2"><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div><div className="bg-[#6B5656] rounded-full w-0.5 h-0.5"></div></div></button>
              <button onClick={() => setCustomRequestModal(true)} className="w-6 h-6 rounded-full bg-[#C89696] border border-[#FEF9F6]/20 flex items-center justify-center hover:scale-110 transition-transform"><div className="grid grid-cols-2 gap-0.5 w-1.5 h-1.5"><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div><div className="bg-[#FEF9F6] rounded-full w-0.5 h-0.5"></div></div></button>
            </div>
          </div>

          {/* Right Side: Social links & Rose pink yarn ball */}
          <div className="lg:col-span-5 flex flex-col justify-between items-start lg:items-end gap-8">
            
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full border border-[#D9B4B4] hover:bg-[#D9B4B4] hover:text-[#6B5656] flex items-center justify-center text-[#D9B4B4] transition-colors"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#D9B4B4] hover:bg-[#D9B4B4] hover:text-[#6B5656] flex items-center justify-center text-[#D9B4B4] transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#D9B4B4] hover:bg-[#D9B4B4] hover:text-[#6B5656] flex items-center justify-center text-[#D9B4B4] transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#D9B4B4] hover:bg-[#D9B4B4] hover:text-[#6B5656] flex items-center justify-center text-[#D9B4B4] transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>

            {/* Yarn Ball and Needles */}
            <div className="flex items-center gap-4 relative">
              <div className="w-24 h-24 relative rounded-full overflow-hidden border border-[#D9B4B4]/20 shadow-md">
                <Image 
                  src={IMAGES.heroYarn} 
                  alt="Marilyn Footer Yarn" 
                  fill 
                  sizes="96px"
                  className="object-cover" 
                />
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#D9B4B4] uppercase">CROCHETCREATION HANDMADE</span>
            </div>

          </div>
        </div>

        {/* Footer legal bar */}
        <div className="max-w-7xl mx-auto pl-14 pr-6 md:px-12 border-t border-[#FEF9F6]/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider gap-4">
          <span>© 2026 CrochetCreation Studio. All Rights Reserved.</span>
          <div className="flex items-center gap-2">
            <span>THANK YOU FOR WATCHING</span>
            <span className="text-rose-400">❤</span>
          </div>
        </div>
      </footer>
      </div> {/* End of Scrollable Content Wrapper */}

      {/* Interactive Custom Order/Request Modal */}
      {customRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-[#FEF9F6] border border-[#EADBDB] rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button 
              onClick={() => setCustomRequestModal(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-800 p-1"
            >
              ✕
            </button>
            <div className="text-center space-y-2 mb-6">
              <span className="text-3xl">🎨</span>
              <h3 className="text-xl font-bold text-[#6B5656]">Request Custom Knits</h3>
              <p className="text-xs text-stone-500">Provide details and CrochetCreation will contact you directly.</p>
            </div>

            {requestSubmitted ? (
              <div className="py-8 text-center space-y-3 text-emerald-600 font-bold">
                <div className="text-5xl">✨</div>
                <p>Request Submitted Successfully!</p>
                <p className="text-xs text-stone-400 font-normal">We will respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter your name"
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter your email"
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Request Details</label>
                  <textarea
                    name="details"
                    required
                    rows={3}
                    value={formData.details}
                    onChange={handleFormChange}
                    placeholder="E.g., Pastel sweater in sizing M..."
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold py-3.5 rounded-xl text-xs tracking-widest uppercase mt-4 transition-all duration-350 active:scale-95 shadow-md"
                >
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
