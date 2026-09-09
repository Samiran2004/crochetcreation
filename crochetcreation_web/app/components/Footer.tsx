"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch, getApiUrl } from '../utils/apiFetch';
import { Instagram, Mail, Clock, ArrowRight, Heart } from 'lucide-react';
import { Sprig, YarnBall } from './decor/Botanicals';
import OrganicEdge from './ui/OrganicEdge';

interface FooterData {
  aboutText: string;
  email: string;
  hours: string;
  copyrightText: string;
}

const INSTAGRAM_URL = 'https://www.instagram.com/crochet__creation__/';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/shop' },
      { label: 'Videos', href: '/videos' },
      { label: 'My Orders', href: '/dashboard' },
    ],
  },
  {
    title: 'Info',
    links: [
      { label: 'About Us', href: '/#about' },
      { label: 'Our Process', href: '/#process' },
      { label: 'Custom Orders', href: '/#custom' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
];

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData>({
    aboutText:
      'We design and craft premium, customized wool and cotton products, bringing warm smiles and authentic handmade joy to your homes.',
    email: 'contact@crochetcreation.in',
    hours: 'Mon - Sat, 9:00 AM - 6:00 PM',
    copyrightText: 'Crochet Creation. All rights reserved.',
  });

  useEffect(() => {
    let cancelled = false;
    const fetchFooterData = async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/settings/`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setFooterData((prev) => ({
          aboutText: data.footer_about_text ?? prev.aboutText,
          email: data.footer_email ?? prev.email,
          hours: data.footer_hours ?? prev.hours,
          copyrightText: data.footer_copyright_text ?? prev.copyrightText,
        }));
      } catch {
        /* keep the defaults — the footer must always render */
      }
    };
    fetchFooterData();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <OrganicEdge variant="hill" from="var(--terracotta-deep)" fill="var(--teal)" height={70} />

      <footer id="contact" className="bg-teal-weave text-ondark-muted relative overflow-hidden">
        {/* Quiet botanical marks in the corners. */}
        <Sprig className="absolute top-10 right-6 w-40 h-auto opacity-[0.10] hidden md:block" color="#F6EEDF" />
        <YarnBall className="absolute -bottom-4 left-4 w-28 h-auto opacity-[0.08] hidden lg:block" color="#F6EEDF" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 pt-14 md:pt-20 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-4 space-y-5">
              <Link href="/" className="flex items-center gap-3" aria-label="Crochet Creation — home">
                <span className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-ondark/20 shrink-0">
                  <Image
                    src="/assets/crochet_creation_logo.png"
                    alt="Crochet Creation"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-display text-[24px] text-ondark tracking-[-0.018em]">Crochet Creation</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-ondark-muted mt-1.5">
                    Handcrafted with love
                  </span>
                </span>
              </Link>

              <p className="text-[13px] leading-relaxed text-ondark-muted/90 max-w-sm">
                {footerData.aboutText}
              </p>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[12px] font-semibold text-ondark-muted hover:text-ondark transition-colors group"
              >
                <span className="w-9 h-9 rounded-full border border-ondark/20 flex items-center justify-center group-hover:border-ondark/50 transition-colors">
                  <Instagram className="w-[15px] h-[15px]" />
                </span>
                @crochet__creation__
              </a>
            </div>

            {/* Link columns */}
            {COLUMNS.map((col) => (
              <div key={col.title} className="md:col-span-2">
                <h4 className="heading-sm text-[15px] !text-ondark mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-ondark-muted/85 hover:text-ondark transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Stay in touch */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="heading-sm text-[15px] !text-ondark">Stay in the loop</h4>
              <p className="text-[13px] leading-relaxed text-ondark-muted/90">
                New drops, restocks and behind-the-scenes from the workshop — straight to your inbox.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // No mailing-list backend yet, so send the enquiry where the
                  // shop already talks to customers rather than silently failing.
                  const input = (e.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value ?? '';
                  const msg = `Hello! Please add me to the Crochet Creation updates list.\nEmail: ${input}`;
                  window.open(`https://wa.me/917551041853?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
                }}
                className="flex items-center gap-2 bg-teal-deep/60 border border-ondark/15 rounded-full p-1.5 pl-4 focus-within:border-ondark/40 transition-colors"
              >
                <label htmlFor="footer-email" className="sr-only">Your email address</label>
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Your email address"
                  className="flex-1 min-w-0 bg-transparent text-[13px] text-ondark placeholder:text-ondark-muted/55 outline-none py-2"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to updates"
                  className="w-9 h-9 rounded-full bg-terracotta-deep hover:bg-[#8E4522] text-[#FFF7EC] flex items-center justify-center transition-colors shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-1.5 pt-1">
                <p className="flex items-center gap-2 text-[12px] text-ondark-muted/85">
                  <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="break-all">{footerData.email}</span>
                </p>
                <p className="flex items-center gap-2 text-[12px] text-ondark-muted/85">
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {footerData.hours}
                </p>
              </div>
            </div>
          </div>

          {/* Base line */}
          <div className="mt-12 pt-6 border-t border-ondark/12 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-ondark-muted/70 text-center sm:text-left">
              © {new Date().getFullYear()} {footerData.copyrightText}
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-ondark-muted/70">
              Made with <Heart className="w-3 h-3 fill-terracotta-soft text-terracotta-soft" aria-hidden="true" /> in a cosy little studio
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
