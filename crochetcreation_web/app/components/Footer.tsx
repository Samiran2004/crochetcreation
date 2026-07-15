"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../utils/apiFetch';

interface FooterData {
  aboutText: string;
  email: string;
  hours: string;
  copyrightText: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData>({
    aboutText: "We design and craft premium, customized wool and cotton products, bringing warm smiles and authentic handmade joy to your homes.",
    email: "contact@crochetcreation.in",
    hours: "Mon - Sat, 9:00 AM - 6:00 PM",
    copyrightText: "Crochet Creation. All rights reserved.",
  });

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        let API_URL = 'http://localhost:8000';
        if (process.env.NEXT_PUBLIC_API_URL) {
          API_URL = process.env.NEXT_PUBLIC_API_URL;
        } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          API_URL = 'https://crochetcreation.onrender.com';
        }
        
        const res = await apiFetch(`${API_URL}/api/settings/`);
        if (res.ok) {
          const data = await res.json();
          setFooterData(prev => ({
            ...prev,
            aboutText: data.footer_about_text ?? prev.aboutText,
            email: data.footer_email ?? prev.email,
            hours: data.footer_hours ?? prev.hours,
            copyrightText: data.footer_copyright_text ?? prev.copyrightText,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch footer data from backend:", err);
      }
    };
    fetchFooterData();
  }, []);

  return (
    <footer className="bg-stone-900 text-stone-400 py-16 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Crochet Creation</h4>
          <p className="text-xs leading-relaxed">
            {footerData.aboutText}
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
            Email: {footerData.email}<br />
            Hours: {footerData.hours}
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
        <p>&copy; {new Date().getFullYear()} {footerData.copyrightText}</p>
      </div>
    </footer>
  );
}
