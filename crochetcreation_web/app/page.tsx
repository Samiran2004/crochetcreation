'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  X,
  User,
  Lock,
  LogOut
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
  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  const router = useRouter();

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

  // New interactive feature states
  const [themeColor, setThemeColor] = useState('rose');
  const [cartItemsCount, setCartItemsCount] = useState(2);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  // Load custom homepage images on mount
  useEffect(() => {
    const fetchHomepageImages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/homepage-images`);
        if (res.ok) {
          const data = await res.json();
          const resolved: Record<string, string> = {};
          for (const key in data) {
            if (data[key] && data[key].url) {
              resolved[key] = data[key].url;
            }
          }
          setCustomImages(resolved);
        }
      } catch (err) {
        console.error("Failed to load custom homepage images:", err);
      }
    };
    fetchHomepageImages();
  }, [API_URL]);

  const getImageSrc = (key: keyof typeof IMAGES) => {
    return customImages[key] || IMAGES[key];
  };

  // Auth states
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'verify' | 'reset'>('login');
  const [authFormData, setAuthFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Sync token and user profile on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken) setToken(savedToken);
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUserProfile(parsedUser);
          if (parsedUser.is_admin) {
            router.push('/admin/dashboard');
          }
        } catch (e) {
          console.error("Failed to parse user profile:", e);
        }
      }
    }
  }, [router]);

  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setAuthLoading(true);

    const apiUrl = API_URL;

    try {
      if (authMode === 'forgot') {
        const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to request OTP. Please verify your email.');
        }

        setAuthSuccessMsg("OTP sent to your email!");
        setAuthMode('verify');
      } else if (authMode === 'verify') {
        const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, otp: otpCode })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Invalid or expired OTP.');
        }

        setAuthSuccessMsg("OTP verified! Set your new password.");
        setAuthMode('reset');
      } else if (authMode === 'reset') {
        const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, otp: otpCode, password: newPassword })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to reset password.');
        }

        setAuthSuccessMsg("Password reset successfully! Please log in.");
        setAuthMode('login');
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
      } else if (authMode === 'register') {
        const res = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: authFormData.first_name,
            last_name: authFormData.last_name,
            email: authFormData.email,
            mobile: authFormData.mobile,
            password: authFormData.password
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Registration failed. Please check inputs.');
        }

        setAuthSuccessMsg("Account created! Please log in.");
        setAuthMode('login');
        setAuthFormData(prev => ({ ...prev, password: '' }));
      } else {
        const bodyData = new URLSearchParams();
        bodyData.append('username', authFormData.email);
        bodyData.append('password', authFormData.password);

        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyData.toString()
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Incorrect email/mobile or password.');
        }

        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);

        const userObj = data.user || {
          email: authFormData.email,
          first_name: authFormData.email.split('@')[0],
          is_admin: false
        };
        setUserProfile(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));

        setAuthModalOpen(false);
        setAuthFormData({ first_name: '', last_name: '', email: '', mobile: '', password: '' });

        if (userObj.is_admin) {
          router.push('/admin/dashboard');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const defaultProducts = useMemo(() => [
    {
      _id: '1',
      category: 'TOYS',
      name: 'Crochet Teddy Bear Amigurumi',
      description: 'Handmade with premium cotton yarn, hypoallergenic padding.',
      price: 24.99,
      image_url: getImageSrc('craftingTools'),
      badge: 'POPULAR'
    },
    {
      _id: '2',
      category: 'PULLOVERS',
      name: 'Pastel Cozy Wool Cardigan',
      description: 'Warm, loose-fit design crafted with soft organic merino wool.',
      price: 89.00,
      image_url: getImageSrc('stackedSweaters'),
      badge: 'HANDMADE'
    },
    {
      _id: '3',
      category: 'ACCESSORIES',
      name: 'Heart Crochet Yarn Basket',
      description: 'Perfect desktop organizer for your needles, hooks, and yarns.',
      price: 18.50,
      image_url: getImageSrc('heroYarn'),
      badge: 'NEW RELEASE'
    }
  ], [customImages]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProductsList(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  const displayProducts = useMemo(() => {
    const list = productsList.length > 0 ? productsList : defaultProducts;
    return list.filter(p => {
      const cat = (p.category || '').toUpperCase();
      const filter = activeFilter.toUpperCase();
      return cat === filter || (filter === 'TOYS' && cat.includes('TOY')) || (filter === 'ACCESSORIES' && cat.includes('ACCESSORY'));
    });
  }, [productsList, defaultProducts, activeFilter]);


  // Theme configuration
  const THEME_COLORS = useMemo(() => ({
    rose: {
      primary: '#D9B4B4',
      primaryDark: '#6B5656',
      accent: '#B67E7E',
      bg: '#FEF9F6',
      border: '#EADBDB',
      border30: 'rgba(234, 219, 219, 0.3)',
      border50: 'rgba(234, 219, 219, 0.5)',
      border60: 'rgba(234, 219, 219, 0.6)',
      primary20: 'rgba(217, 180, 180, 0.2)',
      primary30: 'rgba(217, 180, 180, 0.3)',
    },
    mustard: {
      primary: '#E6C17A',
      primaryDark: '#5C4A2B',
      accent: '#C79E50',
      bg: '#FAF8F2',
      border: '#EBE2CD',
      border30: 'rgba(235, 226, 205, 0.3)',
      border50: 'rgba(235, 226, 205, 0.5)',
      border60: 'rgba(235, 226, 205, 0.6)',
      primary20: 'rgba(230, 193, 122, 0.2)',
      primary30: 'rgba(230, 193, 122, 0.3)',
    },
    green: {
      primary: '#A8BC98',
      primaryDark: '#3E4C34',
      accent: '#839E6F',
      bg: '#F6F8F3',
      border: '#DFE5D9',
      border30: 'rgba(223, 229, 217, 0.3)',
      border50: 'rgba(223, 229, 217, 0.5)',
      border60: 'rgba(223, 229, 217, 0.6)',
      primary20: 'rgba(168, 188, 152, 0.2)',
      primary30: 'rgba(168, 188, 152, 0.3)',
    },
    teal: {
      primary: '#9CBEC2',
      primaryDark: '#324C4F',
      accent: '#75A2A7',
      bg: '#F3F7F8',
      border: '#D8E5E7',
      border30: 'rgba(216, 229, 231, 0.3)',
      border50: 'rgba(216, 229, 231, 0.5)',
      border60: 'rgba(216, 229, 231, 0.6)',
      primary20: 'rgba(156, 190, 194, 0.2)',
      primary30: 'rgba(156, 190, 194, 0.3)',
    }
  }), []);

  const activeTheme = useMemo(() => {
    return THEME_COLORS[themeColor as keyof typeof THEME_COLORS] || THEME_COLORS.rose;
  }, [themeColor, THEME_COLORS]);

  // Loading timeout
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setLoading(false);
    }, 1800);

    return () => {
      clearTimeout(loadTimer);
    };
  }, []);

  // Add to cart animation trigger
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    setCartItemsCount((prev) => prev + 1);
    setCartBouncing(true);
    setTimeout(() => setCartBouncing(false), 800);

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const cartIcon = document.getElementById('header-cart-icon') || document.getElementById('mobile-cart-icon');
    if (!cartIcon) return;
    const cartRect = cartIcon.getBoundingClientRect();
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    const particle = document.createElement('div');
    particle.className = 'fixed pointer-events-none z-[9999] flex items-center justify-center';
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    particle.innerHTML = `
      <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs animate-spin" style="background-color: ${activeTheme.primary}; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        🧶
      </div>
    `;

    document.body.appendChild(particle);

    const keyframes = [
      { left: `${startX}px`, top: `${startY}px`, transform: 'scale(1) rotate(0deg)' },
      { left: `${(startX + endX) / 2}px`, top: `${Math.min(startY, endY) - 100}px`, transform: 'scale(1.3) rotate(180deg)' },
      { left: `${endX}px`, top: `${endY}px`, transform: 'scale(0.2) rotate(360deg)' }
    ];

    const animation = particle.animate(keyframes, {
      duration: 750,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    animation.onfinish = () => {
      particle.remove();
    };
  };

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

      {/* Dynamic Style Overrides for instant skinning */}
      <style>{`
        :root {
          --primary-color: ${activeTheme.primary};
          --primary-dark: ${activeTheme.primaryDark};
          --accent-color: ${activeTheme.accent};
          --bg-color: ${activeTheme.bg};
          --border-color: ${activeTheme.border};
        }
        .bg-\\[\\#D9B4B4\\] { background-color: var(--primary-color) !important; }
        .text-\\[\\#6B5656\\] { color: var(--primary-dark) !important; }
        .bg-\\[\\#6B5656\\] { background-color: var(--primary-dark) !important; }
        .text-\\[\\#D9B4B4\\] { color: var(--primary-color) !important; }
        .border-\\[\\#EADBDB\\] { border-color: var(--border-color) !important; }
        .border-\\[\\#EADBDB\\]\\/30 { border-color: ${activeTheme.border30} !important; }
        .border-\\[\\#EADBDB\\]\\/50 { border-color: ${activeTheme.border50} !important; }
        .border-\\[\\#EADBDB\\]\\/60 { border-color: ${activeTheme.border60} !important; }
        .border-\\[\\#D9B4B4\\]\\/20 { border-color: ${activeTheme.primary20} !important; }
        .border-\\[\\#D9B4B4\\]\\/30 { border-color: ${activeTheme.primary30} !important; }
        @keyframes wiggleEar {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        @keyframes wavePaw {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-25deg); }
        }
      `}</style>

      {/* 0. Fullscreen Knitted Preloader */}
      {loading && (
        <div
          className="fixed inset-0 z-[10000] bg-crochet-charcoal flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out"
          style={{ opacity: loading ? 1 : 0 }}
        >
          <div className="relative flex flex-col items-center">
            <div className="w-24 h-24 relative text-[#D9B4B4] animate-bounce duration-[2000ms]">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full fill-none stroke-current"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Ears */}
                <path d="M 40 42 C 37 28, 28 12, 33 8 C 38 4, 45 18, 43 38" />
                <path d="M 45 39 C 47 24, 53 8, 57 10 C 61 12, 55 28, 51 41" />
                {/* Head & Face */}
                <path d="M 36 48 C 28 48, 26 56, 32 62 C 36 66, 46 66, 50 62 C 56 56, 54 48, 48 48" />
                {/* Eyes */}
                <circle cx="37" cy="53" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="45" cy="53" r="1.5" fill="currentColor" stroke="none" />
                {/* Nose/Mouth */}
                <path d="M 41 57 L 41.5 58 L 42 57" />
                <path d="M 39 60 C 40.5 61.5, 41.5 60.5, 41.5 60 C 41.5 60.5, 42.5 61.5, 44 60" />
                {/* Body */}
                <path d="M 38 64 C 30 68, 25 78, 28 88 C 30 90, 40 90, 45 90" />
                {/* Waving left arm */}
                <path
                  d="M 32 66 C 24 62, 18 50, 22 46 C 26 42, 28 54, 32 60"
                  className="origin-[32px_66px] animate-[wavePaw_1.6s_infinite_ease-in-out]"
                />
                {/* Resting right arm */}
                <path d="M 44 66 C 48 68, 52 74, 50 78 C 48 82, 44 76, 42 70" />
                {/* Paws */}
                <path d="M 36 90 Q 38 84 40 90" />
                <path d="M 44 90 Q 46 84 48 90" />
                <path d="M 52 90 Q 54 84 56 90" />
                {/* Back & Tail */}
                <path d="M 48 64 C 56 68, 66 74, 66 84 C 66 88, 62 90, 53 90" />
                <path d="M 66 82 C 70 82, 72 86, 68 88 C 66 89, 65 85, 66 82" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-widest text-[#FEF9F6] mt-4 uppercase animate-pulse">
              Crochet Creation
            </span>
            <span className="text-[10px] tracking-widest text-[#D9B4B4] uppercase mt-1">
              Knitting with love...
            </span>
          </div>
        </div>
      )}

      {/* 0. Texture Reveal Magnifying Modal */}
      {selectedTexture && (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedTexture(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-lg w-full relative shadow-2xl border border-stone-100 flex flex-col items-center text-center cursor-default animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-50 transition-colors"
              onClick={() => setSelectedTexture(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold text-[#D9B4B4] uppercase tracking-widest mb-1">Texture Magnifier</span>
            <h4 className="text-lg font-black text-[#6B5656] mb-4">Detailed Stitch Pattern</h4>

            {/* The Lens Container */}
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-[#D9B4B4] shadow-inner bg-stone-50 group">
              <Image
                src={selectedTexture}
                alt="Zoomed knit texture"
                fill
                sizes="256px"
                className="object-cover"
              />
              {/* Realistic glass lens reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none"></div>
              <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/25 blur-sm pointer-events-none"></div>
            </div>

            <p className="text-xs text-stone-500 max-w-sm mt-6 leading-relaxed">
              Every loop and stitch is handmade using premium organic yarns. Click to close.
            </p>
          </div>
        </div>
      )}

      {/* Premium Floating Sticky Navigation Bar */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrollY > 20 ? 'backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-[#FEF9F6]/10 py-3.5' : 'bg-transparent py-6'}`}
        style={{
          backgroundColor: scrollY > 20 ? `${activeTheme.primaryDark}E6` : 'transparent'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <div
            className="flex items-center gap-2.5 group cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D9B4B4]/30 shadow-sm bg-white flex-shrink-0 group-hover:rotate-12 group-hover:scale-105 transition-all duration-300">
              <Image
                src={getImageSrc('logo')}
                alt="Crochet Creation Logo"
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-widest text-[#FEF9F6] font-display">
              Crochet Creation
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase text-[#FEF9F6]">
            <a href="#home" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">HOME</a>
            <span className="relative">
              <a href="#shop" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">SHOP</a>
              <span className="absolute -top-3 -right-6 bg-[#D9B4B4] text-[#6B5656] text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">NEW</span>
            </span>
            <a href="#blog" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">BLOG</a>
            <a href="#pages" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">PAGES</a>
            <a href="#portfolio" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">PORTFOLIO</a>
            <a href="#elements" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">ELEMENTS</a>
          </nav>

          {/* Icons & Utility */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium tracking-wider text-[#FEF9F6]">
            <div
              id="header-cart-icon"
              className={`flex items-center gap-1.5 hover:text-[#D9B4B4] cursor-pointer transition-transform duration-300 ${cartBouncing ? 'scale-110 text-[#D9B4B4]' : ''}`}
            >
              <ShoppingBag className={`w-4 h-4 text-[#D9B4B4] ${cartBouncing ? 'animate-bounce' : ''}`} />
              <span>{cartItemsCount} items</span>
            </div>
            <span className="text-stone-400">|</span>
            <button className="hover:text-[#D9B4B4] transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <span className="text-stone-400">|</span>
            {/* User Profile / Auth Button */}
            {token && userProfile ? (
              <div className="flex items-center gap-2 text-stone-250 transition-colors">
                {userProfile.is_admin && (
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="mr-1 text-[9px] bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white px-2 py-1 rounded font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    Admin
                  </button>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Hi, {userProfile.first_name}</span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="hover:text-[#D9B4B4] transition-colors p-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                  setAuthModalOpen(true);
                }}
                title="Login / Register"
                className="hover:text-[#D9B4B4] transition-colors p-1 flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                <span className="text-[10px] font-bold">LOGIN</span>
              </button>
            )}
            <span className="text-stone-400">|</span>
            {/* Color Palette Customizer */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={() => setThemeColor('rose')}
                title="Rose Pink"
                className={`w-3.5 h-3.5 rounded-full bg-[#D9B4B4] border ${themeColor === 'rose' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} hover:scale-110 transition-transform`}
              />
              <button
                onClick={() => setThemeColor('mustard')}
                title="Mustard Gold"
                className={`w-3.5 h-3.5 rounded-full bg-[#E6C17A] border ${themeColor === 'mustard' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} hover:scale-110 transition-transform`}
              />
              <button
                onClick={() => setThemeColor('green')}
                title="Forest Green"
                className={`w-3.5 h-3.5 rounded-full bg-[#A8BC98] border ${themeColor === 'green' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} hover:scale-110 transition-transform`}
              />
              <button
                onClick={() => setThemeColor('teal')}
                title="Calm Teal"
                className={`w-3.5 h-3.5 rounded-full bg-[#9CBEC2] border ${themeColor === 'teal' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} hover:scale-110 transition-transform`}
              />
            </div>
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
          <div
            className="lg:hidden absolute top-full left-0 w-full border-b border-[#FEF9F6]/10 py-6 px-6 z-30 flex flex-col gap-4 text-sm font-semibold tracking-widest uppercase text-center shadow-2xl backdrop-blur-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300"
            style={{
              backgroundColor: `${activeTheme.primaryDark}F2`
            }}
          >
            <a href="#home" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] transition-colors text-[#FEF9F6]">HOME</a>
            <a href="#shop" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] transition-colors text-[#FEF9F6]">SHOP</a>
            <a href="#blog" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] transition-colors text-[#FEF9F6]">BLOG</a>
            <a href="#pages" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] transition-colors text-[#FEF9F6]">PAGES</a>
            <a href="#portfolio" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] transition-colors text-[#FEF9F6]">PORTFOLIO</a>
            <a href="#elements" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] transition-colors text-[#FEF9F6]">ELEMENTS</a>
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#FEF9F6]/10 text-[#FEF9F6]">
              <div
                id="mobile-cart-icon"
                className={`flex items-center gap-1.5 transition-transform duration-300 ${cartBouncing ? 'scale-110 text-[#D9B4B4]' : ''}`}
              >
                <ShoppingBag className={`w-4 h-4 text-[#D9B4B4] ${cartBouncing ? 'animate-bounce' : ''}`} />
                <span>{cartItemsCount} items</span>
              </div>
              <span>|</span>
              <Search className="w-4 h-4" />
              <span>|</span>
              {token && userProfile ? (
                <div className="flex items-center gap-2 text-stone-250 transition-colors">
                  {userProfile.is_admin && (
                    <button
                      onClick={() => {
                        router.push('/admin/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="mr-1 text-[9px] bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white px-2 py-1 rounded font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      Admin
                    </button>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Hi, {userProfile.first_name}</span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    title="Logout"
                    className="hover:text-[#D9B4B4] transition-colors p-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                    setAuthModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  title="Login / Register"
                  className="hover:text-[#D9B4B4] transition-colors p-1 flex items-center gap-1"
                >
                  <User className="w-4 h-4" />
                  <span className="text-[10px] font-bold">LOGIN</span>
                </button>
              )}
            </div>
            {/* Mobile Color Palette Customizer */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-[#FEF9F6]/10 text-[#FEF9F6]">
              <span className="text-[10px] text-stone-300 tracking-wider">THEME:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setThemeColor('rose')}
                  className={`w-4 h-4 rounded-full bg-[#D9B4B4] border ${themeColor === 'rose' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} transition-transform`}
                />
                <button
                  onClick={() => setThemeColor('mustard')}
                  className={`w-4 h-4 rounded-full bg-[#E6C17A] border ${themeColor === 'mustard' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} transition-transform`}
                />
                <button
                  onClick={() => setThemeColor('green')}
                  className={`w-4 h-4 rounded-full bg-[#A8BC98] border ${themeColor === 'green' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} transition-transform`}
                />
                <button
                  onClick={() => setThemeColor('teal')}
                  className={`w-4 h-4 rounded-full bg-[#9CBEC2] border ${themeColor === 'teal' ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} transition-transform`}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 1. Header/Hero Panel (Dark Textured #6B5656) */}
      <section id="home" className="relative lg:sticky lg:top-0 z-0 bg-crochet-charcoal text-[#FEF9F6] pt-24 pb-20 overflow-hidden h-[90vh] min-h-[700px] w-full flex flex-col justify-between scroll-mt-28">

        {/* Parallax inner wrapper */}
        <div
          className="w-full flex-grow flex flex-col justify-between relative"
          style={{ transform: `translate3d(0, ${scrollY * 0.3}px, 0)` }}
        >

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
              onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-[#D9B4B4] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-[#D9B4B4] text-xs uppercase tracking-widest font-bold px-8 py-3.5 rounded-full transition-all duration-300 active:scale-95 shadow-lg"
            >
              View all products
            </button>

            {/* Heart shaped yarn ball */}
            <div className="mt-12 md:mt-16 w-56 h-56 md:w-64 md:h-64 relative">
              <Image
                src={getImageSrc('heroYarn')}
                alt="Marilyn Heart Yarn"
                fill
                sizes="(max-width: 768px) 224px, 256px"
                className="object-contain rounded-full shadow-2xl border-4 border-[#D9B4B4]/20 animate-pulse duration-[3000ms]"
                priority
              />

              {/* Cute Animated Outline Rabbit */}
              <div
                className="absolute -bottom-6 -right-10 md:-right-14 w-20 h-20 md:w-24 md:h-24 z-30 drop-shadow-md transition-transform duration-300 ease-out"
                style={{
                  transform: `translate(${Math.sin(scrollY * 0.006) * 35}px, ${Math.cos(scrollY * 0.006) * 15 - 5}px) rotate(${Math.sin(scrollY * 0.004) * 12}deg)`
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-[#D9B4B4] fill-none stroke-current"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Left Ear wiggling dynamically based on scroll */}
                  <path
                    d="M 40 42 C 37 28, 28 12, 33 8 C 38 4, 45 18, 43 38"
                    className="origin-[40px_42px]"
                    style={{
                      transform: `rotate(${Math.sin(scrollY * 0.015) * 10}deg)`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  />
                  {/* Right Ear wiggling dynamically based on scroll */}
                  <path
                    d="M 45 39 C 47 24, 53 8, 57 10 C 61 12, 55 28, 51 41"
                    className="origin-[45px_39px]"
                    style={{
                      transform: `rotate(${Math.cos(scrollY * 0.015) * 10}deg)`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  />
                  {/* Head & Face */}
                  <path d="M 36 48 C 28 48, 26 56, 32 62 C 36 66, 46 66, 50 62 C 56 56, 54 48, 48 48" />
                  {/* Cheeks */}
                  <path d="M 31 56 C 30 56, 29 57, 29 58" strokeWidth="1.5" className="animate-pulse" />
                  <path d="M 51 56 C 52 56, 53 57, 53 58" strokeWidth="1.5" className="animate-pulse" />
                  {/* Eyes */}
                  <circle cx="37" cy="53" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="45" cy="53" r="1.5" fill="currentColor" stroke="none" />
                  {/* Nose/Mouth */}
                  <path d="M 41 57 L 41.5 58 L 42 57" />
                  <path d="M 39 60 C 40.5 61.5, 41.5 60.5, 41.5 60 C 41.5 60.5, 42.5 61.5, 44 60" />
                  {/* Body */}
                  <path d="M 38 64 C 30 68, 25 78, 28 88 C 30 90, 40 90, 45 90" />
                  {/* Waving left arm */}
                  <path
                    d="M 32 66 C 24 62, 18 50, 22 46 C 26 42, 28 54, 32 60"
                    className="origin-[32px_66px] animate-[wavePaw_1.6s_infinite_ease-in-out]"
                  />
                  {/* Resting right arm */}
                  <path d="M 44 66 C 48 68, 52 74, 50 78 C 48 82, 44 76, 42 70" />
                  {/* Paws */}
                  <path d="M 36 90 Q 38 84 40 90" />
                  <path d="M 44 90 Q 46 84 48 90" />
                  <path d="M 52 90 Q 54 84 56 90" />
                  {/* Back & Tail */}
                  <path d="M 48 64 C 56 68, 66 74, 66 84 C 66 88, 62 90, 53 90" />
                  <path d="M 66 82 C 70 82, 72 86, 68 88 C 66 89, 65 85, 66 82" />
                </svg>
              </div>
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

                {/* Tiny outline rabbit riding the stitching hook */}
                <g
                  style={{
                    transform: `translate(12px, -18px) rotate(${Math.sin(scrollY * 0.02) * 12}deg)`,
                    transformOrigin: '0px 0px',
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    width="20"
                    height="20"
                    className="text-[#6B5656] fill-none stroke-current overflow-visible"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Ears */}
                    <path d="M 40 42 C 37 28, 28 12, 33 8 C 38 4, 45 18, 43 38" />
                    <path d="M 45 39 C 47 24, 53 8, 57 10 C 61 12, 55 28, 51 41" />
                    {/* Head & Face */}
                    <path d="M 36 48 C 28 48, 26 56, 32 62 C 36 66, 46 66, 50 62 C 56 56, 54 48, 48 48" />
                    {/* Eyes */}
                    <circle cx="37" cy="53" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="45" cy="53" r="1.5" fill="currentColor" stroke="none" />
                    {/* Body */}
                    <path d="M 38 64 C 30 68, 25 78, 28 88 C 30 90, 40 90, 45 90" />
                    {/* Waving left arm */}
                    <path
                      d="M 32 66 C 24 62, 18 50, 22 46 C 26 42, 28 54, 32 60"
                      className="origin-[32px_66px] animate-[wavePaw_1.6s_infinite_ease-in-out]"
                    />
                    {/* Resting right arm */}
                    <path d="M 44 66 C 48 68, 52 74, 50 78 C 48 82, 44 76, 42 70" />
                    <path d="M 48 64 C 56 68, 66 74, 66 84 C 66 88, 62 90, 53 90" />
                    {/* Tail */}
                    <circle cx="66" cy="84" r="3" fill="#6B5656" stroke="none" />
                  </svg>
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
        <section id="elements" className="py-20 md:py-28 pl-14 pr-6 md:px-12 bg-[#FEF9F6] border-b border-[#EADBDB]/50 scroll-mt-28">
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
        <section id="shop" className="py-20 pl-14 pr-6 md:px-12 max-w-7xl mx-auto w-full scroll-mt-28">

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
                  className={`text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1 rounded ${activeFilter === filter
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
            {displayProducts.length > 0 ? (
              displayProducts.map((product) => (
                <div key={product._id || product.id} className="bg-white border border-[#EADBDB] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="h-64 bg-amber-50/20 relative overflow-hidden group cursor-pointer" onClick={() => setSelectedTexture(getImageSrc('knitTexture'))}>
                    <Image
                      src={product.image_url || getImageSrc('craftingTools')}
                      alt={product.title || product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-[#D9B4B4] text-[#6B5656] text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm z-10">
                      {product.badge || 'HANDMADE'}
                    </span>
                    <div className="absolute inset-0 bg-[#6B5656]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                      <div className="bg-white/95 backdrop-blur-sm text-[#6B5656] text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-[#D9B4B4]" />
                        View Texture
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-between border-t border-[#EADBDB]/50">
                    <div>
                      <span className="text-[9px] font-bold text-[#D9B4B4] uppercase tracking-widest">{product.category}</span>
                      <h4 className="text-base font-bold text-[#6B5656] mt-1 mb-2">{product.title || product.name}</h4>
                      <p className="text-xs text-stone-500 leading-relaxed">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-50">
                      <span className="text-lg font-black text-[#6B5656]">${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
                      <button
                        onClick={handleAddToCart}
                        className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white p-2.5 rounded-full transition-colors active:scale-95 shadow"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white border border-dashed border-[#EADBDB] rounded-2xl text-center">
                <Scissors className="w-8 h-8 text-[#D9B4B4] mb-3 animate-bounce" />
                <h4 className="text-base font-bold text-[#6B5656] mb-1">No products found in this category</h4>
                <p className="text-xs text-stone-500">Add products using the backend API to see them here.</p>
              </div>
            )}
          </div>
        </section>

        {/* 4. "Do It Yourself" (DIY) Section */}
        <section id="blog" className="py-12 bg-stone-100/30 border-y border-[#EADBDB]/30 scroll-mt-28">
          <div className="max-w-7xl mx-auto pl-14 pr-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left Column Block */}
            <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-[#EADBDB] shadow-sm">
              {/* Top: Crafting Tools Image */}
              <div className="h-56 relative">
                <Image
                  src={getImageSrc('craftingTools')}
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
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200/50">Crochet Creation WORKSHOP</span>
              </div>
            </div>

            {/* Right Column Block */}
            <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-[#EADBDB] shadow-sm relative group min-h-[500px]">
              {/* Main Photo of Woman Knitting */}
              <Image
                src={getImageSrc('womanKnitting')}
                alt="Marilyn Knitting"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              {/* Hover Dark Text Overlay at Bottom */}
              <div className="absolute bottom-0 left-0 w-full bg-crochet-charcoal/95 text-[#FEF9F6] p-6 border-t border-[#D9B4B4]/20 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[8px] font-black tracking-wider uppercase text-[#D9B4B4]">LEARN FROM Crochet Creation</span>
                  <p className="text-xs text-stone-300">Discover masterclasses for all experience levels.</p>
                </div>
                <a href="#pages" className="text-xs font-black uppercase tracking-widest text-[#D9B4B4] hover:text-[#FEF9F6] flex items-center gap-1 transition-colors">
                  SEE MORE <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* 5. "Crochet and Hand Knitting" Section */}
        <section id="pages" className="py-24 pl-14 pr-6 md:px-12 max-w-7xl mx-auto w-full scroll-mt-28">
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
                  src={getImageSrc('stackedSweaters')}
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
                    <span className="w-6 h-0.5 bg-[#D9B4B4]"></span> Hi, Welcome to Crochet Creation
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
        <section id="portfolio" className="relative py-24 overflow-hidden text-center scroll-mt-28">
          {/* Full Knit Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src={getImageSrc('knitTexture')}
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
                    src={getImageSrc('customerAlice')}
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
                    src={getImageSrc('logo')}
                    alt="Crochet Creation Logo"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <span className="text-xl font-bold tracking-widest text-[#FEF9F6]">
                  Crochet Creation
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
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
              </div>

              {/* Yarn Ball and Needles */}
              <div className="flex items-center gap-4 relative">
                <div className="w-24 h-24 relative rounded-full overflow-hidden border border-[#D9B4B4]/20 shadow-md">
                  <Image
                    src={getImageSrc('heroYarn')}
                    alt="Marilyn Footer Yarn"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <span className="text-[10px] font-black tracking-widest text-[#D9B4B4] uppercase">Crochet Creation HANDMADE</span>
              </div>

            </div>
          </div>

          {/* Footer legal bar */}
          <div className="max-w-7xl mx-auto pl-14 pr-6 md:px-12 border-t border-[#FEF9F6]/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider gap-4">
            <span>© 2026 Crochet Creation Studio. All Rights Reserved.</span>
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
              <p className="text-xs text-stone-500">Provide details and Crochet Creation will contact you directly.</p>
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

      {/* Interactive Login/Registration Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-[#FEF9F6] border border-[#EADBDB] rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-800 p-1 text-sm font-bold"
            >
              ✕
            </button>
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#D9B4B4]/20 flex items-center justify-center mx-auto text-[#D9B4B4]">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#6B5656]">
                {authMode === 'forgot' && 'Forgot Password'}
                {authMode === 'verify' && 'Verify Code'}
                {authMode === 'reset' && 'Reset Password'}
                {(authMode === 'login' || authMode === 'register') && 'Crochet Account'}
              </h3>
              <p className="text-xs text-stone-500">
                {authMode === 'forgot' && 'Enter your email address to request a password reset code.'}
                {authMode === 'verify' && 'Enter the 6-digit OTP code sent to your email.'}
                {authMode === 'reset' && 'Create a new secure password for your account.'}
                {(authMode === 'login' || authMode === 'register') && 'Access your custom orders and exclusive patterns.'}
              </p>
            </div>

            {/* Tab Swapper */}
            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex border-b border-[#EADBDB] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-black tracking-widest uppercase text-center transition-colors ${authMode === 'login' ? 'border-b-2 border-[#6B5656] text-[#6B5656]' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-black tracking-widest uppercase text-center transition-colors ${authMode === 'register' ? 'border-b-2 border-[#6B5656] text-[#6B5656]' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  Register
                </button>
              </div>
            )}

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                ⚠️ {authError}
              </div>
            )}

            {authSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-medium">
                ✨ {authSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'forgot' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                  />
                </div>
              )}

              {authMode === 'verify' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm text-center font-bold tracking-widest focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                  />
                </div>
              )}

              {authMode === 'reset' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                  />
                </div>
              )}

              {(authMode === 'login' || authMode === 'register') && (
                <>
                  {authMode === 'register' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">First Name</label>
                          <input
                            type="text"
                            name="first_name"
                            required
                            value={authFormData.first_name}
                            onChange={handleAuthChange}
                            placeholder="John"
                            className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Last Name</label>
                          <input
                            type="text"
                            name="last_name"
                            required
                            value={authFormData.last_name}
                            onChange={handleAuthChange}
                            placeholder="Doe"
                            className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mobile Number</label>
                        <input
                          type="tel"
                          name="mobile"
                          required
                          value={authFormData.mobile}
                          onChange={handleAuthChange}
                          placeholder="+15550000000"
                          className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      {authMode === 'login' ? 'Email or Mobile Number' : 'Email Address'}
                    </label>
                    <input
                      type={authMode === 'login' ? 'text' : 'email'}
                      name="email"
                      required
                      value={authFormData.email}
                      onChange={handleAuthChange}
                      placeholder={authMode === 'login' ? 'name@domain.com or +15550000000' : 'name@domain.com'}
                      className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Password</label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setAuthError(null);
                            setAuthSuccessMsg(null);
                          }}
                          className="text-[#6B5656] hover:text-[#D9B4B4] text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      value={authFormData.password}
                      onChange={handleAuthChange}
                      placeholder="••••••••"
                      className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold py-3.5 rounded-xl text-xs tracking-widest uppercase mt-4 transition-all duration-350 active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    {authMode === 'login' && 'Sign In'}
                    {authMode === 'register' && 'Create Account'}
                    {authMode === 'forgot' && 'Send OTP Code'}
                    {authMode === 'verify' && 'Verify Code'}
                    {authMode === 'reset' && 'Reset Password'}
                  </>
                )}
              </button>

              {authMode !== 'login' && authMode !== 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                  className="w-full text-center text-[#6B5656] hover:text-[#D9B4B4] text-[10px] font-bold uppercase tracking-wider pt-2 block transition-colors"
                >
                  ← Back to Login
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
