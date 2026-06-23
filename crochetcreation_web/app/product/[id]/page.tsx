'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { addToCart } from '../../components/CartDrawer';
import Link from 'next/link';
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

const REVIEWS = [
  {
    id: 1,
    name: "Aarav Sharma",
    avatar: "AS",
    rating: 5,
    date: "12 May 2026",
    text: "Absolutely stunning craftsmanship! The colors are vibrant and the yarn is extremely soft. Highly recommend for any home decor."
  },
  {
    id: 2,
    name: "Priya Patel",
    avatar: "PP",
    rating: 5,
    date: "28 April 2026",
    text: "Purchased this as a gift for my mother and she loved it. The details are beautiful, and the packaging was lovely."
  },
  {
    id: 3,
    name: "Karan Malhotra",
    avatar: "KM",
    rating: 4,
    date: "04 June 2026",
    text: "Very neat work and lovely presentation. Delivery took about 6 days, but it was worth the wait. Will buy again!"
  },
  {
    id: 4,
    name: "Ananya Roy",
    avatar: "AR",
    rating: 5,
    date: "20 May 2026",
    text: "So soft and beautifully made! The stitching is precise and the finish is premium. 10/10 purchase!"
  }
];

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
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColorVal, setSelectedColorVal] = useState('Cream');
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
      const totalPrice = productPrice * quantity;
      const categoryName = product?.category || 'General';
      const paymentMethodText = checkoutFormData.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Online Payment)';
      
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const productDetailUrl = `${origin}/product/${product?._id || productId}`;
      const productImageUrl = product?.image_url || '';

      const hasSize = product.category?.toUpperCase() === 'GARMENTS' && product.has_sizes;
      const sizeText = hasSize ? `- *Size:* ${selectedSize}\n` : '';

      // Save order to the database first
      const savedToken = localStorage.getItem('token') || token;
      console.log('[Checkout] Placing order: sending data to backend...', {
        url: `${API_URL}/api/orders/`,
        tokenPresent: !!savedToken
      });
      if (savedToken) {
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
          total_amount: totalPrice,
          payment_method: checkoutFormData.paymentMethod
        };

        const orderResponse = await fetch(`${API_URL}/api/orders/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify(orderData)
        });

        console.log('[Checkout] Backend response received:', {
          status: orderResponse.status,
          ok: orderResponse.ok
        });

        if (!orderResponse.ok) {
          const errData = await orderResponse.json().catch(() => ({}));
          console.error('[Checkout API Error]', orderResponse.status, errData);
          throw new Error(errData.detail || 'Failed to record the order on the server.');
        }
        console.log('[Checkout] Order recorded successfully on server.');
      } else {
        console.warn('[Checkout] No token found in localStorage or state. Skipping DB save.');
      }

      const message = `🧶 *New Order Request - Crochet Creation* 🧶\n\n` +
        `Hello! I would like to place a custom order with the following details:\n\n` +
        `📦 *Product Details:*\n` +
        `- *Name:* ${productName}\n` +
        sizeText +
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
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-stone-600">
        <div className="w-16 h-16 border-4 border-stone-200 border-t-[#D9B4B4] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-widest uppercase animate-pulse">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-stone-600">
        <X className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <Link href="/" className="text-xs font-bold uppercase tracking-wider text-[#6B5656] underline">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3E3E] font-sans selection:bg-[#D9B4B4]/30">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[999] bg-white border-l-4 border-[#6B5656] shadow-2xl p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center text-sm shadow-inner">
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
            <span className="text-xl md:text-2xl font-serif font-semibold tracking-wide text-[#FEF9F6]">
              Crochet Creation
            </span>
          </Link>

          {/* Nav links exactly matching page.tsx navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase text-[#FEF9F6]">
            <Link href="/#home" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">HOME</Link>
            <span className="relative">
              <Link href="/shop" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">SHOP</Link>
              <span className="absolute -top-3 -right-6 bg-[#D9B4B4] text-[#6B5656] text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">NEW</span>
            </span>
            <Link href="/shop" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">CATEGORIES</Link>
            <Link href="/#about" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">ABOUT US</Link>
            <Link href="/#contact" className="relative py-1 hover:text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#D9B4B4] hover:after:w-full after:transition-all after:duration-300">CONTACT</Link>
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
                <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-wider text-stone-300 hover:text-white transition-colors">
                  Hi, {userProfile.first_name}
                </Link>
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

          {/* Mobile Icons */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              id="mobile-cart-icon-header"
              onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cart'))}
              className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer transition-transform duration-300 ${cartBouncing ? 'scale-110' : ''}`}
            >
              <ShoppingBag className={`w-5 h-5 text-[#D9B4B4] ${cartBouncing ? 'animate-bounce' : ''}`} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D9B4B4] text-[#6B5656] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#FEF9F6] hover:text-[#D9B4B4] transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer — Full-Screen Overlay */}
        {isMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-[60] flex flex-col pt-20 pb-8 px-6 text-sm font-semibold tracking-widest uppercase text-center backdrop-blur-xl transition-all animate-in fade-in duration-200"
            style={{
              backgroundColor: `${activeTheme.primaryDark}F5`
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-5 right-5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#FEF9F6] hover:text-[#D9B4B4] transition-colors"
            >
              <X className="w-7 h-7" />
            </button>

            <nav className="flex flex-col items-center gap-1 flex-1 justify-center">
              <Link href="/#home" onClick={() => setIsMenuOpen(false)} className="w-full py-4 min-h-[48px] flex items-center justify-center hover:text-[#D9B4B4] hover:bg-white/5 rounded-xl transition-all text-[#FEF9F6] text-base tracking-[0.2em]">HOME</Link>
              <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="w-full py-4 min-h-[48px] flex items-center justify-center hover:text-[#D9B4B4] hover:bg-white/5 rounded-xl transition-all text-[#FEF9F6] text-base tracking-[0.2em]">SHOP</Link>
              <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="w-full py-4 min-h-[48px] flex items-center justify-center hover:text-[#D9B4B4] hover:bg-white/5 rounded-xl transition-all text-[#FEF9F6] text-base tracking-[0.2em]">CATEGORIES</Link>
              <Link href="/#about" onClick={() => setIsMenuOpen(false)} className="w-full py-4 min-h-[48px] flex items-center justify-center hover:text-[#D9B4B4] hover:bg-white/5 rounded-xl transition-all text-[#FEF9F6] text-base tracking-[0.2em]">ABOUT US</Link>
              <Link href="/#contact" onClick={() => setIsMenuOpen(false)} className="w-full py-4 min-h-[48px] flex items-center justify-center hover:text-[#D9B4B4] hover:bg-white/5 rounded-xl transition-all text-[#FEF9F6] text-base tracking-[0.2em]">CONTACT</Link>
            </nav>

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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        
        {/* Breadcrumbs & Back Navigation */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/shop" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#6B5656] hover:text-[#D9B4B4] transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> BACK TO SHOP
          </Link>
          <div className="text-[10px] tracking-widest uppercase text-stone-400 flex items-center gap-1 font-bold">
            <Link href="/" className="hover:underline">Home</Link> <ChevronRight className="w-3 h-3" /> 
            <Link href="/shop" className="hover:underline">Shop</Link> <ChevronRight className="w-3 h-3 text-stone-300" /> 
            <span className="text-[#6B5656] font-bold">{product.name}</span>
          </div>
        </div>

        {/* 50/50 - 60/40 Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Main Image Gallery (Framer Motion Transitions + thumbnails overlay) */}
          <div className="lg:col-span-7 flex flex-col w-full pb-8">
            <div className="relative w-full mb-10 overflow-visible group/gallery flex justify-center">
              
              {/* Main Image container with interactive zoom, rounded-2xl, and box shadow */}
              <div 
                className="relative w-full aspect-square md:aspect-auto md:h-[480px] lg:h-[520px] flex items-center justify-center overflow-hidden rounded-2xl border border-[#EADBDB]/65 bg-[#FBF9F6] shadow-[0_4px_15px_rgba(0,0,0,0.05)] cursor-zoom-in transition-all duration-300"
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
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-[#FDFBF7]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#EADBDB]/60 shadow-md">
                  {product.image_urls.slice(0, 4).map((url: string, index: number) => {
                    const isActive = (activeImageUrl || product.image_url) === url;
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveImageUrl(url)}
                        onMouseEnter={() => setActiveImageUrl(url)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-200 bg-white shrink-0 ${
                          isActive 
                            ? 'border-[#6B5656] shadow-sm scale-110' 
                            : 'border-stone-200 hover:border-[#6B5656]/50 opacity-70 hover:opacity-100'
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
              <span className="inline-block bg-[#D9B4B4]/20 text-[#6B5656] text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                {product.category || 'HANDMADE'}
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 tracking-wide mt-3 leading-tight">
                {product.name}
              </h1>
              
              {(() => {
                const originalPrice = product.originalPrice ?? null;
                const sellingPrice = product.sellingPrice ?? product.price ?? null;
                
                if (sellingPrice === null) return null;
                
                const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;
                const discountPercent = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
                
                return (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-2xl font-black text-[#111827]">
                      ₹{sellingPrice.toFixed(2)}
                    </span>
                    {hasDiscount && discountPercent > 0 && (
                      <>
                        <span className="text-sm text-[#6B7280] line-through">
                          ₹{originalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm font-semibold text-[#16a34a] bg-[#16a34a]/10 px-2.5 py-0.5 rounded-full">
                          ({discountPercent}% OFF)
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Urgency Bar */}
            <div className="bg-[#FEF9F6] border border-[#EADBDB]/60 rounded-xl p-3.5 flex items-center gap-3 text-xs text-[#6B5656] shadow-xs">
              <span className="text-base select-none">📦</span>
              <div className="font-sans">
                <span className="font-bold">Estimated crafting & delivery: </span>
                <span className="text-stone-600">{product.delivery_time || '5-7 working days'}</span>
              </div>
            </div>

            {/* Product Variants (Size & Color selector) */}
            <div className="space-y-4 pt-2 border-t border-[#EADBDB]/50">
              {/* Size Selection */}
              {product.category?.toUpperCase() === 'GARMENTS' && product.has_sizes && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Select Size</span>
                    <span className="text-xs font-semibold text-[#6B5656]">{selectedSize === 'S' ? 'Small' : selectedSize === 'M' ? 'Medium' : 'Large'}</span>
                  </div>
                  <div className="flex gap-2">
                    {['S', 'M', 'L'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`w-9 h-9 rounded-full border text-[11px] font-black transition-all flex items-center justify-center ${
                          selectedSize === sz
                            ? 'border-[#4A3F35] bg-[#4A3F35] text-white shadow-xs scale-105'
                            : 'border-stone-250 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Select Color</span>
                  <span className="text-xs font-semibold text-[#6B5656]">{selectedColorVal}</span>
                </div>
                <div className="flex gap-3">
                  {[
                    { name: 'Cream', color: '#FDFBF7', border: 'border-stone-300' },
                    { name: 'Rose', color: '#D9B4B4', border: 'border-[#D9B4B4]' },
                    { name: 'Mustard', color: '#E6C17A', border: 'border-[#E6C17A]' },
                    { name: 'Sage', color: '#A8BC98', border: 'border-[#A8BC98]' }
                  ].map((clr) => (
                    <button
                      key={clr.name}
                      type="button"
                      onClick={() => setSelectedColorVal(clr.name)}
                      className={`w-7 h-7 rounded-full border-2 transition-all relative ${
                        selectedColorVal === clr.name
                          ? 'ring-2 ring-offset-2 ring-[#6B5656]'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: clr.color }}
                      title={clr.name}
                    >
                      {selectedColorVal === clr.name && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#6B5656]">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="pt-4 border-t border-[#EADBDB]/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Quantity</span>
                <div className="flex items-center border border-stone-250 rounded-lg overflow-hidden bg-white shadow-xs">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={product.in_stock === false}
                    className="p-1.5 hover:bg-stone-50 text-stone-500 active:scale-90 transition-transform disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 text-xs font-bold text-[#6B5656] min-w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                    disabled={product.in_stock === false}
                    className="p-1.5 hover:bg-stone-50 text-stone-500 active:scale-90 transition-transform disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.in_stock === false}
                  className="flex-1 bg-[#4A3F35] hover:bg-stone-900 text-white disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  <ShoppingBag className="w-4 h-4" /> {product.in_stock === false ? 'Out of Stock' : 'Add to Basket'}
                </button>
                
                <button
                  onClick={() => {
                    setIsWishlisted(!isWishlisted);
                    showToast(isWishlisted ? "Removed from Wishlist" : "Added to Wishlist 💖");
                  }}
                  className="w-12 h-12 flex items-center justify-center border border-stone-250 rounded-xl hover:bg-stone-50 active:scale-95 transition-all text-[#6B5656] shrink-0"
                  title="Add to Wishlist"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={product.in_stock === false}
                className="w-full bg-white hover:bg-stone-50 text-[#6B5656] border border-[#6B5656] disabled:bg-stone-200 disabled:text-stone-400 disabled:border-stone-250 disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl transition-all active:scale-98 shadow-xs flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                Buy It Now
              </button>
            </div>

            {/* Accordions System */}
            <div className="border-t border-[#EADBDB] pt-6 space-y-4">
              
              {/* Accordion 1: Description & Details */}
              <div className="border-b border-[#EADBDB]/50 pb-4">
                <button
                  type="button"
                  onClick={() => setDescriptionOpen(!descriptionOpen)}
                  className="w-full flex items-center justify-between text-left font-serif text-sm font-semibold text-gray-900 py-2 focus:outline-none"
                >
                  <span>Description & Details</span>
                  <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform duration-300 ${descriptionOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: descriptionOpen ? 'auto' : 0, opacity: descriptionOpen ? 1 : 0 }}
                  className="overflow-hidden"
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="pt-2 text-stone-600 text-xs leading-relaxed space-y-3 font-sans">
                    <p>{product.description}</p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li><span className="font-bold text-stone-700">Yarn Type:</span> {product.materials || '100% Premium Combed Cotton'}</li>
                      <li><span className="font-bold text-stone-700">Care Instructions:</span> {product.care_instructions || 'Handwash gently, dry flat'}</li>
                      <li><span className="font-bold text-stone-700">Dimensions:</span> {product.size || 'Customisable'}</li>
                      <li><span className="font-bold text-stone-700">Crafting Technique:</span> Hand-stitched with love</li>
                    </ul>
                  </div>
                </motion.div>
              </div>

              {/* Accordion 2: Shipping & Returns */}
              <div className="border-b border-[#EADBDB]/50 pb-4">
                <button
                  type="button"
                  onClick={() => setShippingOpen(!shippingOpen)}
                  className="w-full flex items-center justify-between text-left font-serif text-sm font-semibold text-gray-900 py-2 focus:outline-none"
                >
                  <span>Shipping & Returns</span>
                  <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform duration-300 ${shippingOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: shippingOpen ? 'auto' : 0, opacity: shippingOpen ? 1 : 0 }}
                  className="overflow-hidden"
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2.5 p-2 bg-[#FEF9F6] border border-[#EADBDB]/40 rounded-xl">
                      <Truck className="w-4 h-4 text-[#D9B4B4] shrink-0" />
                      <div className="text-[9px] leading-tight">
                        <p className="font-bold text-stone-700">Free Delivery</p>
                        <p className="text-stone-450">On orders over ₹499</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-[#FEF9F6] border border-[#EADBDB]/40 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-[#D9B4B4] shrink-0" />
                      <div className="text-[9px] leading-tight">
                        <p className="font-bold text-stone-700">Secure Checkout</p>
                        <p className="text-stone-450">100% encrypted ssl</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-[#FEF9F6] border border-[#EADBDB]/40 rounded-xl">
                      <RotateCcw className="w-4 h-4 text-[#D9B4B4] shrink-0" />
                      <div className="text-[9px] leading-tight">
                        <p className="font-bold text-stone-700">Easy Returns</p>
                        <p className="text-stone-450">30-day exchanges</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 bg-[#FEF9F6] border border-[#EADBDB]/40 rounded-xl">
                      <Sparkles className="w-4 h-4 text-[#D9B4B4] shrink-0" />
                      <div className="text-[9px] leading-tight">
                        <p className="font-bold text-stone-700">Crafted to Order</p>
                        <p className="text-stone-450">Individually stitched</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>

          </div>
        </div>

        {/* Middle Section: Ratings & Reviews */}
        <section className="mt-20 border-t border-[#EADBDB] pt-16">
          <h3 className="font-serif text-2xl font-bold text-gray-900 mb-8 tracking-wide">
            Customer Reviews & Ratings
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Rating Summary Left Side (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-[#EADBDB]/70 rounded-3xl p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-4">
                <span className="font-serif text-5xl font-black text-gray-900">4.8</span>
                <div>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-450 mt-1 uppercase tracking-wider font-bold">Based on 28 ratings</p>
                </div>
              </div>

              {/* Star breakdown bar chart */}
              <div className="space-y-2.5">
                {[
                  { stars: 5, pct: 85, count: 24 },
                  { stars: 4, pct: 10, count: 3 },
                  { stars: 3, pct: 3, count: 1 },
                  { stars: 2, pct: 1, count: 0 },
                  { stars: 1, pct: 1, count: 0 }
                ].map((row) => (
                  <div key={row.stars} className="flex items-center gap-3 text-xs">
                    <span className="w-10 text-stone-500 font-bold flex items-center gap-1">
                      {row.stars} <Star className="w-3.5 h-3.5 fill-amber-450 text-amber-400" />
                    </span>
                    <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-stone-450 font-black">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrolling Carousel Right Side (8 cols) */}
            <div className="lg:col-span-8 w-full overflow-hidden relative">
              <div className="flex gap-6 overflow-x-auto snap-x scrollbar-none pb-4 scroll-smooth">
                {REVIEWS.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="min-w-[280px] sm:min-w-[340px] max-w-[340px] bg-white border border-[#EADBDB]/60 rounded-2xl p-6 shadow-xs snap-start flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#D9B4B4]/20 border border-[#D9B4B4]/40 flex items-center justify-center font-bold text-xs text-[#6B5656]">
                            {rev.avatar}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{rev.name}</h4>
                            <span className="text-[9px] text-stone-400">{rev.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-400 gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'text-stone-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-stone-600 text-xs leading-relaxed italic">
                        "{rev.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-end gap-1.5 mt-2 px-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Swipe for more ➔</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section: You Might Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-28 border-t border-[#EADBDB] pt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-2xl font-bold text-gray-900 tracking-wide">You Might Also Like</h3>
              <span className="text-xs font-bold text-[#D9B4B4] uppercase tracking-widest">Handcrafted with passion</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((item) => {
                const itemId = item._id || item.id;
                return (
                  <Link
                    key={itemId}
                    href={`/product/${itemId}`}
                    className="flex flex-col h-full bg-white border border-[#EADBDB]/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="relative aspect-square w-full bg-stone-50 overflow-hidden">
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
                        <span className="text-[9px] font-bold text-[#D9B4B4] uppercase tracking-widest block">{item.category}</span>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-[#6B5656] transition-colors line-clamp-1">{item.title || item.name}</h4>
                        <div className="flex items-center gap-1 text-[8px] font-semibold text-stone-500 mt-1">
                          <span>🚚</span>
                          <span>{item.delivery_time || '5-7 working days'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100 gap-1.5">
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
                                  <span className="text-[10px] text-gray-400 line-through whitespace-nowrap">
                                    ₹{typeof originalPrice === 'number' ? originalPrice.toFixed(2) : parseFloat(originalPrice).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {hasDiscount && discountPercent > 0 && (
                                <span className="text-[8px] font-bold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-md mt-0.5 self-start whitespace-nowrap">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        <span className="text-[9px] font-bold text-[#D9B4B4] uppercase tracking-widest flex items-center gap-0.5 shrink-0">
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
              <li><Link href="/shop" className="hover:text-white">Finished Products</Link></li>
              <li><Link href="/#about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/#contact" className="hover:text-white">Contact</Link></li>
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
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Trust Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/#terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/#refund" className="hover:text-white">Refund Policy</Link></li>
              <li><Link href="/#contact" className="hover:text-white">Customer Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-stone-800/80 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} Crochet Creation. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
