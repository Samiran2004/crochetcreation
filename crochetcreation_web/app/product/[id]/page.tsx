'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { addToCart } from '../../components/CartDrawer';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Plus
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const THEME_STYLES: Record<string, { primary: string; primaryDark: string; accent: string; bgGrad: string; textDark: string }> = {
  rose: {
    primary: '#D9B4B4',
    primaryDark: '#6B5656',
    accent: '#FEF9F6',
    bgGrad: 'from-[#6B5656] to-[#4A3E3E]',
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

  // Hover Zoom States & Handler
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center' });
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
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
  const [checkoutFormData, setCheckoutFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    paymentMethod: 'COD'
  });

  // Auth User profile
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const activeTheme = THEME_STYLES[themeColor] || THEME_STYLES.rose;

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

  // Fetch product, related products, and custom settings
  useEffect(() => {
    if (!productId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch main product details
        const res = await fetch(`${API_URL}/api/products/${productId}`);
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
        const allRes = await fetch(`${API_URL}/api/products`);
        if (allRes.ok) {
          const allData = await allRes.json();
          if (Array.isArray(allData)) {
            // Filter out current product
            const filtered = allData.filter((p: any) => (p._id || p.id) !== productId);
            setRelatedProducts(filtered);
          }
        }

        // 3. Fetch custom homepage images/logo
        const settingsRes = await fetch(`${API_URL}/api/settings/homepage-images`);
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Logged out successfully.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product._id || product.id,
      name: product.title || product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      image_url: product.image_url || (product.images && product.images[0]) || '',
      category: product.category || 'General'
    }, quantity);
    setCartBouncing(true);
    setTimeout(() => setCartBouncing(false), 800);
    showToast(`Added ${quantity} × ${product.name} to cart! 🧶`);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutFormData.name || !checkoutFormData.email || !checkoutFormData.mobile || !checkoutFormData.address) {
      alert('Please fill in all checkout fields.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const productName = product?.name || 'Handcrafted Product';
      const productPrice = product?.price || 0;
      const totalPrice = productPrice * quantity;
      const categoryName = product?.category || 'General';
      const paymentMethodText = checkoutFormData.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Online Payment)';
      
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const productDetailUrl = `${origin}/product/${product?._id || productId}`;
      const productImageUrl = product?.image_url || '';

      const message = `🧶 *New Order Request - Crochet Creation* 🧶\n\n` +
        `Hello! I would like to place a custom order with the following details:\n\n` +
        `📦 *Product Details:*\n` +
        `- *Name:* ${productName}\n` +
        `- *Category:* ${categoryName}\n` +
        `- *Price:* ₹${productPrice.toFixed(2)}\n` +
        `- *Quantity:* ${quantity}\n` +
        `- *Total Amount:* ₹${totalPrice.toFixed(2)}\n` +
        `- *Product Link:* ${productDetailUrl}\n` +
        (productImageUrl ? `- *Image Link:* ${productImageUrl}\n` : '') + `\n` +
        `👤 *Customer Details:*\n` +
        `- *Name:* ${checkoutFormData.name}\n` +
        `- *Email:* ${checkoutFormData.email}\n` +
        `- *Mobile:* ${checkoutFormData.mobile}\n` +
        `- *Delivery Address:* ${checkoutFormData.address}\n\n` +
        `💳 *Payment Method:* ${paymentMethodText}\n\n` +
        `Please confirm this order. Thank you!`;

      const formattedPhone = '917551041853';
      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp link
      window.open(url, '_blank');
      
      setWhatsappUrl(url);
      setCheckoutSuccess(true);
      setCartItemsCount(0);
      localStorage.setItem('crochet_cart_count', '0');
      showToast('Redirecting to WhatsApp... 🧶');
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to generate WhatsApp message. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEF9F6] flex flex-col items-center justify-center p-6 text-stone-600">
        <div className="w-16 h-16 border-4 border-stone-200 border-t-[#D9B4B4] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-widest uppercase animate-pulse">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FEF9F6] flex flex-col items-center justify-center p-6 text-stone-600">
        <X className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <Link href="/" className="text-xs font-bold uppercase tracking-wider text-[#6B5656] underline">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF9F6] text-[#4A3E3E] font-sans selection:bg-[#D9B4B4]/30">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[999] bg-white border-l-4 border-[#6B5656] shadow-2xl p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-[#FEF9F6] flex items-center justify-center text-sm shadow-inner">
            🧶
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B5656] uppercase tracking-wider">Shopping Basket</p>
            <p className="text-xs text-stone-600 mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Floating Header - Exact Match to Landing Page Header */}
      <header
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-[#FEF9F6]/10 py-3.5"
        style={{ backgroundColor: `${activeTheme.primaryDark}E6` }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer select-none">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D9B4B4]/30 shadow-sm bg-white flex-shrink-0 group-hover:rotate-12 group-hover:scale-105 transition-all duration-300">
              <Image 
                src={customImages['logo'] || '/assets/crochet_creation_logo.png'} 
                alt="Logo" 
                fill 
                sizes="36px" 
                className="object-cover" 
              />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-widest text-[#FEF9F6] font-display">
              Crochet Creation
            </span>
          </Link>

          {/* Nav links exactly matching page.tsx navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase text-[#FEF9F6]">
            <Link href="/#home" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">HOME</Link>
            <span className="relative">
              <Link href="/#shop" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">SHOP</Link>
              <span className="absolute -top-3 -right-6 bg-[#D9B4B4] text-[#6B5656] text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">NEW</span>
            </span>
            <Link href="/#blog" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">BLOG</Link>
            <Link href="/#pages" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">PAGES</Link>
            <Link href="/#portfolio" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">PORTFOLIO</Link>
            <Link href="/#elements" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">ELEMENTS</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4 text-xs font-medium tracking-wider text-[#FEF9F6]">
            <div
              id="header-cart-icon"
              onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cart'))}
              className={`flex items-center gap-1.5 hover:text-[#D9B4B4] cursor-pointer transition-transform duration-300 ${cartBouncing ? 'scale-110 text-[#D9B4B4]' : ''}`}
            >
              <ShoppingBag className={`w-4 h-4 text-[#D9B4B4] ${cartBouncing ? 'animate-bounce' : ''}`} />
              <span>{cartItemsCount} items</span>
            </div>
            <span className="text-stone-400">|</span>
            {token && userProfile ? (
              <div className="flex items-center gap-2 transition-colors">
                {userProfile.is_admin && (
                  <Link
                    href="/admin/dashboard"
                    className="mr-1 text-[9px] bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white px-2 py-1 rounded font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Hi, {userProfile.first_name}</span>
                <button onClick={handleLogout} className="hover:text-[#D9B4B4] transition-colors p-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/#login" className="hover:text-[#D9B4B4] transition-colors p-1 flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="text-[10px] font-bold">LOGIN</span>
              </Link>
            )}
            <span className="text-stone-400">|</span>
            <div className="flex items-center gap-1.5 ml-1">
              {['rose', 'mustard', 'green', 'teal'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleThemeChange(color)}
                  className={`w-3.5 h-3.5 rounded-full border ${themeColor === color ? 'border-[#FEF9F6] scale-125' : 'border-transparent'} hover:scale-110 transition-transform`}
                  style={{
                    backgroundColor: color === 'rose' ? '#D9B4B4' : color === 'mustard' ? '#E6C17A' : color === 'green' ? '#A8BC98' : '#9CBEC2'
                  }}
                />
              ))}
            </div>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-[#FEF9F6] hover:text-[#D9B4B4]">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div
            className="lg:hidden absolute top-full left-0 w-full border-b border-[#FEF9F6]/10 py-6 px-6 z-30 flex flex-col gap-4 text-sm font-semibold tracking-widest uppercase text-center shadow-2xl backdrop-blur-lg transition-all"
            style={{ backgroundColor: `${activeTheme.primaryDark}F2` }}
          >
            <Link href="/#home" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">HOME</Link>
            <Link href="/#shop" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">SHOP</Link>
            <Link href="/#blog" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">BLOG</Link>
            <Link href="/#pages" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">PAGES</Link>
            <Link href="/#portfolio" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">PORTFOLIO</Link>
            <Link href="/#elements" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">ELEMENTS</Link>
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#FEF9F6]/10 text-[#FEF9F6]">
              <div
                id="mobile-cart-icon"
                onClick={() => {
                  setIsMenuOpen(false);
                  typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cart'));
                }}
                className={`flex items-center gap-1.5 cursor-pointer transition-transform duration-300 ${cartBouncing ? 'scale-110 text-[#D9B4B4]' : ''}`}
              >
                <ShoppingBag className={`w-4 h-4 text-[#D9B4B4] ${cartBouncing ? 'animate-bounce' : ''}`} />
                <span>{cartItemsCount} items</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumbs & Back Nav */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/#shop" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-[#6B5656] hover:text-[#D9B4B4] transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> BACK TO SHOP
          </Link>
          <div className="text-[10px] tracking-widest uppercase text-stone-400 flex items-center gap-1 font-semibold">
            <Link href="/" className="hover:underline">Home</Link> <ChevronRight className="w-3 h-3" /> 
            <Link href="/#shop" className="hover:underline">Shop</Link> <ChevronRight className="w-3 h-3" /> 
            <span className="text-stone-500 font-bold">{product.name}</span>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Image Display with Gallery & Amazon-Style Zoom */}
          <div className="flex flex-col gap-4 w-full">
            <div 
              className="relative h-[480px] w-full rounded-3xl overflow-hidden border border-[#EADBDB] bg-stone-100 shadow-sm cursor-zoom-in group/zoom"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => {
                setIsZoomed(false);
                setZoomStyle({ transformOrigin: 'center center' });
              }}
              onMouseMove={handleMouseMove}
            >
              <Image 
                src={activeImageUrl || product.image_url} 
                alt={product.name} 
                fill 
                priority
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover transition-transform duration-200 ease-out"
                style={{
                  ...zoomStyle,
                  transform: isZoomed ? 'scale(2)' : 'scale(1)'
                }}
              />
              {/* Hover guidance label */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg pointer-events-none transition-opacity duration-300 group-hover/zoom:opacity-0 flex items-center gap-1">
                <span>🔍</span> Hover to zoom
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="flex flex-wrap gap-3 items-center justify-start mt-2">
                {product.image_urls.map((url: string, index: number) => {
                  const isActive = (activeImageUrl || product.image_url) === url;
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveImageUrl(url)}
                      onMouseEnter={() => setActiveImageUrl(url)}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-stone-50 ${
                        isActive 
                          ? 'border-[#6B5656] shadow-sm scale-102 ring-2 ring-[#6B5656]/10' 
                          : 'border-[#EADBDB] hover:border-[#6B5656]/50 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <Image 
                        src={url} 
                        alt={`${product.name} gallery image ${index + 1}`} 
                        fill 
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Order Details panel */}
          <div className="space-y-8">
            <div>
              <span className="bg-[#D9B4B4]/25 text-[#6B5656] text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md">
                {product.category}
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#6B5656] mt-4 tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price section */}
            <div className="bg-[#FEF9F6] border border-[#EADBDB] p-6 rounded-2xl">
              <p className="text-[10px] text-stone-450 uppercase tracking-widest font-black">Price</p>
              <div className="mt-1">
                <span className="text-3xl font-black text-[#6B5656]">₹{product.price?.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6B5656] block">Description</span>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Details & Specifications */}
            <div className="border-t border-[#EADBDB] pt-6 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6B5656] block tracking-widest">
                DETAILS & SPECIFICATIONS
              </span>
              <div className="bg-[#FEF9F6] border border-[#EADBDB] rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  
                  {/* Size */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#6B5656]/5 text-[#6B5656] shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Dimensions / Size</span>
                      <span className="text-[#6B5656] font-semibold text-sm leading-tight block pt-0.5">{product.size || 'Customisable'}</span>
                    </div>
                  </div>

                  {/* Materials */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#6B5656]/5 text-[#6B5656] shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Materials</span>
                      <span className="text-[#6B5656] font-semibold text-sm leading-tight block pt-0.5">{product.materials || 'Premium yarn mix'}</span>
                    </div>
                  </div>

                  {/* Care Instructions */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#6B5656]/5 text-[#6B5656] shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Care Instructions</span>
                      <span className="text-[#6B5656] font-semibold text-sm leading-tight block pt-0.5">{product.care_instructions || 'Handwash gently'}</span>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#6B5656]/5 text-[#6B5656] shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Availability</span>
                      <span className="inline-block pt-1">
                        {product.in_stock !== false ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/40 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                            In Stock
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200/40 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                            Out of Stock
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Quantity Selector & Checkout Actions */}
            <div className="border-t border-[#EADBDB] pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#6B5656]">Quantity</span>
                <div className="flex items-center border border-[#EADBDB] rounded-lg overflow-hidden bg-white shadow-inner">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={product.in_stock === false}
                    className="p-2 hover:bg-stone-50 text-stone-500 active:scale-90 transition-transform disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 text-sm font-bold text-[#6B5656] min-w-10 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                    disabled={product.in_stock === false}
                    className="p-2 hover:bg-stone-50 text-stone-500 active:scale-90 transition-transform disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.in_stock === false}
                  className="w-full bg-white hover:bg-stone-50 text-[#6B5656] border border-[#6B5656] disabled:border-stone-200 disabled:text-stone-400 disabled:bg-stone-50 disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  <ShoppingBag className="w-4 h-4" /> {product.in_stock === false ? 'Out of Stock' : 'Add to Basket'}
                </button>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={product.in_stock === false}
                  className="w-full bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl transition-all active:scale-98 shadow flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  {product.in_stock === false ? 'Out of Stock' : 'Buy It Now'}
                </button>
              </div>

              {/* Extras indicators */}
              <div className="grid grid-cols-3 gap-2 pt-4 text-[10px] text-stone-500 font-semibold text-center uppercase tracking-wider">
                <div className="flex flex-col items-center gap-1.5 p-2 bg-stone-50 rounded-xl">
                  <Truck className="w-4 h-4 text-[#D9B4B4]" /> Free Delivery
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-stone-50 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-[#D9B4B4]" /> Secure Check
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-stone-50 rounded-xl">
                  <RotateCcw className="w-4 h-4 text-[#D9B4B4]" /> 30-Day returns
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products Section (純 database data dynamically derived) */}
        {relatedProducts.length > 0 && (
          <section className="mt-28 border-t border-[#EADBDB] pt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black tracking-widest text-[#6B5656] uppercase">RELATED CREATIONS</h3>
              <span className="text-xs font-bold text-[#D9B4B4] uppercase tracking-widest">Handcrafted With Passion</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProducts.slice(0, 3).map((item) => (
                <Link
                  key={item._id || item.id}
                  href={`/product/${item._id || item.id}`}
                  className="bg-white border border-[#EADBDB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="h-48 relative overflow-hidden bg-amber-50/10">
                    <Image src={item.image_url} alt={item.title || item.name} fill sizes="380px" className="object-cover group-hover:scale-103 transition-transform" />
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-[#D9B4B4] uppercase tracking-widest">{item.category}</span>
                      <h4 className="text-sm font-bold text-[#6B5656] mt-0.5 mb-1 group-hover:text-[#D9B4B4] transition-colors">{item.title || item.name}</h4>
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
                      <span className="text-sm font-black text-[#6B5656]">₹{item.price?.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-[#D9B4B4] uppercase tracking-widest flex items-center gap-0.5">
                        VIEW DETAILS <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-[#EADBDB] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#EADBDB] flex items-center justify-between" style={{ backgroundColor: activeTheme.primaryDark }}>
              <div className="text-white">
                <h3 className="text-base font-black tracking-widest uppercase">ORDER CHECKOUT</h3>
                <p className="text-[10px] text-stone-300 mt-0.5">Please provide shipping & contact details</p>
              </div>
              <button 
                onClick={() => { setCheckoutOpen(false); setCheckoutSuccess(false); }}
                className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              {checkoutSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-250 rounded-full flex items-center justify-center text-3xl mx-auto shadow animate-pulse">
                    💬
                  </div>
                  <h4 className="text-lg font-bold text-[#6B5656]">Redirecting to WhatsApp...</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                    We are opening a WhatsApp chat with the admin to place your custom order. If the chat did not open automatically, please click the button below to send your details.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-2"
                    >
                      Send Message via WhatsApp
                    </a>
                    <button
                      onClick={() => { setCheckoutOpen(false); setCheckoutSuccess(false); router.push('/'); }}
                      className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white text-xs font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-colors shadow"
                    >
                      Return To Home
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  
                  {/* Order Summary box */}
                  <div className="p-4 bg-stone-50 border border-[#EADBDB] rounded-2xl">
                    <span className="text-[9px] font-black text-[#D9B4B4] uppercase tracking-widest block mb-2">Order Summary</span>
                    <div className="flex justify-between items-center text-xs font-bold text-[#6B5656]">
                      <span>{product.name} ({quantity}x)</span>
                      <span>₹{((product.price || 0) * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1 border-t border-stone-200/50 pt-2">
                      <span>Shipping Method</span>
                      <span className="text-emerald-600 font-bold uppercase tracking-wider">Free Delivery</span>
                    </div>
                  </div>

                  {/* Customer details fields */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B5656] block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={checkoutFormData.name}
                      onChange={(e) => setCheckoutFormData({ ...checkoutFormData, name: e.target.value })}
                      className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#6B5656] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B5656] block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={checkoutFormData.email}
                        onChange={(e) => setCheckoutFormData({ ...checkoutFormData, email: e.target.value })}
                        className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#6B5656] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B5656] block mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit number"
                        value={checkoutFormData.mobile}
                        onChange={(e) => setCheckoutFormData({ ...checkoutFormData, mobile: e.target.value })}
                        className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#6B5656] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B5656] block mb-1">Shipping Address</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="House No, Street, Landmark, City, Pin Code"
                      value={checkoutFormData.address}
                      onChange={(e) => setCheckoutFormData({ ...checkoutFormData, address: e.target.value })}
                      className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#6B5656] focus:outline-none resize-none"
                    />
                  </div>

                  {/* Payment selection */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B5656] block mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'COD', label: 'COD' },
                        { id: 'UPI', label: 'UPI App' },
                        { id: 'CARD', label: 'Debit Card' }
                      ].map((pay) => (
                        <button
                          key={pay.id}
                          type="button"
                          onClick={() => setCheckoutFormData({ ...checkoutFormData, paymentMethod: pay.id })}
                          className={`py-2 px-3 rounded-lg border text-center transition-all text-[10px] font-bold uppercase tracking-wider ${
                            checkoutFormData.paymentMethod === pay.id
                              ? 'border-[#6B5656] bg-stone-50 ring-1 ring-[#6B5656] text-[#6B5656]'
                              : 'border-[#EADBDB] hover:bg-stone-50 text-stone-400'
                          }`}
                        >
                          {pay.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 text-xs uppercase tracking-widest mt-6 shadow"
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
      <footer className="bg-stone-900 text-stone-400 py-16 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Crochet Creation</h4>
            <p className="text-xs leading-relaxed">
              We design and craft premium, customized wool and cotton products, bringing warm smiles and authentic handmade joy to your homes.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#home" className="hover:text-white">Home Catalog</Link></li>
              <li><Link href="/#shop" className="hover:text-white">Finished Products</Link></li>
              <li><Link href="/#blog" className="hover:text-white">Our Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Contact</h4>
            <p className="text-xs leading-relaxed">
              Email: contact@crochetcreation.in<br />
              Hours: Mon - Sat, 9:00 AM - 6:00 PM
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Secure Shop</h4>
            <p className="text-xs leading-relaxed">
              Stitched with passion and delivered with care. Thank you for supporting local craftswomen.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-stone-800/80 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} Crochet Creation. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
