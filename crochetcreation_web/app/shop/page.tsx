'use client';
import { apiFetch, getApiUrl, clearSession } from '../utils/apiFetch';
import {
  PAYMENT_METHOD,
  useStoreSettings,
  formatOrderRef,
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
} from '../utils/checkout';
import { PrepaidNotice, PaymentInstructions } from '../components/PaymentNotice';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { addToCart } from '../components/CartDrawer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddressMapPicker from '../components/AddressMapPicker';
import { 
  Search, 
  ChevronRight, 
  Sparkles,
  ShoppingBag as CartIcon,
  Truck,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrganicEdge from '../components/ui/OrganicEdge';
import SectionHeading from '../components/ui/SectionHeading';
import { Sprig, YarnBall } from '../components/decor/Botanicals';
import { Reveal, ScrollProgress, Parallax } from '../components/motion/Motion';

const API_URL = getApiUrl();

// Dynamic categories will be generated based on products

export default function ShopPage() {
  const router = useRouter();

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  // Pagination states
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const LIMIT = 12;

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Categories come from the whole catalog, not just the page of results
  // currently loaded — otherwise a category whose first item sits on page two
  // has no chip until the shopper happens to scroll that far.
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const dynamicCategories = useMemo(() => ['ALL', ...allCategories], [allCategories]);

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

  // Held for the post-order screen, which must keep showing the amount owed.
  const [placedOrder, setPlacedOrder] = useState<{ ref: string; amount: number }>({
    ref: '',
    amount: 0,
  });
  const storeSettings = useStoreSettings();

  const activeTheme = {
    rose: { primary: '#D9B4B4', primaryDark: '#6B5656', bgGrad: 'from-teal to-bodytext', textDark: '#4A3E3E' },
    mustard: { primary: '#E6C17A', primaryDark: '#5C4A2E', bgGrad: 'from-[#5C4A2E] to-[#3B2F1D]', textDark: '#3B2F1D' },
    green: { primary: '#A8BC98', primaryDark: '#3E4D36', bgGrad: 'from-[#3E4D36] to-[#253020]', textDark: '#253020' },
    teal: { primary: '#9CBEC2', primaryDark: '#3A4E52', bgGrad: 'from-[#3A4E52] to-[#243235]', textDark: '#243235' }
  }[themeColor] || { primary: '#D9B4B4', primaryDark: '#6B5656' };

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

  // Fetch products
  const fetchInFlight = useRef(false);

  const fetchProducts = useCallback(async (reset = false) => {
    if (fetchInFlight.current && !reset) return;
    fetchInFlight.current = true;

    if (reset) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    setError(null);
    try {
      const currentSkip = reset ? 0 : skip;
      let url = `${API_URL}/api/products?skip=${currentSkip}&limit=${LIMIT}`;
      if (activeFilter !== 'ALL') {
        url += `&category=${encodeURIComponent(activeFilter)}`;
      }
      if (debouncedSearchQuery) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      }

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Ensure we are working with the new PaginatedProductsResponse structure
        const fetchedItems = Array.isArray(data) ? data : (data.items || []);
        const total = data.total || fetchedItems.length;

        if (reset) {
          setProducts(fetchedItems);
        } else {
          setProducts((prev) => [...prev, ...fetchedItems]);
        }
        
        setTotalProducts(total);
        setSkip(currentSkip + LIMIT);
        setHasMore(currentSkip + LIMIT < total);

      } else {
        throw new Error('Could not fetch the product catalog.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while loading shop catalog.');
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [skip, activeFilter, debouncedSearchQuery]);

  // Fetch custom settings (once on mount)
  const fetchSettings = async () => {
    try {
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
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/products/categories`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setAllCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
    return () => { cancelled = true; };
  }, []);

  // Trigger fetch when filter or search changes
  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, debouncedSearchQuery]);

  // Sync theme
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
      mobile: userProfile ? (userProfile.phone || userProfile.mobile || '') : '',
      address: '',
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
      const categoryName = selectedProduct?.category || 'General';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

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
            product_id: selectedProduct?._id || selectedProduct?.id || '',
            title: productName,
            price: productPrice,
            quantity: checkoutQuantity
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

      const placed = await orderResponse.json();
      const orderRef = formatOrderRef(placed.id || placed._id || '');
      // The server is the authority on the amount owed.
      const payableTotal = Number(placed.total_amount ?? productPrice * checkoutQuantity);

      const message = buildWhatsAppOrderMessage({
        items: [{
          id: selectedProduct?._id || selectedProduct?.id,
          name: productName,
          price: productPrice,
          quantity: checkoutQuantity,
          category: categoryName,
        }],
        subtotal: payableTotal,
        customer: {
          name: checkoutFormData.name,
          email: checkoutFormData.email,
          mobile: checkoutFormData.mobile,
          address: checkoutFormData.address,
        },
        orderRef,
        upiId: storeSettings.upiId,
        origin,
      });

      const url = buildWhatsAppUrl(message);

      setPlacedOrder({ ref: orderRef, amount: payableTotal });
      setWhatsappUrl(url);
      setCheckoutSuccess(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Infinite scroll observer.
  //
  // The in-flight flag is a ref, not state: state updates land a render too
  // late, so a second intersection could fire before `isFetchingMore` was
  // visible here and fetch the same page twice, appending duplicate cards.
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    // Always release the previous node first, even when we bail out below,
    // or the old observer stays attached to an element that has been replaced.
    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
    if (!node || !hasMore || loading) return;

    observer.current = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      if (fetchInFlight.current || !hasMore) return;
      fetchProducts(); // fetch more without resetting
    });

    observer.current.observe(node);
  }, [loading, hasMore, fetchProducts]);

  // Tear the observer down when the page unmounts.
  useEffect(() => () => {
    observer.current?.disconnect();
    observer.current = null;
  }, []);

  return (
    <div className="min-h-screen bg-parchment text-bodytext font-sans selection:bg-terracotta/25">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[999] bg-white border-l-4 border-teal shadow-2xl p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-parchment flex items-center justify-center text-sm shadow-inner animate-pulse">
            🧶
          </div>
          <div>
            <p className="text-xs font-bold text-teal uppercase tracking-wider">Shopping Basket</p>
            <p className="text-xs text-bodytext mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Navbar Component */}
      <Navbar alwaysOpaque />
      <ScrollProgress />

      {/* Catalogue hero */}
      <section className="relative bg-paper-deep pt-24 md:pt-32 pb-10 md:pb-14 overflow-hidden">
        <Sprig className="absolute top-16 right-4 w-44 h-auto text-olive/20 hidden lg:block" />
        <YarnBall className="absolute bottom-4 left-5 w-16 h-auto text-terracotta/20 hidden lg:block" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <Reveal>
          <SectionHeading
            eyebrow="Handcrafted catalogue"
            lede="Every piece is crocheted to order, so tiny variations in shade and shape are part of the charm."
          >
            Our Finished Creations
          </SectionHeading>
          </Reveal>
        </div>
      </section>
      <OrganicEdge variant="wave" fill="var(--parchment)" height={64} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 pt-2 pb-20">

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between mb-12">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              aria-label="Search products"
              placeholder="Search crochet products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-parchment-card border border-line rounded-full pl-11 pr-4 py-3.5 text-[13px] text-ink placeholder-muted outline-none focus:border-terracotta transition-colors shadow-soft"
            />
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-terracotta-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center overflow-x-auto scrollbar-hide -mx-5 px-5 lg:mx-0 lg:px-0">
            <div className="inline-flex items-center gap-1.5 bg-parchment-deep/70 border border-line-soft rounded-full p-1.5">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  aria-pressed={activeFilter === cat}
                  className={`chip ${activeFilter === cat ? 'chip-active' : ''}`}
                >
                  {cat === 'ALL' ? 'All Creations' : cat}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Catalog Grid View */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`sk-${i}`} className="card-soft overflow-hidden">
                <div className="skeleton aspect-[4/5] w-full" />
                <div className="p-4 space-y-2.5">
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-8 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 border border-red-200 rounded-3xl p-8 space-y-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-red-800">Failed to Load Products</h3>
              <p className="text-xs text-red-650 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => fetchProducts(true)}
              className="bg-white border border-red-300 text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors uppercase tracking-wider"
            >
              Retry Connection
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white border border-line border-dashed rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 bg-parchment border border-terracotta rounded-full flex items-center justify-center text-xl mx-auto">
              🧶
            </div>
            <div>
              <h3 className="text-sm font-bold text-teal uppercase tracking-wider">No Catalog Products Found</h3>
              <p className="text-xs text-muted mt-1">We couldn't find any items matching your category or search query.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {products.map((p, index) => (
                <div
                  key={p._id || p.id}
                  onClick={() => router.push(`/product/${p._id || p.id}`)}
                  className="card-soft flex flex-col h-full overflow-hidden group cursor-pointer hover:shadow-lift hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                >
                
                {/* Product Image */}
                <div className="relative aspect-[4/5] w-full bg-parchment-deep overflow-hidden">
                  <Image 
                    src={p.image_url} 
                    alt={p.title || p.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.08] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]" 
                  />

                </div>

                {/* Product Info */}
                <div className="p-4 md:p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-olive mb-2">
                      {p.category}
                    </span>
                    <h3 className="heading-sm text-[15px] md:text-[16px] group-hover:!text-terracotta-ink transition-colors line-clamp-2">
                      {p.title || p.name}
                    </h3>
                    <p className="text-[11px] md:text-[13px] text-muted mt-1.5 md:mt-2 leading-relaxed line-clamp-2 font-medium">
                      {p.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-bodytext mt-3 bg-parchment-deep px-2.5 py-1.5 rounded-full border border-line-soft">
                      <Truck className="w-3 h-3 text-olive" aria-hidden="true" />
                      {p.delivery_time || '5-7 working days'}
                    </span>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex flex-wrap items-end justify-between mt-auto pt-4 md:pt-5 gap-3">
                    {(() => {
                      const originalPrice = p.originalPrice ?? null;
                      const sellingPrice = p.sellingPrice ?? p.price ?? null;
                      
                      if (sellingPrice === null) return null;
                      
                      const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;
                      const discountPercent = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
                      
                      return (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-sans text-[20px] md:text-[22px] font-extrabold text-ink whitespace-nowrap tabular-nums tracking-[-0.01em]">
                              ₹{typeof sellingPrice === 'number' ? sellingPrice.toFixed(2) : parseFloat(sellingPrice).toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] font-medium text-muted line-through whitespace-nowrap decoration-line">
                                ₹{typeof originalPrice === 'number' ? originalPrice.toFixed(2) : parseFloat(originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                          {hasDiscount && discountPercent > 0 && (
                            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-terracotta-ink bg-terracotta/10 border border-terracotta/20 px-2 py-0.5 rounded-full mt-1 self-start whitespace-nowrap">
                              {discountPercent}% off
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <button
                        onClick={(e) => handleAddToCart(p, e)}
                        aria-label="Add to basket"
                        className="w-10 h-10 shrink-0 flex items-center justify-center border border-line rounded-full text-ink hover:text-terracotta hover:border-terracotta transition-colors active:scale-95"
                      >
                        <CartIcon className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={(e) => handleBuyNow(p, e)}
                        className="btn-pill btn-teal !px-5 !py-2.5 !text-[10px]"
                      >
                        Buy now
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger & Loading Indicator */}
          <div ref={lastElementRef} className="w-full flex flex-col items-center justify-center py-12 mt-4">
            {isFetchingMore && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-line border-t-terracotta rounded-full animate-spin" />
                <span className="text-[10px] font-bold tracking-[0.18em] text-teal uppercase">Loading more&hellip;</span>
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <span className="text-[10px] font-bold tracking-[0.18em] text-muted uppercase">You&rsquo;ve reached the end</span>
            )}
          </div>
          </>
        )}

      </main>

      {/* Direct Buy Checkout Modal */}
      {checkoutOpen && selectedProduct && (
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
                  onClose={() => { setCheckoutOpen(false); setCheckoutSuccess(false); }}
                  closeLabel="Close window"
                />
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  
                  {/* Order Summary box */}
                  <div className="p-4 bg-parchment-deep border border-line rounded-2xl">
                    <span className="text-[9px] font-black text-terracotta uppercase tracking-widest block mb-2">Order Summary</span>
                    <div className="flex justify-between items-center text-xs font-bold text-teal">
                      <span>{selectedProduct.title || selectedProduct.name}</span>
                      <span>₹{((selectedProduct.price || 0) * checkoutQuantity).toFixed(2)}</span>
                    </div>
                    
                    {/* Quantity selectors inside modal */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/50">
                      <span className="text-[10px] text-muted uppercase tracking-widest font-black">Quantity</span>
                      <div className="flex items-center border border-line rounded-lg overflow-hidden bg-white shadow-inner scale-90">
                        <button 
                          type="button"
                          onClick={() => setCheckoutQuantity(q => Math.max(1, q - 1))}
                          className="px-2 py-1 hover:bg-parchment-deep text-muted"
                        >
                          -
                        </button>
                        <span className="px-4 text-xs font-bold text-teal min-w-8 text-center">{checkoutQuantity}</span>
                        <button 
                          type="button"
                          onClick={() => setCheckoutQuantity(q => Math.min(10, q + 1))}
                          className="px-2 py-1 hover:bg-parchment-deep text-muted"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-muted mt-2 border-t border-line/50 pt-2">
                      <span>Shipping Method</span>
                      <span className="text-emerald-600 font-bold uppercase tracking-wider">Free Delivery</span>
                    </div>
                  </div>

                  {/* Customer details fields */}
                  <div>
                    <label htmlFor="shop-checkout-name" className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      id="shop-checkout-name"
                        autoComplete="name"
                        placeholder="e.g. John Doe"
                      value={checkoutFormData.name}
                      onChange={(e) => setCheckoutFormData({ ...checkoutFormData, name: e.target.value })}
                      className="w-full bg-parchment border border-line rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-teal focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="shop-checkout-email" className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        id="shop-checkout-email"
                        autoComplete="email"
                        placeholder="john@example.com"
                        value={checkoutFormData.email}
                        onChange={(e) => setCheckoutFormData({ ...checkoutFormData, email: e.target.value })}
                        className="w-full bg-parchment border border-line rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-teal focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="shop-checkout-mobile" className="text-[10px] font-bold uppercase tracking-widest text-teal block mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        id="shop-checkout-mobile"
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
                    amount={(selectedProduct?.price || 0) * checkoutQuantity}
                    upiId={storeSettings.upiId}
                  />

                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full btn-pill btn-teal !rounded-xl mt-6 disabled:opacity-50"
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
      <Footer />

    </div>
  );
}
