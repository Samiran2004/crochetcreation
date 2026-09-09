'use client';
import { apiFetch, getApiUrl, clearSession } from '../../utils/apiFetch';
import {
  PAYMENT_METHOD,
  useStoreSettings,
  formatOrderRef,
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
} from '../../utils/checkout';
import { PrepaidNotice, PaymentInstructions } from '../../components/PaymentNotice';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { addToCart } from '../../components/CartDrawer';
import Link from 'next/link';
import AddressMapPicker from '../../components/AddressMapPicker';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import { Reveal, ScrollProgress } from '../../components/motion/Motion';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  LogOut, 
  User, 
  Menu, 
  X, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Sparkles,
  Minus,
  Plus,
  Heart,
  Star,
  ChevronDown,
  Info
} from 'lucide-react';

const API_URL = getApiUrl();

const THEME_STYLES: Record<string, { primary: string; primaryDark: string; accent: string; bgGrad: string; textDark: string }> = {
  rose: {
    primary: '#D9B4B4',
    primaryDark: '#6B5656',
    accent: '#FEF9F6',
    bgGrad: 'from-teal to-bodytext',
    textDark: '#4A3E3E'
  },
  mustard: {
    primary: '#E6C17A',
    primaryDark: '#5C4A2E',
    accent: '#FCFAF2',
    bgGrad: 'from-[#5C4A2E] to-[#3B2F1D]',
    textDark: '#3B2F1D'
  },
  green: {
    primary: '#A8BC98',
    primaryDark: '#3E4D36',
    accent: '#FAFBF9',
    bgGrad: 'from-[#3E4D36] to-[#253020]',
    textDark: '#253020'
  },
  teal: {
    primary: '#9CBEC2',
    primaryDark: '#3A4E52',
    accent: '#F9FCFD',
    bgGrad: 'from-[#3A4E52] to-[#243235]',
    textDark: '#243235'
  }
};


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  // States
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Selector variants
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Accordion states
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [shippingOpen, setShippingOpen] = useState(false);

  // Hover Zoom States & Handler (Preserved custom state)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  // Interactive Magnifier Zoom Style
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transform: 'scale(1)',
    transformOrigin: 'center'
  });

  const [imageAspect, setImageAspect] = useState<number | null>(null);

  // Reset aspect ratio when active image changes
  useEffect(() => {
    setImageAspect(null);
  }, [activeImageUrl]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(2.2)',
      transformOrigin: `${x}% ${y}%`,
      transition: 'transform 0.05s ease-out, transform-origin 0.05s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center',
      transition: 'transform 0.3s ease-out, transform-origin 0.3s ease-out'
    });
  };

  // Cart, Theme & Settings states
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [themeColor, setThemeColor] = useState('rose');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [checkoutFormData, setCheckoutFormData] = useState<{
    name: string;
    email: string;
    mobile: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }>({
    name: '',
    email: '',
    mobile: '',
    address: '',
    latitude: undefined,
    longitude: undefined
  });

  // Held for the post-order screen, which keeps showing what is owed.
  const [placedOrder, setPlacedOrder] = useState<{ ref: string; amount: number }>({
    ref: '',
    amount: 0,
  });
  const storeSettings = useStoreSettings();

  // Auth User profile
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<{
    reviews: any[];
    average_rating: number;
    total_reviews: number;
  }>({
    reviews: [],
    average_rating: 0,
    total_reviews: 0
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const activeTheme = THEME_STYLES[themeColor] || THEME_STYLES.rose;

  const ratingStats = useMemo(() => {
    const total = reviewsData.total_reviews;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.reviews.forEach((r: any) => {
      const rating = Math.min(5, Math.max(1, r.rating));
      counts[rating] = (counts[rating] || 0) + 1;
    });
    
    return [
      { stars: 5, pct: total > 0 ? Math.round((counts[5] / total) * 100) : 0, count: counts[5] },
      { stars: 4, pct: total > 0 ? Math.round((counts[4] / total) * 100) : 0, count: counts[4] },
      { stars: 3, pct: total > 0 ? Math.round((counts[3] / total) * 100) : 0, count: counts[3] },
      { stars: 2, pct: total > 0 ? Math.round((counts[2] / total) * 100) : 0, count: counts[2] },
      { stars: 1, pct: total > 0 ? Math.round((counts[1] / total) * 100) : 0, count: counts[1] }
    ];
  }, [reviewsData]);

  // Load configuration & cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('themeColor');
      if (savedTheme) setThemeColor(savedTheme);

      const syncCartCount = () => {
        const savedCart = localStorage.getItem('crochet_cart_count');
        if (savedCart) {
          setCartItemsCount(parseInt(savedCart, 10));
        } else {
          setCartItemsCount(0);
          localStorage.setItem('crochet_cart_count', '0');
        }
      };
      syncCartCount();
      window.addEventListener('cart-change', syncCartCount);

      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken) setToken(savedToken);
      if (savedUser) {
        try {
          setUserProfile(JSON.parse(savedUser));
        } catch (_) {}
      }

      return () => {
        window.removeEventListener('cart-change', syncCartCount);
      };
    }
  }, []);

  // Fetch updated user profile details to get saved addresses
  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const response = await apiFetch(`${API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, [token]);

  // Pre-fill user details from profile if logged in when checkout modal opens
  useEffect(() => {
    if (checkoutOpen && userProfile) {
      setCheckoutFormData((prev) => ({
        ...prev,
        name: prev.name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        email: prev.email || userProfile.email || '',
        mobile: prev.mobile || userProfile.phone || userProfile.mobile || '',
      }));
    }
  }, [checkoutOpen, userProfile]);

  // Fetch product, related products, and custom settings
  useEffect(() => {
    if (!productId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch main product details
        const res = await apiFetch(`${API_URL}/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct({
            ...data,
            name: data.title || data.name,
            description: data.description || 'No description provided for this product.',
            price: data.price,
            image_url: data.image_url,
            image_urls: data.image_urls || [data.image_url],
            category: data.category || 'HANDMADE'
          });
          setActiveImageUrl(data.image_url);
        } else {
          setProduct(null);
        }

        // 2. Fetch all products to get related items
        const allRes = await apiFetch(`${API_URL}/api/products?limit=100`);
        if (allRes.ok) {
          const allData = await allRes.json();
          const items = Array.isArray(allData) ? allData : (allData.items || []);
          // Filter out current product
          const filtered = items.filter((p: any) => (p._id || p.id) !== productId);
          setRelatedProducts(filtered);
        }

        // 3. Fetch custom homepage images/logo
        const settingsRes = await apiFetch(`${API_URL}/api/settings/homepage-images`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const resolved: Record<string, string> = {};
          for (const key in settingsData) {
            if (settingsData[key] && settingsData[key].url) {
              resolved[key] = settingsData[key].url;
            }
          }
          setCustomImages(resolved);
        }

        // 4. Fetch product reviews
        try {
          const revRes = await apiFetch(`${API_URL}/api/reviews/product/${productId}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviewsData(revData);
          }
        } catch (revErr) {
          console.error("Error fetching reviews:", revErr);
        } finally {
          setReviewsLoading(false);
        }

      } catch (err) {
        console.error("Error fetching product details:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  // Synchronize theme changes
  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem('themeColor', color);
  };

  const handleLogout = () => {
    setToken(null);
    setUserProfile(null);
    setCartItemsCount(0);
    clearSession();
    showToast('Logged out successfully.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // The sticky bar appears only once the inline actions leave the viewport.
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    // Read the position on scroll rather than via IntersectionObserver: the
    // observer only reports at the crossing instant, where the element's top is
    // ~0, so a "has it gone past?" test there never latches.
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = actionsRef.current;
      if (!el) { setShowStickyBar(false); return; }
      setShowStickyBar(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!token && !userProfile) {
      showToast("Please log in to add items to your cart.");
      setTimeout(() => {
        router.push('/?login=true&redirect=' + encodeURIComponent(`/product/${productId}`));
      }, 1200);
      return;
    }
    addToCart({
      id: product._id || product.id,
      name: product.title || product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      image_url: product.image_url || (product.images && product.images[0]) || '',
      category: product.category || 'General',
      size: (product.category?.toUpperCase() === 'GARMENTS' && product.has_sizes) ? selectedSize : undefined
    }, quantity);
    setCartBouncing(true);
    setTimeout(() => setCartBouncing(false), 800);
    showToast(`Added ${quantity} × ${product.title || product.name} to cart! 🧶`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!token && !userProfile) {
      showToast("Please log in to purchase.");
      setTimeout(() => {
        router.push('/?login=true&redirect=' + encodeURIComponent(`/product/${productId}`));
      }, 1200);
      return;
    }
    setCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutFormData.name || !checkoutFormData.email || !checkoutFormData.mobile || !checkoutFormData.address) {
      alert('Please fill in all checkout fields.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const productName = product?.title || product?.name || 'Handcrafted Product';
      const productPrice = product?.price || 0;
      const categoryName = product?.category || 'General';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const hasSize = product.category?.toUpperCase() === 'GARMENTS' && product.has_sizes;

      const savedToken = localStorage.getItem('token') || token;
      if (!savedToken) {
        throw new Error('Please sign in again to place this order.');
      }

      const orderData = {
        customer_name: checkoutFormData.name,
        customer_email: checkoutFormData.email,
        customer_mobile: checkoutFormData.mobile,
        items: [
          {
            product_id: product?._id || productId || '',
            title: productName,
            price: productPrice,
            quantity: quantity,
            size: hasSize ? selectedSize : undefined
          }
        ],
        payment_method: PAYMENT_METHOD,
        shipping_address: checkoutFormData.address,
        latitude: checkoutFormData.latitude,
        longitude: checkoutFormData.longitude
      };

      const orderResponse = await apiFetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json().catch(() => ({}));
        throw new Error(
          typeof errData.detail === 'string'
            ? errData.detail
            : "We couldn't place your order. Please try again."
        );
      }

      const orderResult = await orderResponse.json();
      const displayOrderId = formatOrderRef(orderResult.id || orderResult._id || '');
      // The server re-prices the order; that total is what the buyer owes.
      const payableTotal = Number(orderResult.total_amount ?? productPrice * quantity);

      const message = buildWhatsAppOrderMessage({
        items: [{
          id: product?._id || productId,
          name: productName,
          price: productPrice,
          quantity,
          category: categoryName,
          size: hasSize ? selectedSize : undefined,
        }],
        subtotal: payableTotal,
        customer: {
          name: checkoutFormData.name,
          email: checkoutFormData.email,
          mobile: checkoutFormData.mobile,
          address: checkoutFormData.address,
        },
        orderRef: displayOrderId,
        upiId: storeSettings.upiId,
        origin,
      });

      const url = buildWhatsAppUrl(message);

      setPlacedOrder({ ref: displayOrderId, amount: payableTotal });
      setWhatsappUrl(url);
      setCheckoutSuccess(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Failed to place order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-card flex flex-col items-center justify-center p-6 text-bodytext">
        <div className="w-16 h-16 border-4 border-line border-t-terracotta rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-widest uppercase animate-pulse">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-parchment-card flex flex-col items-center justify-center p-6 text-bodytext">
        <X className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <Link href="/" className="text-xs font-bold uppercase tracking-wider text-teal underline">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-card text-bodytext font-sans selection:bg-terracotta/25">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[999] bg-white border-l-4 border-teal shadow-2xl p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-parchment-card flex items-center justify-center text-sm shadow-inner">
            🧶
          </div>
          <div>
            <p className="text-xs font-bold text-teal uppercase tracking-wider">Shopping Basket</p>
            <p className="text-xs text-bodytext mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Floating Header - Exact Match to Landing Page Header */}
      {/* Shared storybook navigation, so every page carries one header. */}
      <Navbar alwaysOpaque />
      <ScrollProgress />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        
        {/* Breadcrumbs & Back Navigation */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/shop" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-teal hover:text-terracotta-ink transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> BACK TO SHOP
          </Link>
          <div className="text-[10px] tracking-widest uppercase text-muted flex items-center gap-1 font-bold">
            <Link href="/" className="hover:underline">Home</Link> <ChevronRight className="w-3 h-3" /> 
            <Link href="/shop" className="hover:underline">Shop</Link> <ChevronRight className="w-3 h-3 text-line" /> 
            <span className="text-teal font-bold">{product.name}</span>
          </div>
        </div>

        {/* 50/50 - 60/40 Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Main Image Gallery (Framer Motion Transitions + thumbnails overlay) */}
          <div className="lg:col-span-7 flex flex-col w-full pb-8">
            
            {/* Mobile edge-to-edge swipeable carousel (< md) */}
            <div className="md:hidden w-full relative mb-6">
              <div 
                className="w-full relative flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-[380px] rounded-2xl border border-line/65 bg-parchment-card shadow-[0_4px_15px_rgba(0,0,0,0.05)] scrollbar-none"
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const index = Math.round(container.scrollLeft / container.clientWidth);
                  if (product.image_urls && product.image_urls[index]) {
                    setActiveImageUrl(product.image_urls[index]);
                  }
                }}
              >
                {product.image_urls?.map((url: string, index: number) => (
                  <div id={`mobile-slide-${index}`} key={index} className="relative w-full h-full shrink-0 snap-center">
                    <Image 
                      src={url} 
                      alt={`${product.name} slide ${index + 1}`} 
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {/* Mobile pagination dots */}
              {product.image_urls && product.image_urls.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {product.image_urls.map((url: string, index: number) => {
                    const isActive = (activeImageUrl || product.image_url) === url;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveImageUrl(url);
                          const el = document.getElementById(`mobile-slide-${index}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          isActive ? 'bg-teal w-4' : 'bg-line'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Image Gallery (md: and above) */}
            <div className="hidden md:block relative w-full mb-10 overflow-visible group/gallery flex justify-center">
              
              {/* Main Image container with interactive zoom, rounded-2xl, and box shadow */}
              <div 
                className="relative w-full aspect-square md:aspect-auto md:h-[480px] lg:h-[520px] flex items-center justify-center overflow-hidden rounded-2xl border border-line/65 bg-parchment-card shadow-[0_4px_15px_rgba(0,0,0,0.05)] cursor-zoom-in transition-all duration-300"
                style={{
                  aspectRatio: imageAspect ? `${imageAspect}` : undefined,
                  width: imageAspect ? 'auto' : '100%',
                  maxWidth: '100%'
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImageUrl || product.image_url}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full h-full relative overflow-hidden"
                  >
                    <div 
                      className="w-full h-full relative"
                      style={zoomStyle}
                    >
                      <Image 
                        src={activeImageUrl || product.image_url} 
                        alt={product.name} 
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 650px"
                        className="object-contain p-2"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          if (img.naturalWidth && img.naturalHeight) {
                            setImageAspect(img.naturalWidth / img.naturalHeight);
                          }
                        }}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 3-4 small, rounded thumbnail images neatly overlaying the bottom edge */}
              {product.image_urls && product.image_urls.length > 1 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-parchment-card/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-line-soft/70 shadow-md">
                  {product.image_urls.slice(0, 4).map((url: string, index: number) => {
                    const isActive = (activeImageUrl || product.image_url) === url;
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveImageUrl(url)}
                        onMouseEnter={() => setActiveImageUrl(url)}
                        aria-label={`Show product image ${index + 1}`}
                        aria-pressed={isActive}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-200 bg-white shrink-0 ${
                          isActive 
                            ? 'border-teal shadow-sm scale-110' 
                            : 'border-line hover:border-teal/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image 
                          src={url} 
                          alt={`${product.name} thumbnail ${index + 1}`} 
                          fill 
                          sizes="48px"
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Content */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            {/* Header info */}
            <div>
              <span className="inline-block bg-terracotta/15 text-teal text-[9px] font-bold tracking-[0.18em] uppercase px-3 py-1 rounded-full">
                {product.category || 'HANDMADE'}
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 tracking-wide mt-3 leading-tight">
                {product.name}
              </h1>

              {/* Dynamic Star Summary */}
              <div className="flex items-center gap-1.5 mt-2 select-none">
                {reviewsData.total_reviews > 0 ? (
                  <>
                    <div className="flex items-center text-amber-400 gap-0.5">
                      {[1, 2, 3, 4, 5].map((starIndex) => {
                        const isHalf = reviewsData.average_rating - starIndex + 1 > 0 && reviewsData.average_rating - starIndex + 1 < 1;
                        const isFilled = starIndex <= reviewsData.average_rating;
                        return (
                          <Star
                            key={starIndex}
                            className={`w-3.5 h-3.5 ${
                              isFilled 
                                ? 'fill-current text-amber-400' 
                                : isHalf 
                                  ? 'fill-amber-400/50 text-amber-400' 
                                  : 'text-line'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs font-semibold text-bodytext">
                      {reviewsData.average_rating.toFixed(1)} ({reviewsData.total_reviews} {reviewsData.total_reviews === 1 ? 'Review' : 'Reviews'})
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted italic">⭐ No reviews yet</span>
                )}
              </div>
              
              {(() => {
                const originalPrice = product.originalPrice ?? null;
                const sellingPrice = product.sellingPrice ?? product.price ?? null;
                
                if (sellingPrice === null) return null;
                
                const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;
                const discountPercent = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
                
                return (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="font-sans text-[30px] font-extrabold text-ink tabular-nums tracking-[-0.015em]">
                      ₹{sellingPrice.toFixed(2)}
                    </span>
                    {hasDiscount && discountPercent > 0 && (
                      <>
                        <span className="text-sm text-muted line-through">
                          ₹{originalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm font-semibold text-terracotta-ink bg-terracotta/10 px-2.5 py-0.5 rounded-full">
                          ({discountPercent}% OFF)
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Urgency Bar */}
            <div className="bg-parchment border border-line-soft/70 rounded-xl p-3.5 flex items-center gap-3 text-xs text-teal shadow-xs">
              <span className="text-base select-none">📦</span>
              <div className="font-sans">
                <span className="font-bold">Estimated crafting & delivery: </span>
                <span className="text-bodytext">{product.delivery_time || '5-7 working days'}</span>
              </div>
            </div>

            {/* Product Variants (Size & Color selector) */}
            <div className="space-y-4 pt-2 border-t border-line-soft/60">
              {/* Size Selection */}
              {product.category?.toUpperCase() === 'GARMENTS' && product.has_sizes && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Select Size</span>
                    <span className="text-xs font-semibold text-teal">{selectedSize === 'S' ? 'Small' : selectedSize === 'M' ? 'Medium' : 'Large'}</span>
                  </div>
                  <div className="flex gap-2">
                    {['S', 'M', 'L'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`w-9 h-9 rounded-full border text-[11px] font-black transition-all flex items-center justify-center ${
                          selectedSize === sz
                            ? 'border-teal bg-teal text-parchment shadow-xs scale-105'
                            : 'border-line text-bodytext hover:border-muted hover:bg-parchment-deep'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="pt-4 border-t border-line-soft/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Quantity</span>
                <div className="flex items-center border border-line rounded-lg overflow-hidden bg-white shadow-xs">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={product.in_stock === false}
                    aria-label="Decrease quantity"
                    className="p-1.5 hover:bg-parchment-deep text-muted active:scale-90 transition-transform disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 text-xs font-bold text-teal min-w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                    disabled={product.in_stock === false}
                    aria-label="Increase quantity"
                    className="p-1.5 hover:bg-parchment-deep text-muted active:scale-90 transition-transform disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main buttons */}
              <div ref={actionsRef} className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.in_stock === false}
                  className="flex-1 btn-pill btn-teal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" /> {product.in_stock === false ? 'Out of Stock' : 'Add to Basket'}
                </button>
                
                <button
                  onClick={() => {
                    setIsWishlisted(!isWishlisted);
                    showToast(isWishlisted ? "Removed from Wishlist" : "Added to Wishlist 💖");
                  }}
                  className="w-12 h-12 flex items-center justify-center border border-line rounded-xl hover:bg-parchment-deep active:scale-95 transition-all text-teal shrink-0"
                  title="Add to Wishlist"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-bodytext'}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={product.in_stock === false}
                className="w-full bg-white hover:bg-parchment-deep text-teal border border-teal disabled:bg-line disabled:text-muted disabled:border-line disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl transition-all active:scale-98 shadow-xs flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                Buy It Now
              </button>
            </div>

            {/* Accordions System */}
            <div className="border-t border-line pt-6 space-y-4">
              
              {/* Accordion 1: Description & Details */}
              <div className="border-b border-line-soft/60 pb-4">
                <button
                  type="button"
                  onClick={() => setDescriptionOpen(!descriptionOpen)}
                  className="w-full flex items-center justify-between text-left font-serif text-sm font-semibold text-gray-900 py-2 focus:outline-none"
                >
                  <span>Description & Details</span>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${descriptionOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: descriptionOpen ? 'auto' : 0, opacity: descriptionOpen ? 1 : 0 }}
                  className="overflow-hidden"
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="pt-2 text-bodytext text-xs leading-relaxed space-y-3 font-sans">
                    <p>{product.description}</p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li><span className="font-bold text-bodytext">Yarn Type:</span> {product.materials || '100% Premium Combed Cotton'}</li>
                      <li><span className="font-bold text-bodytext">Care Instructions:</span> {product.care_instructions || 'Handwash gently, dry flat'}</li>
                      <li><span className="font-bold text-bodytext">Dimensions:</span> {product.size || 'Customisable'}</li>
                      <li><span className="font-bold text-bodytext">Crafting Technique:</span> Hand-stitched with love</li>
                    </ul>
                  </div>
                </motion.div>
              </div>

              {/* Accordion 2: Shipping Info */}
              <div className="border-b border-line-soft/60 pb-4">
                <button
                  type="button"
                  onClick={() => setShippingOpen(!shippingOpen)}
                  className="w-full flex items-center justify-between text-left font-serif text-sm font-semibold text-gray-900 py-2 focus:outline-none"
                >
                  <span>Shipping Info</span>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${shippingOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: shippingOpen ? 'auto' : 0, opacity: shippingOpen ? 1 : 0 }}
                  className="overflow-hidden"
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2.5 p-2 bg-parchment border border-line-soft/50 rounded-xl">
                      <Truck className="w-4 h-4 text-terracotta shrink-0" />
                      <div className="text-[9px] leading-tight">
                        <p className="font-bold text-bodytext">Free Delivery</p>
                        <p className="text-muted">On orders over ₹499</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-parchment border border-line-soft/50 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-terracotta shrink-0" />
                      <div className="text-[9px] leading-tight">
                        <p className="font-bold text-bodytext">Secure Checkout</p>
                        <p className="text-muted">100% encrypted ssl</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-parchment border border-line-soft/50 rounded-xl col-span-2">
                      <Sparkles className="w-4 h-4 text-terracotta shrink-0" />
                      <div className="text-[9px] leading-tight">
                        <p className="font-bold text-bodytext">Crafted to Order</p>
                        <p className="text-muted">Individually stitched</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>

          </div>
        </div>

        {/* Middle Section: Ratings & Reviews */}
        <section className="mt-20 border-t border-line pt-16">
          <h3 className="font-serif text-2xl font-bold text-gray-900 mb-8 tracking-wide">
            Customer Reviews & Ratings
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Rating Summary Left Side (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-line/70 rounded-3xl p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-4">
                <span className="font-serif text-5xl font-black text-gray-900">
                  {reviewsData.average_rating.toFixed(1)}
                </span>
                <div>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isHalf = reviewsData.average_rating - s + 1 > 0 && reviewsData.average_rating - s + 1 < 1;
                      const isFilled = s <= reviewsData.average_rating;
                      return (
                        <Star 
                          key={s} 
                          className={`w-5 h-5 ${
                            isFilled 
                              ? 'fill-current text-amber-400' 
                              : isHalf 
                                ? 'fill-amber-400/50 text-amber-400' 
                                : 'text-line'
                          }`} 
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted mt-1 uppercase tracking-wider font-bold">
                    Based on {reviewsData.total_reviews} {reviewsData.total_reviews === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>

              {/* Star breakdown bar chart */}
              <div className="space-y-2.5">
                {ratingStats.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3 text-xs">
                    <span className="w-10 text-muted font-bold flex items-center gap-1 select-none">
                      {row.stars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 bg-line-soft h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted font-black">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Reviews List Right Side (8 cols) */}
            <div className="lg:col-span-8 w-full">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white border border-line-soft/60 rounded-2xl p-6 shadow-xs space-y-4 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-line" />
                          <div className="space-y-2">
                            <div className="h-3.5 bg-line rounded w-28" />
                            <div className="h-2 bg-line rounded w-16" />
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="w-3.5 h-3.5 bg-line rounded-full" />
                          ))}
                        </div>
                      </div>
                      <div className="h-4 bg-stone-150 rounded w-full" />
                      <div className="h-4 bg-stone-150 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : reviewsData.total_reviews === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-line-soft/60 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-parchment flex items-center justify-center text-xl shadow-inner select-none">
                    🧶
                  </div>
                  <p className="text-sm font-semibold text-bodytext">No reviews yet</p>
                  <p className="text-xs text-muted max-w-sm leading-relaxed">
                    Be the first to review this handcrafted item after purchase!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviewsData.reviews.map((rev: any) => (
                    <div 
                      key={rev._id || rev.id} 
                      className="bg-white border border-line-soft/60 rounded-2xl p-6 shadow-xs flex flex-col gap-4 transition-all hover:shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-terracotta/15 border border-terracotta/30 flex items-center justify-center font-bold text-xs text-teal select-none">
                            {rev.user_name ? rev.user_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-gray-900">{rev.user_name}</h4>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full select-none">
                                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified Buyer
                              </span>
                            </div>
                            <span className="text-[10px] text-muted font-medium">
                              {new Date(rev.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-400 gap-0.5 select-none">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'text-line'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm md:text-base font-sans">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Section: You Might Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-28 border-t border-line pt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-2xl font-bold text-gray-900 tracking-wide">You Might Also Like</h3>
              <span className="text-xs font-bold text-terracotta-ink uppercase tracking-[0.18em]">Handcrafted with passion</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((item) => {
                const itemId = item._id || item.id;
                return (
                  <Link
                    key={itemId}
                    href={`/product/${itemId}`}
                    className="flex flex-col h-full bg-white border border-line-soft/50 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="relative aspect-square w-full bg-parchment-deep overflow-hidden">
                      <Image 
                        src={item.image_url} 
                        alt={item.title || item.name} 
                        fill
                        sizes="(max-width: 768px) 50vw, 250px" 
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500" 
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-terracotta-ink uppercase tracking-[0.16em] block">{item.category}</span>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-teal transition-colors line-clamp-1">{item.title || item.name}</h4>
                        <div className="flex items-center gap-1 text-[8px] font-semibold text-muted mt-1">
                          <span>🚚</span>
                          <span>{item.delivery_time || '5-7 working days'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-line-soft gap-1.5">
                        {(() => {
                          const originalPrice = item.originalPrice ?? null;
                          const sellingPrice = item.sellingPrice ?? item.price ?? null;
                          
                          if (sellingPrice === null) return null;
                          
                          const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;
                          const discountPercent = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
                          
                          return (
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-baseline gap-1 flex-wrap">
                                <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                                  ₹{typeof sellingPrice === 'number' ? sellingPrice.toFixed(2) : parseFloat(sellingPrice).toFixed(2)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-muted line-through whitespace-nowrap">
                                    ₹{typeof originalPrice === 'number' ? originalPrice.toFixed(2) : parseFloat(originalPrice).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {hasDiscount && discountPercent > 0 && (
                                <span className="text-[8px] font-bold text-terracotta-ink bg-terracotta/10 px-1.5 py-0.5 rounded-md mt-0.5 self-start whitespace-nowrap">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        <span className="text-[9px] font-bold text-terracotta-ink uppercase tracking-[0.16em] flex items-center gap-0.5 shrink-0">
                          DETAILS ➔
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Sticky buy bar — phones only.
          On a small screen the price and the buy action scroll far out of
          reach; keeping them pinned is the single biggest usability win on a
          product page. It slides in once the inline buttons have scrolled past. */}
      <div
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-parchment-card/95 backdrop-blur-md border-t border-line shadow-[0_-8px_30px_-12px_rgba(90,74,48,0.28)]
          px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">Total</span>
            <span className="font-sans text-[19px] font-extrabold text-ink tabular-nums leading-tight">
              ₹{(((product?.sellingPrice ?? product?.price) || 0) * quantity).toFixed(0)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            aria-label="Add to basket"
            className="w-12 h-12 shrink-0 rounded-full border border-line flex items-center justify-center text-ink active:scale-95 transition-transform"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
          <button
            onClick={handleBuyNow}
            className="btn-pill btn-teal flex-1 max-w-[190px]"
          >
            Buy it now
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-line flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-line flex items-center justify-between" style={{ backgroundColor: activeTheme.primaryDark }}>
              <div className="text-white">
                <h3 className="text-base font-bold tracking-[0.18em] uppercase">ORDER CHECKOUT</h3>
                <p className="text-[10px] text-line mt-0.5">Prepaid by UPI · pay after placing the order</p>
              </div>
              <button 
                onClick={() => { setCheckoutOpen(false); setCheckoutSuccess(false); }}
                aria-label="Close checkout"
                className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div data-lenis-prevent className="p-6 overflow-y-auto flex-grow">
              {checkoutSuccess ? (
                <PaymentInstructions
                  amount={placedOrder.amount}
                  upiId={storeSettings.upiId}
                  orderRef={placedOrder.ref}
                  whatsappUrl={whatsappUrl}
                  onClose={() => { setCheckoutOpen(false); setCheckoutSuccess(false); router.push('/dashboard'); }}
                  closeLabel="View my orders"
                />
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  
                  {/* Order Summary box */}
                  <div className="p-4 bg-parchment-deep border border-line rounded-2xl">
                    <span className="text-[9px] font-black text-terracotta-ink uppercase tracking-[0.16em] block mb-2">Order Summary</span>
                    <div className="flex justify-between items-center text-xs font-bold text-teal">
                      <span>{product.name} ({quantity}x)</span>
                      <span>₹{((product.price || 0) * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted mt-1 border-t border-line/50 pt-2">
                      <span>Shipping Method</span>
                      <span className="text-emerald-600 font-bold uppercase tracking-wider">Free Delivery</span>
                    </div>
                  </div>

                  {/* Customer details fields */}
                  <div>
                    <label htmlFor="product-checkout-name" className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      id="product-checkout-name"
                        autoComplete="name"
                        placeholder="e.g. John Doe"
                      value={checkoutFormData.name}
                      onChange={(e) => setCheckoutFormData({ ...checkoutFormData, name: e.target.value })}
                      className="w-full bg-parchment border border-line rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-teal focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-checkout-email" className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        id="product-checkout-email"
                        autoComplete="email"
                        placeholder="john@example.com"
                        value={checkoutFormData.email}
                        onChange={(e) => setCheckoutFormData({ ...checkoutFormData, email: e.target.value })}
                        className="w-full bg-parchment border border-line rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-teal focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="product-checkout-mobile" className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        id="product-checkout-mobile"
                        autoComplete="tel"
                        placeholder="10-digit number"
                        value={checkoutFormData.mobile}
                        onChange={(e) => setCheckoutFormData({ ...checkoutFormData, mobile: e.target.value })}
                        className="w-full bg-parchment border border-line rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-teal focus:outline-none"
                      />
                    </div>
                  </div>

                  {userProfile?.addresses && userProfile.addresses.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1">Select Saved Address</label>
                      <select
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (!selectedId) return;
                          const addr = (userProfile.addresses as any[]).find((a: any) => a.id === selectedId);
                          if (addr) {
                            const combinedAddress = `${addr.street_address}, ${addr.city}, ${addr.state} - ${addr.postal_code}`;
                            setCheckoutFormData((prev) => ({
                              ...prev,
                              name: addr.full_name || prev.name,
                              mobile: addr.phone || prev.mobile,
                              address: combinedAddress,
                              latitude: addr.latitude || undefined,
                              longitude: addr.longitude || undefined
                            }));
                          }
                        }}
                        className="w-full bg-parchment border border-line rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-teal focus:outline-none text-teal font-medium"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Choose from your saved addresses --</option>
                        {userProfile.addresses.map((addr: any) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.full_name} ({addr.phone}) - {addr.street_address}, {addr.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1.5">Shipping Address</label>
                    <AddressMapPicker
                      onAddressSelect={(addr) => {
                        const combinedAddress = `${addr.street_address}, ${addr.city}, ${addr.state} - ${addr.postal_code}`;
                        setCheckoutFormData((prev) => ({
                          ...prev,
                          address: combinedAddress,
                          latitude: addr.latitude,
                          longitude: addr.longitude
                        }));
                      }}
                      initialAddress={{
                        street_address: checkoutFormData.address ? checkoutFormData.address.split(',')[0] || '' : '',
                        city: checkoutFormData.address ? checkoutFormData.address.split(',')[1]?.trim() || '' : '',
                        state: checkoutFormData.address ? checkoutFormData.address.split(',')[2]?.split('-')[0]?.trim() || '' : '',
                        postal_code: checkoutFormData.address ? checkoutFormData.address.split('-')[1]?.trim() || '' : '',
                        latitude: checkoutFormData.latitude,
                        longitude: checkoutFormData.longitude
                      }}
                    />
                  </div>

                  <PrepaidNotice
                    amount={(product?.price || 0) * quantity}
                    upiId={storeSettings.upiId}
                  />

                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full bg-teal hover:bg-terracotta hover:text-teal text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 text-xs uppercase tracking-widest mt-6 shadow"
                  >
                    {checkoutLoading ? 'Processing Placement...' : `Place Custom Order - ₹${((product.price || 0) * quantity).toFixed(2)}`}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer - Identical to Landing Page Footer */}
      <Footer />

    </div>
  );
}
