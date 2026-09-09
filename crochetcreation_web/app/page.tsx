'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronRight,
  Gift,
  Heart,
  Instagram,
  Mail,
  Package,
  PlayCircle,
  Quote,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  User,
  Wand2,
  X,
} from 'lucide-react';

import { apiFetch, getApiUrl, clearSession } from './utils/apiFetch';
import { addToCart } from './components/CartDrawer';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OrganicEdge from './components/ui/OrganicEdge';
import SectionHeading from './components/ui/SectionHeading';
import { Reveal, Parallax, ParallaxImage, ScrollProgress, Magnetic } from './components/motion/Motion';
import {
  Bird,
  CornerCluster,
  CrochetHook,
  Flower,
  KnitHeart,
  LeafPair,
  Mushroom,
  Spool,
  Sprig,
  YarnBall,
} from './components/decor/Botanicals';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

/* Local image assets — copied directly into public/assets/ */
const IMAGES = {
  heroYarn: '/assets/marilyn_hero_yarn.png',
  craftingTools: '/assets/marilyn_crafting_tools.png',
  stackedSweaters: '/assets/marilyn_stacked_sweaters.png',
  womanKnitting: '/assets/marilyn_woman_knitting.png',
  knitTexture: '/assets/marilyn_knit_texture.png',
  customerAlice: '/assets/marilyn_customer_alice.png',
  logo: '/assets/crochet_creation_logo.png',
};

/* What we make — the four ways to work with the studio. */
const SERVICES = [
  {
    icon: Package,
    title: 'Ready-Made Pieces',
    body: 'Finished keychains, hair clips and charms, packed and posted.',
  },
  {
    icon: Wand2,
    title: 'Custom Orders',
    body: 'Your colours, your size, your idea — crocheted to your brief.',
  },
  {
    icon: Gift,
    title: 'Gifts & Hampers',
    body: 'Wrapped bundles for birthdays, bridesmaids and little ones.',
  },
  {
    icon: PlayCircle,
    title: 'Tutorials & Videos',
    body: 'Watch how each piece comes together, stitch by stitch.',
  },
];

/* How an order actually travels through the studio. */
const PROCESS = [
  { n: 1, icon: Mail, title: 'Tell Us', body: 'Share your idea, colours and the date you need it by.' },
  { n: 2, icon: Sparkles, title: 'We Sketch', body: 'We map the pattern and pick the yarn together.' },
  { n: 3, icon: Wand2, title: 'Hook & Stitch', body: 'Every round is worked by hand — no machines.' },
  { n: 4, icon: Heart, title: 'Finish & Check', body: 'Stuffed, shaped and inspected before it leaves.' },
  { n: 5, icon: Package, title: 'Wrapped & Sent', body: 'Gift-wrapped and posted with a handwritten note.' },
];

const TESTIMONIALS = [
  {
    quote: 'The jellyfish keychain is even cuter in person. The stitching is so neat and it survived a whole term in my school bag.',
    name: 'Ananya R.',
    role: 'Kolkata',
  },
  {
    quote: 'Ordered matching flower clips for my sister and me. They matched the photos exactly and arrived beautifully wrapped.',
    name: 'Priya S.',
    role: 'Repeat customer',
  },
  {
    quote: 'I asked for a custom colour and got updates the whole way through. It felt like someone really cared about the order.',
    name: 'Meghna D.',
    role: 'Custom order',
  },
];

export default function CrochetCreationPage() {
  const API_URL = useMemo(() => getApiUrl(), []);
  const router = useRouter();

  /* ── Catalogue ─────────────────────────────────────────────── */
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  /* ── Session ───────────────────────────────────────────────── */
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  /* ── Profile completion ────────────────────────────────────── */
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [mobilePromptValue, setMobilePromptValue] = useState('');
  const [mobilePromptLoading, setMobilePromptLoading] = useState(false);

  /* ── Custom request + policies ─────────────────────────────── */
  const [customRequestModal, setCustomRequestModal] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', details: '' });
  const [policyModal, setPolicyModal] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getImageSrc = (key: keyof typeof IMAGES) => customImages[key] || IMAGES[key];

  /* ── Homepage imagery from admin settings ──────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/settings/homepage-images`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const resolved: Record<string, string> = {};
        for (const key in data) if (data[key]?.url) resolved[key] = data[key].url;
        setCustomImages(resolved);
      } catch {
        /* fall back to the bundled assets */
      }
    })();
    return () => { cancelled = true; };
  }, [API_URL]);

  /* ── Cart badge ────────────────────────────────────────────── */
  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem('crochet_cart_count');
      setCartItemsCount(saved ? parseInt(saved, 10) || 0 : 0);
    };
    sync();
    window.addEventListener('cart-change', sync);
    return () => window.removeEventListener('cart-change', sync);
  }, []);

  /* ── Restore session ───────────────────────────────────────── */
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserProfile(parsed);
        if (savedToken && parsed.is_admin) {
          router.push('/admin/dashboard');
        } else if (savedToken) {
          checkMobilePrompt(parsed);
        }
      } catch {
        /* a corrupt cache is not fatal */
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'true') {
      setAuthError(null);
      setAuthModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* Open the auth sheet when any page asks for it. The acknowledgement lets
     the cart drawer know the request was handled here, so it does not also
     navigate away. */
  useEffect(() => {
    const open = () => {
      setAuthError(null);
      setAuthModalOpen(true);
      window.dispatchEvent(new Event('auth-modal-opened'));
    };
    window.addEventListener('open-auth-modal', open);
    return () => window.removeEventListener('open-auth-modal', open);
  }, []);

  const checkMobilePrompt = (userObj: any) => {
    if (!userObj?.is_admin && (!userObj?.mobile || userObj.mobile.trim() === '')) {
      if (!sessionStorage.getItem('mobilePromptDismissed')) setShowMobilePrompt(true);
    }
  };

  /* ── Categories drive the filter chips ─────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/products/categories`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setCategories(data);
        setActiveFilter((cur) => (cur && data.includes(cur) ? cur : data[0]));
      } catch {
        /* the grid still renders its own error state */
      }
    })();
    return () => { cancelled = true; };
  }, [API_URL]);

  const fetchProducts = useCallback(async () => {
    if (!activeFilter) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await apiFetch(
        `${API_URL}/api/products?limit=8&category=${encodeURIComponent(activeFilter)}`
      );
      if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
      const data = await res.json();
      setProductsList(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProductsError("We couldn't load the catalogue just now.");
    } finally {
      setProductsLoading(false);
    }
  }, [API_URL, activeFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Auth ──────────────────────────────────────────────────── */
  const handleLogout = () => {
    setToken(null);
    setUserProfile(null);
    setCartItemsCount(0);
    clearSession();
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      setAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await apiFetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_id_token: idToken }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Google sign in failed on server.');
      }

      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

      const userObj = {
        ...data.user,
        picture: data.user?.picture || result.user.photoURL,
        email: data.user?.email || result.user.email,
        first_name: data.user?.first_name || result.user.displayName?.split(' ')[0] || 'User',
        is_admin: data.user?.is_admin || false,
      };
      setUserProfile(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));

      setAuthModalOpen(false);
      window.dispatchEvent(new Event('session-change'));
      showToast('Signed in — welcome back!');

      if (userObj.is_admin) {
        router.push('/admin/dashboard');
      } else {
        checkMobilePrompt(userObj);
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
        if (redirectUrl) router.push(redirectUrl);
      }
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || 'Google sign in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMobilePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setMobilePromptLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobilePromptValue }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to update mobile number');
      }
      const data = await res.json();
      setUserProfile(data);
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        mobile: data.mobile,
        is_admin: data.is_admin,
        picture: data.picture,
      }));
      setShowMobilePrompt(false);
      showToast('Mobile number saved.');
    } catch (err: any) {
      showToast(err.message || 'Something went wrong.');
    } finally {
      setMobilePromptLoading(false);
    }
  };

  /* ── Basket ────────────────────────────────────────────────── */
  const requireSignIn = () => {
    showToast('Please sign in to continue.');
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const cartPayload = (product: any) => ({
    id: product._id || product.id,
    name: product.title || product.name,
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0,
    image_url: product.image_url || (product.images && product.images[0]) || '',
    category: product.category || 'General',
  });

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token && !userProfile) return requireSignIn();
    // addToCart opens the basket drawer itself, which is the confirmation —
    // a toast on top of it would be duplicate feedback.
    addToCart(cartPayload(product), 1);
  };

  const handleBuyNow = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token && !userProfile) return requireSignIn();
    addToCart(cartPayload(product), 1);
    window.dispatchEvent(new Event('open-cart'));
  };

  /* ── Custom request ────────────────────────────────────────── */
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg =
      `🧶 *Custom Order Enquiry — Crochet Creation*\n\n` +
      `*Name:* ${formData.name}\n*Email:* ${formData.email}\n\n*What I'd love:*\n${formData.details}`;
    window.open(`https://wa.me/917551041853?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    setRequestSubmitted(true);
    setTimeout(() => {
      setCustomRequestModal(false);
      setRequestSubmitted(false);
      setFormData({ name: '', email: '', details: '' });
    }, 2200);
  };

  const priceOf = (p: any) => {
    const selling = p.sellingPrice ?? p.price ?? null;
    const original = p.originalPrice ?? null;
    const hasDiscount = original !== null && selling !== null && original > selling;
    return {
      selling,
      original,
      hasDiscount,
      percent: hasDiscount ? Math.round(((original - selling) / original) * 100) : 0,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-hidden">
      <Navbar />
      <ScrollProgress />

      {/* ═══════════════ 1 · HERO ═══════════════ */}
      <section id="home" className="relative bg-paper pt-24 md:pt-32 pb-4 overflow-hidden">
        <Parallax speed={-34} className="absolute inset-x-0 top-0 pointer-events-none">
          <CornerCluster side="left" className="w-40 sm:w-56 lg:w-72 opacity-90" />
          <CornerCluster side="right" className="w-40 sm:w-56 lg:w-72 opacity-90" />
        </Parallax>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-6 md:pt-10">
            {/* Copy */}
            <Reveal from="up" duration={0.85} className="lg:col-span-6 xl:col-span-6 text-center lg:text-left order-2 lg:order-1">
              <span className="eyebrow inline-flex items-center gap-2 justify-center lg:justify-start">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Handmade in small batches
              </span>

              <h1 className="mt-4 font-display text-ink leading-[1.05] tracking-[-0.02em]
                text-[36px] sm:text-[46px] md:text-[56px] lg:text-[58px] xl:text-[66px]">
                Every stitch tells
                <br className="hidden sm:block" />
                {' '}a <span className="text-terracotta italic">little story</span>.
              </h1>

              <p className="mt-5 text-[15px] md:text-base leading-relaxed text-bodytext max-w-lg mx-auto lg:mx-0">
                We&apos;re Crochet Creation — a tiny studio hooking cosy keychains, hair
                clips and charms by hand. Pick a finished piece, or tell us your idea
                and we&apos;ll make it just for you.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                <Magnetic>
                  <Link href="/shop" className="btn-pill btn-teal group/cta">
                    Explore our work
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true" />
                  </Link>
                </Magnetic>
                <button onClick={() => setCustomRequestModal(true)} className="btn-pill btn-outline">
                  Request a custom piece
                </button>
              </div>

              <div className="mt-9 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="flex" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="text-[12px] font-semibold text-bodytext">Loved by our customers</span>
                </div>
                <span className="hidden sm:block w-px h-8 bg-line" aria-hidden="true" />
                <span className="hidden sm:block text-[12px] font-semibold text-bodytext">
                  Made to order in 5–7 days
                </span>
              </div>
            </Reveal>

            {/* Hero image in an organic frame */}
            <div className="lg:col-span-6 xl:col-span-6 order-1 lg:order-2 relative">
              <Parallax speed={26} className="relative mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[460px]">
                <span
                  className="absolute -inset-3 md:-inset-5 bg-parchment-deep rounded-[46%_54%_58%_42%/48%_42%_58%_52%] rotate-3"
                  aria-hidden="true"
                />
                <span
                  className="absolute -inset-1 md:-inset-2 border-2 border-dashed border-terracotta/25 rounded-[52%_48%_42%_58%/44%_56%_44%_56%] -rotate-2"
                  aria-hidden="true"
                />
                <ParallaxImage
                  amount={6}
                  className="relative aspect-square rounded-[48%_52%_54%_46%/46%_48%_52%_54%] shadow-lift ring-1 ring-line/60"
                >
                  <Image
                    src={getImageSrc('heroYarn')}
                    alt="A handmade crochet heart resting in an embroidery hoop"
                    fill
                    priority
                    sizes="(max-width: 640px) 300px, (max-width: 1024px) 380px, 460px"
                    className="object-cover"
                  />
                </ParallaxImage>

                <YarnBall className="absolute -left-6 bottom-6 w-14 md:w-20 h-auto text-olive animate-float-soft" />
                <CrochetHook className="absolute -right-4 top-8 w-12 md:w-16 h-auto text-terracotta animate-sway" />
                <Bird className="absolute -top-6 left-10 w-14 md:w-16 h-auto text-teal/70 hidden sm:block" />
              </Parallax>
            </div>
          </div>
        </div>
      </section>

      <OrganicEdge variant="torn" from="var(--parchment)" fill="var(--parchment-deep)" height={80} />

      {/* ═══════════════ 2 · ABOUT + SERVICES ═══════════════ */}
      <section id="about" className="bg-paper-deep pt-10 md:pt-16 pb-12 md:pb-16 relative overflow-hidden">
        <Sprig className="absolute top-8 right-4 w-44 h-auto text-olive/20 hidden lg:block" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Portrait + intro */}
            <Reveal from="left" className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-start gap-7">
              <div className="relative shrink-0 mx-auto sm:mx-0">
                <span
                  className="absolute -inset-2.5 rounded-full border-2 border-dashed border-olive/30"
                  aria-hidden="true"
                />
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-4 ring-parchment-card shadow-soft">
                  <Image
                    src={getImageSrc('womanKnitting')}
                    alt="Working on a crochet piece in the studio"
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                </div>
                <Flower className="absolute -bottom-2 -left-3 w-11 h-auto text-terracotta/70" />
                <LeafPair className="absolute -top-2 -right-2 w-9 h-auto text-olive/70" />
              </div>

              <div className="text-center sm:text-left lg:text-left">
                <span className="eyebrow">Hello there</span>
                <h2 className="mt-2.5 font-display text-[26px] sm:text-[32px] text-ink leading-tight">
                  We&apos;re Crochet Creation
                </h2>
                <p className="mt-3.5 text-[14px] leading-relaxed text-bodytext max-w-md">
                  What began as a love for yarn and a single hook has grown into a little
                  studio full of colour. We believe slow, careful making shows — in the
                  neatness of a round, the softness of a finished charm, and the smile
                  when someone opens the parcel.
                </p>
                <Magnetic className="inline-block mt-6">
                  <button
                    onClick={() => setCustomRequestModal(true)}
                    className="btn-pill btn-terracotta"
                  >
                    Work with us
                  </button>
                </Magnetic>
              </div>
            </Reveal>

            {/* Teal services panel */}
            <Reveal from="right" delay={0.08} className="lg:col-span-7">
              <div className="bg-teal-weave rounded-[28px] md:rounded-[40px] p-8 sm:p-10 md:p-14 shadow-panel relative overflow-hidden">
                <Sprig className="absolute -top-2 -right-6 w-40 h-auto text-ondark/10" />

                <SectionHeading tone="ondark" as="h2" size="panel" className="mb-8 md:mb-10">
                  Ways We Can Create Together
                </SectionHeading>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-7 sm:gap-8">
                  {SERVICES.map(({ icon: Icon, title, body }, i) => (
                    <Reveal
                      key={title}
                      delay={0.12 + i * 0.08}
                      className="flex flex-col items-center text-center gap-3 group/svc"
                    >
                      <span className="badge-round w-16 h-16 sm:w-[72px] sm:h-[72px] !bg-parchment-card shadow-soft transition-transform duration-500 group-hover/svc:-translate-y-2 group-hover/svc:rotate-6">
                        <Icon className="w-7 h-7 text-teal" aria-hidden="true" />
                      </span>
                      <h3 className="heading-sm text-[14px] sm:text-[15px] !text-ondark leading-snug">
                        {title}
                      </h3>
                      <p className="text-[12.5px] sm:text-[13.5px] leading-[1.65] text-ondark-muted/90">
                        {body}
                      </p>
                    </Reveal>
                  ))}
                </div>

                <div className="mt-9 flex justify-center">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ondark hover:text-white transition-colors"
                  >
                    View all products
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <OrganicEdge variant="wave" from="var(--parchment-deep)" fill="var(--parchment)" height={70} />

      {/* ═══════════════ 3 · SELECTED WORKS ═══════════════ */}
      <section id="shop" className="bg-paper pt-12 md:pt-20 pb-16 md:pb-24 relative overflow-hidden scroll-mt-24">
        <Mushroom className="absolute left-3 top-24 w-12 h-auto text-terracotta/25 hidden xl:block" />
        <KnitHeart className="absolute right-4 top-16 w-14 h-auto text-blush/40 hidden xl:block" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <Reveal>
            <SectionHeading
              eyebrow="Made by hand"
              lede="Each piece is crocheted to order, so tiny variations are part of the charm."
            >
              Our Handmade Creations
            </SectionHeading>
          </Reveal>

          {/* Filter chips */}
          <div className="mt-10 md:mt-12 flex justify-start sm:justify-center overflow-x-auto scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-parchment-deep/70 border border-line-soft rounded-full p-1.5">
              {categories.length > 0
                ? categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveFilter(c)}
                      aria-pressed={activeFilter === c}
                      className={`chip ${activeFilter === c ? 'chip-active' : ''}`}
                    >
                      {c}
                    </button>
                  ))
                : Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={`cat-sk-${i}`}
                      className="skeleton h-[38px] w-24 rounded-full"
                      aria-hidden="true"
                    />
                  ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="mt-12 md:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-7">
            {productsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={`sk-${i}`} className="card-soft overflow-hidden">
                    <div className="skeleton aspect-[4/5] w-full" />
                    <div className="p-4 space-y-2.5">
                      <div className="skeleton h-3 w-16 rounded" />
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-8 w-full rounded-lg" />
                    </div>
                  </div>
                ))
              : productsError
              ? (
                <div className="col-span-full card-soft py-14 flex flex-col items-center text-center gap-4">
                  <YarnBall className="w-12 h-auto text-terracotta-ink/70" />
                  <p className="font-display text-lg text-ink">{productsError}</p>
                  <button onClick={fetchProducts} className="btn-pill btn-terracotta">
                    Try again
                  </button>
                </div>
              )
              : productsList.length === 0
              ? (
                <div className="col-span-full card-soft py-14 flex flex-col items-center text-center gap-3">
                  <YarnBall className="w-12 h-auto text-olive/50" />
                  <p className="font-display text-lg text-ink">Nothing in this basket yet</p>
                  <p className="text-sm text-muted">Try another category, or browse the full shop.</p>
                  <Link href="/shop" className="btn-pill btn-outline mt-2">Browse the shop</Link>
                </div>
              )
              : productsList.map((product, i) => {
                  const id = product._id || product.id;
                  const { selling, original, hasDiscount, percent } = priceOf(product);
                  return (
                    <Reveal key={id} delay={(i % 4) * 0.07} className="h-full">
                    <article
                      className="card-soft overflow-hidden group flex flex-col h-full hover:shadow-lift hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      <Link
                        href={`/product/${id}`}
                        className="relative block aspect-[4/5] overflow-hidden bg-parchment-deep"
                      >
                        <Image
                          src={product.image_url || getImageSrc('craftingTools')}
                          alt={product.title || product.name || 'Crochet product'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-[1.08] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                        {hasDiscount && percent > 0 && (
                          <span className="absolute top-3 left-3 bg-terracotta-deep text-[#FFF7EC] text-[9px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-full">
                            {percent}% off
                          </span>
                        )}
                      </Link>

                      <div className="p-5 sm:p-6 flex flex-col flex-1 gap-3">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-olive">
                          {product.category}
                        </span>

                        <h3 className="heading-sm text-[15px] sm:text-[16px] leading-snug line-clamp-2">
                          <Link href={`/product/${id}`} className="hover:text-terracotta-ink transition-colors">
                            {product.title || product.name}
                          </Link>
                        </h3>

                        <div className="flex items-baseline gap-2 mt-auto pt-1.5">
                          {selling !== null && (
                            <span className="font-sans text-[22px] font-extrabold text-ink tabular-nums tracking-[-0.01em]">
                              ₹{Number(selling).toFixed(0)}
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="text-[11px] text-muted line-through tabular-nums">
                              ₹{Number(original).toFixed(0)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            aria-label={`Add ${product.title || product.name} to basket`}
                            className="w-10 h-10 shrink-0 rounded-full border border-line flex items-center justify-center text-ink hover:border-terracotta hover:text-terracotta-ink transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleBuyNow(product, e)}
                            className="btn-pill btn-teal flex-1 !px-4 !py-2.5 !text-[10px]"
                          >
                            Buy now
                          </button>
                        </div>
                      </div>
                    </article>
                    </Reveal>
                  );
                })}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta-ink hover:text-terracotta-deep transition-colors"
            >
              See all creations
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <OrganicEdge variant="torn" from="var(--parchment)" fill="var(--olive)" height={80} />

      {/* ═══════════════ 4 · PROCESS ═══════════════ */}
      <section id="process" className="bg-olive-weave pt-10 md:pt-16 pb-14 md:pb-20 relative overflow-hidden scroll-mt-24">
        <Spool className="absolute left-4 bottom-6 w-16 h-auto text-ondark/15 hidden lg:block" />
        <YarnBall className="absolute right-5 top-8 w-20 h-auto text-ondark/12 hidden lg:block" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-4">
          <Reveal>
            <SectionHeading tone="ondark" eyebrow="From idea to doorstep">
              How Your Piece Is Made
            </SectionHeading>
          </Reveal>

          <div className="mt-14 md:mt-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-12 md:gap-8">
            {PROCESS.map(({ n, icon: Icon, title, body }, i) => (
              <Reveal key={n} delay={i * 0.09} className="relative flex flex-col items-center text-center gap-3 group/step">
                {/* Dashed connector, desktop only */}
                {i < PROCESS.length - 1 && (
                  <span
                    className="hidden lg:block absolute top-11 left-[calc(50%+3.2rem)] right-[calc(-50%+3.2rem)] border-t-2 border-dashed border-ondark/30"
                    aria-hidden="true"
                  />
                )}

                <span className="relative badge-round w-[76px] h-[76px] md:w-[88px] md:h-[88px] !bg-parchment-card z-10 shadow-lift transition-transform duration-500 group-hover/step:-translate-y-2 group-hover/step:scale-105">
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-olive" aria-hidden="true" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-terracotta-deep text-[#FFF7EC] text-[11px] font-black flex items-center justify-center ring-4 ring-olive">
                    {n}
                  </span>
                </span>

                <h3 className="heading-sm text-[15px] md:text-[16px] !text-ondark">{title}</h3>
                <p className="text-[13px] md:text-[14px] leading-[1.65] text-ondark-muted/90 max-w-[200px]">{body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <OrganicEdge variant="wave" from="var(--olive)" fill="var(--parchment)" height={70} />

      {/* ═══════════════ 5 · TESTIMONIALS ═══════════════ */}
      <section className="bg-paper pt-12 md:pt-20 pb-10 md:pb-14 relative overflow-hidden">
        <Bird className="absolute right-6 top-10 w-20 h-auto text-olive/25 hidden lg:block" />
        <LeafPair className="absolute left-6 bottom-10 w-12 h-auto text-terracotta/25 hidden lg:block" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Kind words">What Our Customers Say</SectionHeading>
          </Reveal>

          <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1} className="h-full">
              <figure className="card-soft p-7 md:p-9 flex flex-col gap-5 h-full hover:shadow-lift hover:-translate-y-1.5 transition-all duration-500">
                <Quote className="w-7 h-7 text-terracotta/40 shrink-0" aria-hidden="true" />
                <blockquote className="text-[15px] md:text-[16px] leading-[1.75] text-bodytext flex-1">
                  “{t.quote}”
                </blockquote>
                <span className="block w-12 h-[2px] rounded-full bg-terracotta/35" aria-hidden="true" />
                <figcaption className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-olive/15 text-olive font-display text-base flex items-center justify-center shrink-0">
                    {t.name.charAt(0)}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="heading-sm text-[14px]">{t.name}</span>
                    <span className="text-[11px] text-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6 · LITTLE THINGS ═══════════════ */}
      <section id="custom" className="bg-paper pb-16 md:pb-28 relative scroll-mt-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-7 items-stretch">
            {/* Label block */}
            <Reveal from="left" className="lg:col-span-3 flex flex-col justify-center gap-4 card-soft p-7 !bg-parchment-deep">
              <Flower className="w-11 h-auto text-terracotta/70" />
              <h2 className="font-display text-[24px] md:text-[27px] text-ink leading-tight">
                Little Things
                <br />
                for Your World
              </h2>
              <p className="text-[13px] leading-relaxed text-bodytext">
                Small handmade pieces that make an ordinary day feel a bit softer.
              </p>
              <Magnetic className="self-start mt-1">
                <Link href="/shop" className="btn-pill btn-terracotta">
                  Visit the shop
                </Link>
              </Magnetic>
            </Reveal>

            {/* Teasers */}
            {[
              {
                img: getImageSrc('stackedSweaters'),
                eyebrow: 'New in the shop',
                title: 'Fresh Off the Hook',
                body: 'The latest keychains, clips and charms, ready to post today.',
                cta: 'Shop now',
                href: '/shop',
              },
              {
                img: getImageSrc('craftingTools'),
                eyebrow: 'In the studio',
                title: 'Watch It Come Together',
                body: 'Short videos of the hooks, yarn and rounds behind each piece.',
                cta: 'Watch videos',
                href: '/videos',
              },
              {
                img: getImageSrc('knitTexture'),
                eyebrow: 'Made for you',
                title: 'Your Idea, Our Hook',
                body: 'Tell us the colours and the occasion — we crochet the rest.',
                cta: 'Start a request',
                href: '#',
                onClick: () => setCustomRequestModal(true),
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={0.08 + i * 0.09} className="lg:col-span-3">
              <article className="card-soft overflow-hidden flex flex-col group h-full hover:shadow-lift hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                <div className="relative aspect-[16/10] overflow-hidden bg-parchment-deep">
                  <Image
                    src={c.img}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    className="object-cover group-hover:scale-[1.08] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  />
                </div>
                <div className="p-5 sm:p-6 flex flex-col gap-2.5 flex-1">
                  <span className="eyebrow !text-olive">{c.eyebrow}</span>
                  <h3 className="heading-sm text-[16px] leading-snug">{c.title}</h3>
                  <p className="text-[13px] leading-relaxed text-bodytext flex-1">{c.body}</p>
                  {c.onClick ? (
                    <button
                      onClick={c.onClick}
                      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-terracotta-ink hover:text-terracotta-deep transition-colors self-start mt-1"
                    >
                      {c.cta}
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    <Link
                      href={c.href}
                      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-terracotta-ink hover:text-terracotta-deep transition-colors self-start mt-1"
                    >
                      {c.cta}
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <OrganicEdge variant="torn" from="var(--parchment)" fill="var(--terracotta-deep)" height={72} />

      {/* ═══════════════ 7 · CTA BAND ═══════════════ */}
      <section className="bg-terracotta-weave pt-12 md:pt-20 pb-10 md:pb-14 relative overflow-hidden">
        {/* Quiet marks, kept off the text columns. */}
        <Sprig className="absolute -left-8 bottom-0 w-56 h-auto opacity-[0.13] hidden xl:block" color="#FFF7EC" />
        <YarnBall className="absolute right-8 bottom-2 w-24 h-auto opacity-[0.12] hidden xl:block" color="#FFF7EC" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Pitch */}
            <Reveal from="left" className="lg:col-span-6 text-center lg:text-left">
              <span className="eyebrow !text-[#FFF7EC]/75">Custom orders</span>
              <h2 className="mt-3 font-display text-[32px] sm:text-[42px] md:text-[52px] text-[#FFF7EC] leading-[1.05] tracking-[-0.022em]">
                Let&apos;s Make Something Together
              </h2>
              <p className="mt-4 text-[15px] md:text-[16px] leading-[1.7] text-[#FFF7EC]/85 max-w-[44ch] mx-auto lg:mx-0">
                Have a colour, a character or an occasion in mind? Tell us about it —
                we&apos;d love to hook it for you.
              </p>
              <Magnetic className="inline-block mt-8">
                <button
                  onClick={() => setCustomRequestModal(true)}
                  className="btn-pill btn-cream group/cta2 !px-9 !py-4"
                >
                  Start your custom order
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/cta2:translate-x-1" aria-hidden="true" />
                </button>
              </Magnetic>
            </Reveal>

            {/* Contact panel — a full card rather than a floating chip row, so
                the right column carries the same weight as the headline. */}
            <Reveal from="right" delay={0.1} className="lg:col-span-6">
              <div className="card-soft overflow-hidden">
                <div className="p-6 sm:p-8 flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="badge-round w-11 h-11 !bg-parchment-deep shrink-0">
                      <KnitHeart className="w-6 h-auto text-terracotta-ink" />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <h3 className="heading-sm text-[17px]">
                        Talk to us directly
                      </h3>
                      <span className="text-[12px] text-muted">Usually replies within a few hours</span>
                    </div>
                  </div>

                  <div className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
                    {[
                      { icon: Mail, label: 'WhatsApp', value: '+91 75510 41853',
                        href: 'https://wa.me/917551041853', external: true },
                      { icon: Instagram, label: 'Instagram', value: '@crochet__creation__',
                        href: 'https://www.instagram.com/crochet__creation__/', external: true },
                      { icon: PlayCircle, label: 'Watch', value: 'Behind the scenes',
                        href: '/videos', external: false },
                    ].map(({ icon: Icon, label, value, href, external }) => {
                      const inner = (
                        <>
                          <span className="w-9 h-9 rounded-full bg-parchment-deep flex items-center justify-center shrink-0 group-hover/row:bg-terracotta/12 transition-colors">
                            <Icon className="w-4 h-4 text-terracotta-ink" aria-hidden="true" />
                          </span>
                          <span className="flex flex-col leading-tight min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{label}</span>
                            <span className="text-[14px] font-semibold text-ink truncate">{value}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted shrink-0 transition-transform duration-300 group-hover/row:translate-x-1" aria-hidden="true" />
                        </>
                      );
                      const cls = 'group/row flex items-center gap-3.5 py-3.5 transition-colors';
                      return external ? (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                      ) : (
                        <Link key={label} href={href} className={cls}>{inner}</Link>
                      );
                    })}
                  </div>

                  <p className="flex items-start gap-2 text-[12px] text-muted leading-relaxed">
                    <ShieldCheck className="w-3.5 h-3.5 text-olive shrink-0 mt-0.5" aria-hidden="true" />
                    Orders are prepaid by UPI and confirmed once we verify your payment
                    screenshot on WhatsApp.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The footer brings its own hill edge, so the terracotta band flows
          straight into it without a dead strip between. */}
      <Footer />

      {/* ═══════════════ OVERLAYS ═══════════════ */}

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[999]
            card-soft px-5 py-3.5 flex items-center gap-3 max-w-[92vw] sm:max-w-sm shadow-lift"
        >
          <span className="w-8 h-8 rounded-full bg-terracotta/12 flex items-center justify-center text-base shrink-0">
            🧶
          </span>
          <p className="text-[13px] font-medium text-ink">{toastMessage}</p>
        </div>
      )}

      {/* Sign-in */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-deep/55 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            className="card-soft w-full max-w-sm relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAuthModalOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-parchment-deep transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-7 pt-9 pb-7 text-center">
              <span className="w-16 h-16 rounded-full bg-parchment-deep flex items-center justify-center mx-auto">
                <YarnBall className="w-9 h-auto text-olive" />
              </span>
              <h3 id="auth-title" className="mt-4 font-display text-[24px] text-ink">
                Welcome back
              </h3>
              <p className="mt-2 text-[13px] text-bodytext leading-relaxed">
                Sign in to track your orders, save addresses and check out faster.
              </p>

              {authError && (
                <p className="mt-4 text-[12px] text-terracotta-ink bg-terracotta/10 border border-terracotta/20 rounded-xl px-3 py-2.5">
                  {authError}
                </p>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="btn-pill btn-cream w-full mt-6 disabled:opacity-60"
              >
                {authLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-line border-t-terracotta rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>

            <p className="bg-parchment-deep py-3.5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
              Secure sign-in
            </p>
          </div>
        </div>
      )}

      {/* Mobile number prompt */}
      {showMobilePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-deep/55 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="mobile-title" className="card-soft w-full max-w-sm p-7 relative">
            <button
              onClick={() => {
                sessionStorage.setItem('mobilePromptDismissed', '1');
                setShowMobilePrompt(false);
              }}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 id="mobile-title" className="font-display text-[21px] text-ink">
              One last thing
            </h3>
            <p className="mt-2 text-[13px] text-bodytext leading-relaxed">
              Add a mobile number so we can reach you about your orders.
            </p>
            <form onSubmit={handleMobilePromptSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="mobile-prompt" className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted mb-1.5">
                  Mobile number
                </label>
                <input
                  id="mobile-prompt"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={mobilePromptValue}
                  onChange={(e) => setMobilePromptValue(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-parchment border border-line rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-terracotta transition-colors"
                />
              </div>
              <button type="submit" disabled={mobilePromptLoading} className="btn-pill btn-teal w-full disabled:opacity-60">
                {mobilePromptLoading ? 'Saving…' : 'Save number'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom request */}
      {customRequestModal && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-deep/55 backdrop-blur-sm overflow-y-auto"
          onClick={() => setCustomRequestModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-title"
            className="card-soft w-full max-w-md relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCustomRequestModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {requestSubmitted ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <KnitHeart className="w-14 h-auto text-terracotta" />
                <h3 className="font-display text-[22px] text-ink">Off it goes!</h3>
                <p className="text-[13px] text-bodytext">
                  We&apos;ve opened WhatsApp with your idea. We&apos;ll reply shortly.
                </p>
              </div>
            ) : (
              <div className="p-7">
                <span className="eyebrow">Made for you</span>
                <h3 id="custom-title" className="mt-2 font-display text-[23px] text-ink">
                  Request a custom piece
                </h3>
                <p className="mt-2 text-[13px] text-bodytext leading-relaxed">
                  Tell us what you have in mind and we&apos;ll come back with a price and a timeline.
                </p>

                <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="cr-name" className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted mb-1.5">
                      Your name
                    </label>
                    <input
                      id="cr-name" name="name" required autoComplete="name"
                      value={formData.name} onChange={handleFormChange}
                      className="w-full bg-parchment border border-line rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-terracotta transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="cr-email" className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted mb-1.5">
                      Email
                    </label>
                    <input
                      id="cr-email" name="email" type="email" required autoComplete="email"
                      value={formData.email} onChange={handleFormChange}
                      className="w-full bg-parchment border border-line rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-terracotta transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="cr-details" className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted mb-1.5">
                      What would you love?
                    </label>
                    <textarea
                      id="cr-details" name="details" required rows={4}
                      value={formData.details} onChange={handleFormChange}
                      placeholder="Colours, size, the occasion, when you need it…"
                      className="w-full bg-parchment border border-line rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-terracotta transition-colors resize-none"
                    />
                  </div>
                  <button type="submit" className="btn-pill btn-terracotta w-full">
                    Send on WhatsApp
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Policies */}
      {policyModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-deep/55 backdrop-blur-sm"
          onClick={() => setPolicyModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="card-soft w-full max-w-lg max-h-[80vh] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-line-soft shrink-0">
              <h3 className="font-display text-[19px] text-ink capitalize">
                {policyModal === 'privacy' && 'Privacy Policy'}
                {policyModal === 'terms' && 'Terms of Service'}
                {policyModal === 'refund' && 'Refund Policy'}
              </h3>
              <button
                onClick={() => setPolicyModal(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div data-lenis-prevent className="px-7 py-6 overflow-y-auto text-[13px] leading-relaxed text-bodytext space-y-3">
              {policyModal === 'privacy' && (
                <p>
                  We only collect what we need to fulfil your order — your name, contact
                  details and delivery address. We never sell your data, and payment
                  screenshots are used solely to verify your order.
                </p>
              )}
              {policyModal === 'terms' && (
                <p>
                  Every item is crocheted to order. Because each piece is handmade, small
                  variations in size and shade are normal and are part of the character of
                  the work. Orders are confirmed once payment has been verified.
                </p>
              )}
              {policyModal === 'refund' && (
                <p>
                  If a piece arrives damaged or is not what you ordered, message us within
                  48 hours with photos and we&apos;ll remake or refund it. Custom-made items
                  cannot be returned unless they are faulty.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
