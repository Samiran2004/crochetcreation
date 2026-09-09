'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, User, LogOut, Menu, X, Instagram, LayoutDashboard, ChevronRight } from 'lucide-react';
import { apiFetch, getApiUrl, clearSession } from '../utils/apiFetch';

/**
 * The single site-wide navigation bar.
 *
 * It owns everything it displays — session, cart count and the studio logo —
 * rather than taking them as props. Previously each page passed its own
 * subset (the videos page passed no logo at all, so it rendered a different
 * mark), which made the header visibly different from screen to screen.
 * Now every page renders `<Navbar />` and they are guaranteed identical.
 */

/* Kept exported: other modules still import this type. */
export interface NavbarTheme {
  primary: string;
  primaryDark: string;
}

interface NavbarProps {
  /** Force the solid bar on pages with no light hero behind the header. */
  alwaysOpaque?: boolean;
  className?: string;
}

interface NavLink {
  label: string;
  href: string;
  isNew?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop', isNew: true },
  { label: 'Videos', href: '/videos' },
];

const INSTAGRAM_URL = 'https://www.instagram.com/crochet__creation__/';
const LOGO_FALLBACK = '/assets/crochet_creation_logo.png';

/* The logo is identical on every route, so resolve it once per page load and
   remember it across visits — otherwise the first page painted shows the
   bundled mark and visibly swaps once the settings request lands. */
const LOGO_STORAGE_KEY = 'cc_logo_url';
let logoCache: string | null = null;

const readStoredLogo = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY);
  } catch {
    return null;
  }
};

export default function Navbar({ alwaysOpaque = false, className = '' }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [logo, setLogo] = useState<string>(logoCache ?? LOGO_FALLBACK);
  const [session, setSession] = useState<{ token: string | null; user: any | null }>({
    token: null,
    user: null,
  });

  const solid = alwaysOpaque || scrolled;

  /* ── Session, read from storage and kept in sync ─────────────── */
  const readSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    let user: any = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) user = JSON.parse(raw);
    } catch {
      /* a corrupt cache just reads as "signed out" for the header */
    }
    setSession({ token, user });
  }, []);

  useEffect(() => {
    readSession();
    // `storage` covers other tabs; the custom event covers this one.
    window.addEventListener('storage', readSession);
    window.addEventListener('session-change', readSession);
    return () => {
      window.removeEventListener('storage', readSession);
      window.removeEventListener('session-change', readSession);
    };
  }, [readSession]);

  /* Re-read on navigation so signing in on one page updates the header. */
  useEffect(() => { readSession(); }, [pathname, readSession]);

  /* ── Cart badge ──────────────────────────────────────────────── */
  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem('crochet_cart_count');
      setCartCount(saved ? parseInt(saved, 10) || 0 : 0);
    };
    sync();
    window.addEventListener('cart-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cart-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  /* ── Studio logo ─────────────────────────────────────────────── */
  useEffect(() => {
    // Paint the last known logo immediately, then confirm it in the background.
    const stored = logoCache ?? readStoredLogo();
    if (stored) { logoCache = stored; setLogo(stored); }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/settings/homepage-images`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const url = data?.logo?.url;
        if (!url || cancelled || url === logoCache) return;
        logoCache = url;
        setLogo(url);
        try { localStorage.setItem(LOGO_STORAGE_KEY, url); } catch { /* private mode */ }
      } catch {
        /* the bundled mark is a perfectly good fallback */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Scroll state ────────────────────────────────────────────── */
  useEffect(() => {
    if (alwaysOpaque) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [alwaysOpaque]);

  /* ── Mobile sheet ────────────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /* ── Actions ─────────────────────────────────────────────────── */
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const openCart = () => window.dispatchEvent(new Event('open-cart'));

  const handleLogout = () => {
    clearSession();
    setSession({ token: null, user: null });
    setCartCount(0);
    window.dispatchEvent(new Event('session-change'));
    setMenuOpen(false);
    router.replace('/');
  };

  const openAuth = () => {
    setMenuOpen(false);
    // The sign-in sheet lives on the home page; ask for it, and navigate there
    // if this route has no listener.
    let handled = false;
    const mark = () => { handled = true; };
    window.addEventListener('auth-modal-opened', mark);
    window.dispatchEvent(new Event('open-auth-modal'));
    window.setTimeout(() => {
      window.removeEventListener('auth-modal-opened', mark);
      if (!handled) {
        const back = window.location.pathname + window.location.search;
        router.push(`/?login=true&redirect=${encodeURIComponent(back)}`);
      }
    }, 0);
  };

  const { token, user } = session;
  const signedIn = Boolean(token && user);

  const linkTone = solid ? 'text-ondark-muted hover:text-ondark' : 'text-ink/75 hover:text-ink';
  const iconTone = solid ? 'text-ondark-muted hover:text-ondark' : 'text-ink/70 hover:text-terracotta-ink';

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-[background-color,box-shadow] duration-500 ${
          solid ? 'bg-teal-weave shadow-panel' : 'bg-transparent'
        } ${className}`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 md:h-20 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="Crochet Creation — home">
            <span className="relative w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden ring-1 ring-line/60 bg-parchment-card shrink-0 transition-transform duration-500 group-hover:rotate-[8deg]">
              {/* Crossfade rather than a hard swap: on a first visit the studio
                  logo arrives from settings a moment after the bundled mark. */}
              <Image
                key={logo}
                src={logo}
                alt=""
                fill
                sizes="44px"
                priority
                className="object-cover animate-fade-in"
              />
            </span>
            <span className="flex flex-col leading-none">
              <span
                className={`font-display text-[17px] md:text-[22px] tracking-[-0.018em] transition-colors duration-500 ${
                  solid ? 'text-ondark' : 'text-ink'
                }`}
              >
                Crochet Creation
              </span>
              <span
                className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.24em] mt-1 transition-colors duration-500 ${
                  solid ? 'text-ondark-muted' : 'text-bodytext'
                }`}
              >
                Handcrafted with love
              </span>
            </span>
          </Link>

          {/* Centre links */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`relative text-[11px] font-bold uppercase tracking-[0.18em] transition-colors py-2 group ${
                  isActive(l.href) ? (solid ? 'text-ondark' : 'text-terracotta-ink') : linkTone
                }`}
              >
                {l.label}
                {l.isNew && (
                  <span className="absolute -top-2 -right-7 bg-terracotta-deep text-[8px] font-black text-[#FFF7EC] px-1.5 py-0.5 rounded-full tracking-[0.08em]">
                    NEW
                  </span>
                )}
                {/* Underline sweeps out from the centre on hover, locked open when active. */}
                <span
                  className={`absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full origin-center transition-transform duration-300 ${
                    solid ? 'bg-ondark' : 'bg-terracotta-ink'
                  } ${isActive(l.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                />
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Crochet Creation on Instagram"
              className={`hidden sm:flex w-11 h-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 ${iconTone}`}
            >
              <Instagram className="w-[18px] h-[18px]" />
            </a>

            <button
              onClick={openCart}
              aria-label={`Open basket, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
              className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${iconTone}`}
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 bg-terracotta-deep text-[#FFF7EC] text-[9px] font-black rounded-full flex items-center justify-center animate-pop"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {signedIn ? (
              <div className="hidden md:flex items-center gap-1 pl-2 ml-0.5 border-l border-current/15">
                <Link
                  href={user.is_admin ? '/admin/dashboard' : '/dashboard'}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-full transition-colors ${linkTone}`}
                >
                  {user.picture ? (
                    <Image src={user.picture} alt="" width={26} height={26} className="rounded-full object-cover" />
                  ) : (
                    <span className="w-[26px] h-[26px] rounded-full bg-terracotta-deep text-[#FFF7EC] text-[10px] font-black flex items-center justify-center">
                      {(user.first_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-[11px] font-bold tracking-wide max-w-[90px] truncate">
                    {user.first_name || 'Account'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 ${iconTone}`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={openAuth} className="hidden md:inline-flex btn-pill btn-terracotta !px-5 !py-2.5 !text-[10px]">
                <User className="w-3.5 h-3.5" />
                Sign in
              </button>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={`lg:hidden w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${iconTone}`}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile sheet ───────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="absolute inset-0 bg-teal-deep/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute top-0 right-0 h-[100dvh] w-[88%] max-w-sm bg-paper shadow-panel
            flex flex-col transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]
            ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-line-soft shrink-0">
            <span className="heading-sm text-[17px]">Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="w-11 h-11 flex items-center justify-center rounded-full text-ink/70 hover:text-terracotta-ink active:scale-90 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 flex flex-col gap-1.5">
            {NAV_LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ transitionDelay: menuOpen ? `${80 + i * 60}ms` : '0ms' }}
                className={`flex items-center justify-between px-4 py-4 rounded-2xl font-display text-lg
                  transition-all duration-500 ${menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                  ${isActive(l.href) ? 'bg-terracotta-deep text-[#FFF7EC]' : 'text-ink hover:bg-parchment-deep'}`}
              >
                <span className="flex items-center gap-2">
                  {l.label}
                  {l.isNew && (
                    <span
                      className={`text-[8px] font-black uppercase tracking-[0.14em] px-2 py-1 rounded-full ${
                        isActive(l.href) ? 'bg-[#FFF7EC]/25 text-[#FFF7EC]' : 'bg-terracotta/12 text-terracotta-ink'
                      }`}
                    >
                      New
                    </span>
                  )}
                </span>
                <ChevronRight className="w-4 h-4 opacity-50" aria-hidden="true" />
              </Link>
            ))}

            <span className="chain-rule my-5 opacity-60" aria-hidden="true" />

            {signedIn ? (
              <>
                <Link
                  href={user.is_admin ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center gap-3 px-4 py-4 rounded-2xl text-ink hover:bg-parchment-deep transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-terracotta-ink" />
                  <span className="font-semibold text-sm">
                    {user.is_admin ? 'Admin dashboard' : 'My orders'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-4 rounded-2xl text-terracotta-ink hover:bg-terracotta/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-semibold text-sm">Log out</span>
                </button>
              </>
            ) : (
              <button onClick={openAuth} className="btn-pill btn-terracotta w-full mt-1">
                <User className="w-3.5 h-3.5" />
                Sign in
              </button>
            )}
          </nav>

          <div className="px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-line-soft shrink-0 flex items-center justify-between gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold text-bodytext hover:text-terracotta-ink transition-colors"
            >
              <Instagram className="w-4 h-4" />
              @crochet__creation__
            </a>
            <button
              onClick={() => { setMenuOpen(false); openCart(); }}
              className="flex items-center gap-2 text-xs font-semibold text-ink hover:text-terracotta-ink transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Basket ({cartCount})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
