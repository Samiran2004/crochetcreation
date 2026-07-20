'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, User, LogOut, Menu, X, Search, Home, Instagram } from 'lucide-react';

export interface NavbarTheme {
  primary: string;
  primaryDark: string;
}

interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
  isNew?: boolean;
}

interface NavbarProps {
  themeColor: string;
  themeColors: Record<string, NavbarTheme>;
  onThemeChange: (color: string) => void;
  customLogo?: string;
  scrollY?: number;
  isScrolled?: boolean;
  showScrollEffect?: boolean;

  hideLinks?: boolean;
  currentPage?: string;
  // Auth state - null means logged out
  token?: string | null;
  userProfile?: { first_name?: string; last_name?: string; email?: string; is_admin?: boolean; picture?: string } | null;
  onLogout?: () => void;
  onOpenAuth?: () => void;
  // Cart
  cartItemsCount?: number;
  // Search
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  // Override classes
  className?: string;
  // Force opaque background (for shop, dashboard, product pages)
  alwaysOpaque?: boolean;
}

const THEME_COLORS_MAP: Record<string, { bg: string; hoverBg?: string; border: string }> = {
  rose: { bg: '#D9B4B4', border: '#FEF9F6' },
  mustard: { bg: '#E6C17A', border: '#FEF9F6' },
  green: { bg: '#A8BC98', border: '#FEF9F6' },
  teal: { bg: '#9CBEC2', border: '#FEF9F6' },
};

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/#home', isActive: false },
  { label: 'Shop', href: '/shop', isActive: false, isNew: true },
];

export default function Navbar({
  themeColor,
  themeColors,
  onThemeChange,
  customLogo,
  scrollY = 0,
  isScrolled: controlledScrolled,
  showScrollEffect = true,

  hideLinks = false,
  currentPage,
  token,
  userProfile,
  onLogout,
  onOpenAuth,
  cartItemsCount = 0,
  className = '',
  alwaysOpaque = false,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localCartCount, setLocalCartCount] = useState(cartItemsCount);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [localScrolled, setLocalScrolled] = useState(0);

  // Get active theme colors
  const activeTheme = themeColors[themeColor] || themeColors.rose || { primary: '#D9B4B4', primaryDark: '#6B5656' };

  // Determine if scrolled - support both controlled and uncontrolled
  const isScrolled = controlledScrolled !== undefined 
    ? controlledScrolled 
    : (showScrollEffect ? localScrolled > 20 : false);

  // Always show opaque background for pages that need it
  const bgColor = alwaysOpaque 
    ? `${activeTheme.primaryDark}E6` 
    : (isScrolled ? `${activeTheme.primaryDark}E6` : 'transparent');

  // Sync local cart count with global
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const syncCartCount = () => {
        const savedCount = localStorage.getItem('crochet_cart_count');
        if (savedCount !== null) {
          setLocalCartCount(parseInt(savedCount, 10));
        } else {
          setLocalCartCount(0);
        }
      };
      syncCartCount();
      window.addEventListener('cart-change', syncCartCount);
      return () => window.removeEventListener('cart-change', syncCartCount);
    }
  }, []);

  // Update when prop changes only if explicitly provided (ignoring defaults of 0 if local storage has more)
  useEffect(() => {
    if (cartItemsCount > 0) {
      setLocalCartCount(cartItemsCount);
    }
  }, [cartItemsCount]);

  // Local scroll tracking when not controlled
  useEffect(() => {
    if (!controlledScrolled && showScrollEffect) {
      const handleScroll = () => setLocalScrolled(window.scrollY);
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [controlledScrolled, showScrollEffect]);

  const openCart = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open-cart'));
    }
  };

  useEffect(() => {
    const handleOpenAuth = () => {
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        window.location.href = '/?login=true&redirect=' + encodeURIComponent(window.location.pathname);
      }
    };
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, [onOpenAuth]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    setIsMenuOpen(false);
  };

  // Determine active page for nav highlighting
  const getActiveLabel = () => {
    if (currentPage) return currentPage;
    const p = pathname || '';
    if (p === '/' || p.startsWith('/#')) return 'Home';
    if (p.startsWith('/shop') || p.startsWith('/product')) return 'Shop';
    if (p.startsWith('/dashboard')) return 'Dashboard';
    if (p.startsWith('/admin')) return 'Admin';
    if (p.startsWith('/masterclass')) return 'Masterclass';
    if (p.startsWith('/about')) return 'About';
    return '';
  };

  const activeLabel = getActiveLabel();

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-[#FEF9F6]/10 py-3'
            : 'bg-transparent py-5'
        } ${className}`}
        style={{
          backgroundColor: bgColor
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer select-none"
            onClick={(e) => {
              if (window.location.pathname === '/' && window.location.hash === '') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-full md:rounded-xl overflow-hidden border border-[#D9B4B4]/30 md:border-2 md:border-[#D9B4B4]/40 shadow-sm bg-white flex-shrink-0 group-hover:rotate-6 group-hover:scale-105 transition-all duration-300">
              <img
                src={customLogo || '/assets/crochet_creation_logo.png'}
                alt="Crochet Creation Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:block">
              <span className="text-base md:text-xl font-serif font-bold tracking-tight text-[#FEF9F6] block leading-tight">
                Crochet Creation
              </span>
              <span className="text-[7px] md:text-[8px] font-medium tracking-[0.25em] text-[#D9B4B4]/80 uppercase block -mt-0.5">
                Handcrafted with Love
              </span>
            </span>
            <span className="sm:hidden text-base md:text-lg font-serif font-bold text-[#FEF9F6]">Crochet Creation</span>
          </Link>

          {/* Desktop Nav Links */}
          {!hideLinks && (
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((item) => {
                const isActive = activeLabel.toUpperCase() === item.label.toUpperCase();
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 flex flex-col items-center group ${
                      isActive
                        ? 'text-[#D9B4B4]'
                        : 'text-[#FEF9F6]/80 hover:text-[#D9B4B4]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`absolute bottom-0 h-[2px] bg-[#D9B4B4] transition-all duration-300 rounded-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                    {item.isNew && (
                      <span className="absolute -top-1 -right-5 bg-[#D9B4B4] text-[#6B5656] text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-md">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-3">
            {!hideLinks && <div className="h-6 w-px bg-white/10"></div>}

            <a 
              href="https://www.instagram.com/crochet_creation_02?igsh=OGwybjc3emljMzB6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded-full text-[#FEF9F6]/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>

            {/* Cart Button */}
            <div
              id="header-cart-icon"
              onClick={openCart}
              className={`relative flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-all duration-300 text-[#FEF9F6]/80 hover:text-[#D9B4B4] ${
                cartBouncing ? 'scale-105 text-[#D9B4B4]' : ''
              }`}
            >
              <div className="relative">
                <ShoppingBag className={`w-5 h-5 ${cartBouncing ? 'animate-bounce' : ''}`} />
                {localCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D9B4B4] text-[#6B5656] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {localCartCount > 9 ? '9+' : localCartCount}
                  </span>
                )}
              </div>
            </div>

            {/* Auth Section */}
            {token && userProfile ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                {userProfile.is_admin && (
                  <Link
                    href="/admin/dashboard"
                    className="text-[9px] font-black bg-[#D9B4B4]/20 hover:bg-[#D9B4B4]/30 text-[#D9B4B4] px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all duration-300 border border-[#D9B4B4]/10"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 hover:text-[#D9B4B4] transition-all text-[11px] font-semibold text-[#FEF9F6]/90"
                >
                  {userProfile.picture ? (
                    <img src={userProfile.picture} alt="Profile" className="w-5 h-5 rounded-full border border-[#D9B4B4]/30 object-cover shadow-sm" />
                  ) : (
                    <span className="text-[12px]">👋</span>
                  )}
                  <span className="tracking-wide">{userProfile.first_name || 'User'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[#FEF9F6]/60 hover:text-[#D9B4B4] transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth();
                  } else {
                    router.push('/?login=true&redirect=' + encodeURIComponent(window.location.pathname));
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#FEF9F6]/80 hover:text-[#D9B4B4] transition-all duration-300 text-[11px] font-bold uppercase tracking-widest border-l border-white/10 pl-4 ml-2"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}


          </div>

          {/* Mobile Right Action Bar (visible on mobile only, < md) */}
          <div className="flex md:hidden items-center gap-2">
            {token && userProfile ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#FEF9F6]/95 bg-white/10 pl-1.5 pr-3 py-1 rounded-full border border-white/10 select-none shadow-sm">
                {userProfile.picture ? (
                  <img src={userProfile.picture} alt="Profile" className="w-5 h-5 rounded-full border border-white/20 object-cover" />
                ) : (
                  <span className="text-[12px]">👋</span>
                )}
                <span className="tracking-wide">{userProfile.first_name || 'Me'}</span>
              </span>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else router.push('/?login=true');
                }}
                className="flex items-center justify-center p-2 text-[#FEF9F6] hover:text-[#D9B4B4] min-w-[44px] min-h-[44px]"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Tablet/Medium Screen Icons (visible only on md to lg screens) */}
          <div className="hidden md:flex lg:hidden items-center gap-3">
            <a 
              href="https://www.instagram.com/crochet_creation_02?igsh=OGwybjc3emljMzB6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#FEF9F6] hover:text-[#D9B4B4] transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <div
              id="mobile-cart-icon-header"
              onClick={openCart}
              className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer transition-transform duration-300 ${cartBouncing ? 'scale-110' : ''}`}
            >
              <ShoppingBag className={`w-5 h-5 text-[#D9B4B4] ${cartBouncing ? 'animate-bounce' : ''}`} />
              {localCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D9B4B4] text-[#6B5656] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {localCartCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#FEF9F6] hover:text-[#D9B4B4] transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-[60] flex flex-col pt-20 pb-8 px-6 text-sm font-semibold tracking-widest uppercase text-center backdrop-blur-xl transition-all animate-in fade-in duration-200"
            style={{
              backgroundColor: `${activeTheme.primaryDark}F5`
            }}
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-5 right-5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#FEF9F6] hover:text-[#D9B4B4] transition-colors"
            >
              <X className="w-7 h-7" />
            </button>

            <nav className="flex flex-col items-center gap-1 flex-1 justify-center">
              <Link href="/#home" onClick={() => setIsMenuOpen(false)} className="w-full py-4 min-h-[48px] flex items-center justify-center hover:text-[#D9B4B4] hover:bg-white/5 rounded-xl transition-all text-[#FEF9F6] text-base tracking-[0.2em]">HOME</Link>
              <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="w-full py-4 min-h-[48px] flex items-center justify-center hover:text-[#D9B4B4] hover:bg-white/5 rounded-xl transition-all text-[#FEF9F6] text-base tracking-[0.2em]">SHOP</Link>
            </nav>

            <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#FEF9F6]/10 text-[#FEF9F6]">
              <div
                id="mobile-cart-icon"
                onClick={() => {
                  setIsMenuOpen(false);
                  openCart();
                }}
                className={`flex items-center gap-1.5 cursor-pointer transition-transform duration-300 ${cartBouncing ? 'scale-110 text-[#D9B4B4]' : ''}`}
              >
                <ShoppingBag className="w-4 h-4 text-[#D9B4B4]" />
                <span>{localCartCount} items</span>
              </div>
              <span className="text-white/30">|</span>
              <a 
                href="https://www.instagram.com/crochet_creation_02?igsh=OGwybjc3emljMzB6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#D9B4B4] hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <span className="text-white/30">|</span>
              {token && userProfile ? (
                <div className="flex items-center gap-2">
                  {userProfile.is_admin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-[9px] bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white px-2 py-1 rounded font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      Admin
                    </Link>
                  )}
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-[10px] font-bold uppercase tracking-wider text-stone-300 hover:text-white transition-colors">
                    Hi, {userProfile.first_name}
                  </Link>
                  <button onClick={handleLogout} className="hover:text-[#D9B4B4] transition-colors p-1" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                    else router.push('/?login=true');
                  }}
                  className="hover:text-[#D9B4B4] transition-colors p-1 flex items-center gap-1"
                >
                  <User className="w-4 h-4" />
                  <span className="text-[10px] font-bold">LOGIN</span>
                </button>
              )}
            </div>


          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-md border-t border-white/10 z-[140] flex justify-around items-center py-2 pb-safe-bottom shadow-[0_-2px_15px_rgba(0,0,0,0.15)] select-none">
        <Link 
          href="/" 
          className="flex flex-col items-center gap-1 text-[#FEF9F6]/70 hover:text-[#FEF9F6] active:scale-95 transition-all py-1 px-3"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <Home className={`w-5 h-5 ${pathname === '/' ? 'text-[#D9B4B4]' : 'text-[#FEF9F6]/70'}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
        </Link>
        
        <Link 
          href="/shop" 
          className="flex flex-col items-center gap-1 text-[#FEF9F6]/70 hover:text-[#FEF9F6] active:scale-95 transition-all py-1 px-3"
        >
          <Search className={`w-5 h-5 ${pathname?.startsWith('/shop') ? 'text-[#D9B4B4]' : 'text-[#FEF9F6]/70'}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Shop</span>
        </Link>
        
        <button 
          onClick={openCart} 
          className="relative flex flex-col items-center gap-1 text-[#FEF9F6]/70 hover:text-[#FEF9F6] active:scale-95 transition-all py-1 px-3"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-[#FEF9F6]/70" />
            {localCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#D9B4B4] text-[#6B5656] text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {localCartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider">Cart</span>
        </button>
        
        {token && userProfile ? (
          <Link 
            href={userProfile.is_admin ? '/admin/dashboard' : '/dashboard'} 
            className="flex flex-col items-center gap-1 text-[#FEF9F6]/70 hover:text-[#FEF9F6] active:scale-95 transition-all py-1 px-3"
          >
            <User className={`w-5 h-5 ${pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') ? 'text-[#D9B4B4]' : 'text-[#FEF9F6]/70'}`} />
            <span className="text-[9px] font-black uppercase tracking-wider">Profile</span>
          </Link>
        ) : (
          <button 
            onClick={() => {
              if (onOpenAuth) onOpenAuth();
              else router.push('/?login=true');
            }} 
            className="flex flex-col items-center gap-1 text-[#FEF9F6]/70 hover:text-[#FEF9F6] active:scale-95 transition-all py-1 px-3"
          >
            <User className="w-5 h-5 text-[#FEF9F6]/70" />
            <span className="text-[9px] font-black uppercase tracking-wider">Profile</span>
          </button>
        )}
      </div>
    </>
  );
}