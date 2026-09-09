'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Inertial page scrolling.
 *
 * Lenis drives the native scroll position (rather than transforming a wrapper),
 * so `position: fixed` headers, anchor links and `window.scrollY` all keep
 * working — and Framer Motion's scroll hooks stay in sync for free.
 *
 * Anyone who has asked their system for less motion gets the untouched native
 * scroll instead.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    // Coarse pointers already have excellent native inertia; layering Lenis on
    // top of it fights the platform and feels laggy on low-end phones.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // The admin shell is a fixed-height app frame: the document itself never
    // scrolls, the panes inside do. Lenis swallows wheel events and drives
    // window.scrollTo, which moves nothing there — so the whole panel would
    // appear frozen. Storefront routes only.
    if (pathname?.startsWith('/admin')) return;

    let lenis: any;
    let frame = 0;
    let cancelled = false;

    (async () => {
      try {
        const { default: Lenis } = await import('lenis');
        if (cancelled) return;

        lenis = new Lenis({
          duration: 1.05,
          // Gentle exponential ease-out — settles without feeling slippery.
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.6,
        });

        const raf = (time: number) => {
          lenis.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);

        // In-page anchors should glide rather than jump.
        const onClick = (e: MouseEvent) => {
          const el = (e.target as HTMLElement)?.closest?.('a[href^="#"], a[href*="/#"]');
          if (!el) return;
          const href = el.getAttribute('href') || '';
          const hash = href.slice(href.indexOf('#'));
          if (hash.length < 2) return;
          const target = document.querySelector(hash);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target as HTMLElement, { offset: -88 });
        };
        document.addEventListener('click', onClick);
        (lenis as any).__onClick = onClick;
      } catch {
        /* Without Lenis the page simply scrolls natively. */
      }
    })();

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      if (lenis) {
        if ((lenis as any).__onClick) document.removeEventListener('click', (lenis as any).__onClick);
        lenis.destroy();
      }
    };
  }, [pathname]);

  // Land at the top on every route change, matching native navigation.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
