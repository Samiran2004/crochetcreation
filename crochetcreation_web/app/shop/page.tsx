'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { addToCart } from '../components/CartDrawer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Search, 
  LogOut, 
  User, 
  Menu, 
  X, 
  ChevronRight, 
  Filter, 
  Sparkles,
  ShoppingBag as CartIcon,
  CheckCircle,
  AlertCircle
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

const CATEGORIES = [
  { id: 'ALL', label: 'All Creations' },
  { id: 'TOYS', label: 'Toys & Amigurumi' },
  { id: 'SCARVES AND HATS', label: 'Scarves & Hats' },
  { id: 'ACCESSORIES', label: 'Accessories' },
  { id: 'PULLOVERS', label: 'Pullovers & Sweaters' },
  { id: 'DRESSES', label: 'Dresses' },
  { id: 'FOR KIDS', label: 'For Kids' }
];

export default function ShopPage() {
  const router = useRouter();

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Navigation, Theme & Cart states
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [themeColor, setThemeColor] = useState('rose');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  // Auth User profile
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
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

  const activeTheme = THEME_STYLES[themeColor] || THEME_STYLES.rose;

  // Load configurations and cart count from localStorage
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

  // Fetch products and custom settings
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch catalog
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } else {
        throw new Error('Could not fetch the product catalog.');
      }

      // 2. Fetch custom homepage images/logo
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while loading shop catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync theme
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

  // Add to basket
  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token && !userProfile) {
      showToast("Please log in to add items to your cart.");
      setTimeout(() => {
        router.push('/?login=true&redirect=' + encodeURIComponent('/shop'));
      }, 1200);
      return;
    }

    addToCart({
      id: product._id || product.id,
      name: product.title || product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      image_url: product.image_url || (product.images && product.images[0]) || '',
      category: product.category || 'General'
    }, 1);
    setCartBouncing(true);
    setTimeout(() => setCartBouncing(false), 800);
    showToast(`Added ${product.title || product.name} to cart! 🧶`);
  };

  // Open Checkout directly
  const handleBuyNow = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token && !userProfile) {
      showToast("Please log in to purchase.");
      setTimeout(() => {
        router.push('/?login=true&redirect=' + encodeURIComponent('/shop'));
      }, 1200);
      return;
    }

    setSelectedProduct(product);
    setCheckoutQuantity(1);
    setCheckoutFormData({
      name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : '',
      email: userProfile ? userProfile.email : '',
      mobile: userProfile ? userProfile.phone || '' : '',
      address: '',
      paymentMethod: 'COD'
    });
    setCheckoutSuccess(false);
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
      const productName = selectedProduct?.title || selectedProduct?.name || 'Handcrafted Product';
      const productPrice = selectedProduct?.price || 0;
      const totalPrice = productPrice * checkoutQuantity;
      const categoryName = selectedProduct?.category || 'General';
      const paymentMethodText = checkoutFormData.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Online Payment)';

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const productDetailUrl = `${origin}/product/${selectedProduct?._id || selectedProduct?.id}`;
      const productImageUrl = selectedProduct?.image_url || '';

      const message = `🧶 *New Order Request - Crochet Creation* 🧶\n\n` +
        `Hello! I would like to place a custom order with the following details:\n\n` +
        `📦 *Product Details:*\n` +
        `- *Name:* ${productName}\n` +
        `- *Category:* ${categoryName}\n` +
        `- *Price:* ₹${productPrice.toFixed(2)}\n` +
        `- *Quantity:* ${checkoutQuantity}\n` +
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

  // Filter and Search logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const title = (p.title || p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const matchesSearch = title.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());

      const productCat = (p.category || '').toUpperCase();
      const filterCat = activeFilter.toUpperCase();
      const matchesCategory = filterCat === 'ALL' || productCat === filterCat || 
        (filterCat === 'TOYS' && productCat.includes('TOY')) || 
        (filterCat === 'ACCESSORIES' && productCat.includes('ACCESSORY')) ||
        (filterCat === 'SCARVES AND HATS' && (productCat.includes('SCARF') || productCat.includes('HAT')));

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-[#FEF9F6] text-[#4A3E3E] font-sans selection:bg-[#D9B4B4]/30">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[999] bg-white border-l-4 border-[#6B5656] shadow-2xl p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-[#FEF9F6] flex items-center justify-center text-sm shadow-inner animate-pulse">
            🧶
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B5656] uppercase tracking-wider">Shopping Basket</p>
            <p className="text-xs text-stone-600 mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Floating Header */}
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
              <Link href="/shop" className="relative py-1 text-[#D9B4B4] transition-all duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-[#D9B4B4] after:transition-all after:duration-300">SHOP</Link>
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
            <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="py-2 text-[#D9B4B4]">SHOP</Link>
            <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">CATEGORIES</Link>
            <Link href="/#about" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">ABOUT US</Link>
            <Link href="/#contact" onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#D9B4B4] text-[#FEF9F6]">CONTACT</Link>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#EADBDB] pb-6 mb-10">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-[#D9B4B4] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D9B4B4]" /> Handcrafted Catalog
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#6B5656] mt-2 tracking-tight">
              Finished Products
            </h1>
          </div>
          <p className="text-xs text-stone-500 max-w-sm md:text-right">
            Browse our collection of hand-stitched creations. Since each piece is carefully crocheted to order, minor custom details may vary.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between mb-12">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search crochet products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#EADBDB] rounded-xl pl-10 pr-4 py-3 text-xs focus:ring-1 focus:ring-[#6B5656] focus:outline-none placeholder-stone-400 font-medium shadow-sm transition-all"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all whitespace-nowrap border ${
                  activeFilter === cat.id
                    ? 'bg-[#6B5656] border-[#6B5656] text-[#FEF9F6] shadow-sm'
                    : 'bg-white border-[#EADBDB] hover:border-[#6B5656] text-[#6B5656]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* Catalog Grid View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#EADBDB] rounded-3xl shadow-sm">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-[#D9B4B4] rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#6B5656] animate-pulse">Loading Catalog Items...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 border border-red-200 rounded-3xl p-8 space-y-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-red-800">Failed to Load Products</h3>
              <p className="text-xs text-red-650 mt-1">{error}</p>
            </div>
            <button 
              onClick={loadData}
              className="bg-white border border-red-300 text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors uppercase tracking-wider"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#EADBDB] border-dashed rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 bg-[#FEF9F6] border border-[#D9B4B4] rounded-full flex items-center justify-center text-xl mx-auto">
              🧶
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#6B5656] uppercase tracking-wider">No Catalog Products Found</h3>
              <p className="text-xs text-stone-500 mt-1">We couldn't find any items matching your category or search query.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p._id || p.id}
                onClick={() => router.push(`/product/${p._id || p.id}`)}
                className="flex flex-col h-full bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              >
                
                {/* Product Image */}
                <div className="relative aspect-[4/5] w-full bg-stone-50 overflow-hidden">
                  <Image 
                    src={p.image_url} 
                    alt={p.title || p.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-sm text-stone-600 border border-gray-100/50">
                      {p.category}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-[#D9B4B4] uppercase tracking-widest block">
                      {p.category}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mt-1 group-hover:text-[#6B5656] transition-colors line-clamp-2">
                      {p.title || p.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="text-xl font-extrabold text-gray-900">
                      ₹{p.price?.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleAddToCart(p, e)}
                        title="Add to Basket"
                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors active:scale-95 shadow-xs"
                      >
                        <CartIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleBuyNow(p, e)}
                        className="px-6 py-2.5 bg-[#6B5656] hover:bg-[#5C4949] text-white text-sm font-semibold rounded-full transition-all active:scale-95 shadow-xs whitespace-nowrap flex-shrink-0"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* Direct Buy Checkout Modal */}
      {checkoutOpen && selectedProduct && (
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
                      onClick={() => { setCheckoutOpen(false); setCheckoutSuccess(false); }}
                      className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white text-xs font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-colors shadow"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  
                  {/* Order Summary box */}
                  <div className="p-4 bg-stone-50 border border-[#EADBDB] rounded-2xl">
                    <span className="text-[9px] font-black text-[#D9B4B4] uppercase tracking-widest block mb-2">Order Summary</span>
                    <div className="flex justify-between items-center text-xs font-bold text-[#6B5656]">
                      <span>{selectedProduct.title || selectedProduct.name}</span>
                      <span>₹{((selectedProduct.price || 0) * checkoutQuantity).toFixed(2)}</span>
                    </div>
                    
                    {/* Quantity selectors inside modal */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-200/50">
                      <span className="text-[10px] text-stone-450 uppercase tracking-widest font-black">Quantity</span>
                      <div className="flex items-center border border-[#EADBDB] rounded-lg overflow-hidden bg-white shadow-inner scale-90">
                        <button 
                          type="button"
                          onClick={() => setCheckoutQuantity(q => Math.max(1, q - 1))}
                          className="px-2 py-1 hover:bg-stone-50 text-stone-500"
                        >
                          -
                        </button>
                        <span className="px-4 text-xs font-bold text-[#6B5656] min-w-8 text-center">{checkoutQuantity}</span>
                        <button 
                          type="button"
                          onClick={() => setCheckoutQuantity(q => Math.min(10, q + 1))}
                          className="px-2 py-1 hover:bg-stone-50 text-stone-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2 border-t border-stone-200/50 pt-2">
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
                    {checkoutLoading ? 'Processing Placement...' : `Place Custom Order - ₹${((selectedProduct.price || 0) * checkoutQuantity).toFixed(2)}`}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
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
