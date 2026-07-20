'use client';
import { apiFetch } from '../../utils/apiFetch';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, 
  RefreshCw, 
  Trash2, 
  Eye, 
  Check, 
  Settings, 
  Monitor, 
  Sparkles,
  Smartphone,
  Tablet,
  Laptop,
  ArrowRight,
  Heart,
  ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CloudinaryImage {
  url: string;
  public_id: string;
}

type ImageMap = Record<string, CloudinaryImage | null>;

const SECTIONS_CONFIG = [
  {
    key: 'logo',
    name: 'Store Navigation Logo',
    description: 'Header and footer branding logo. Recommended size: 200x50px (transparent PNG).',
    fallback: '/assets/crochet_creation_logo.png'
  },
  {
    key: 'heroYarn',
    name: 'Hero Section Yarn Card',
    description: 'Main visual highlight in the hero banner showcasing colorful yarn loops. Recommended size: 800x800px.',
    fallback: '/assets/marilyn_hero_yarn.png'
  },
  {
    key: 'craftingTools',
    name: 'Secondary Crafting Tools Section',
    description: 'Illustrative card representing hook needles, measuring tapes, and knit accessories. Recommended size: 600x600px.',
    fallback: '/assets/marilyn_crafting_tools.png'
  },
  {
    key: 'stackedSweaters',
    name: 'Contextual Stacked Sweaters Card',
    description: 'Showcases the quality and softness of finished garments. Recommended size: 600x600px.',
    fallback: '/assets/marilyn_stacked_sweaters.png'
  },
  {
    key: 'womanKnitting',
    name: 'Artisan Hands Knitting Section',
    description: 'Expresses direct craft and premium handmaking values. Recommended size: 800x800px.',
    fallback: '/assets/marilyn_woman_knitting.png'
  },
  {
    key: 'knitTexture',
    name: 'Close-up Knit Texture Details',
    description: 'Background or accent image displaying raw knitted wool loops. Recommended size: 500x500px.',
    fallback: '/assets/marilyn_knit_texture.png'
  },
  {
    key: 'customerAlice',
    name: 'Testimonial Profile Picture',
    description: 'Profile highlight image for customer Alice on the feedback slider. Recommended size: 150x150px (square).',
    fallback: '/assets/marilyn_customer_alice.png'
  }
];

export default function AdminCustomizer() {
  const router = useRouter();
  const [images, setImages] = useState<ImageMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'preview'>('manage');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  const fetchImages = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/settings/homepage-images`);
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      } else {
        setError("Failed to fetch homepage settings.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [API_URL]);

  const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local object URL for instant preview update
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviews(prev => ({ ...prev, [key]: objectUrl }));

    // Auto upload
    setUploadingKey(key);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const formData = new FormData();
      formData.append('section', key);
      formData.append('file', file);

      const res = await apiFetch(`${API_URL}/api/settings/homepage-images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setImages(data);
        // Clean local preview since server responded with real URL
        setLocalPreviews(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      } else {
        const errData = await res.json();
        setError(errData.detail || `Failed to upload image for ${key}.`);
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred during upload.");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleReset = async (key: string) => {
    if (!confirm(`Are you sure you want to reset the ${key} section to its default image?`)) {
      return;
    }

    setResettingKey(key);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const formData = new FormData();
      formData.append('section', key);

      const res = await apiFetch(`${API_URL}/api/settings/homepage-images/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setImages(data);
        setLocalPreviews(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      } else {
        const errData = await res.json();
        setError(errData.detail || `Failed to reset image for ${key}.`);
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred during reset.");
    } finally {
      setResettingKey(null);
    }
  };

  const getSectionSrc = (key: string, fallback: string) => {
    if (localPreviews[key]) return localPreviews[key];
    if (images[key] && images[key]?.url) return images[key]?.url || fallback;
    return fallback;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#6B5656] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Loading Assets Configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-stone-200 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[#6B5656]">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#D9B4B4]/20 px-2.5 py-1 rounded-full">Artisan Module</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-850 mt-1">Homepage Image Customizer</h2>
          <p className="text-xs text-stone-450 mt-1">
            Seamlessly upload, refresh, and purge homepage banner and showcase images with live storefront viewport validation.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-[#F7F5F2] border border-stone-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'manage' ? 'bg-white text-[#6B5656] shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Configure
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'preview' ? 'bg-white text-[#6B5656] shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Live Preview
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2">
          ⚠️ {error}
        </div>
      )}

      {activeTab === 'manage' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Settings Lists */}
          <div className="xl:col-span-2 space-y-6">
            {SECTIONS_CONFIG.map((config) => {
              const hasCustomImage = !!(images[config.key] && images[config.key]?.url);
              const previewSrc = getSectionSrc(config.key, config.fallback);
              const isUploading = uploadingKey === config.key;
              const isResetting = resettingKey === config.key;

              return (
                <div 
                  key={config.key} 
                  className="bg-white border border-stone-200 hover:border-stone-300 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 transition-all"
                >
                  {/* Thumbnail display */}
                  <div className="w-full md:w-44 h-44 shrink-0 rounded-2xl border border-stone-100 bg-[#FDFBF9] overflow-hidden relative group flex items-center justify-center">
                    <img 
                      src={previewSrc} 
                      alt={config.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Fallback indicator */}
                    {!hasCustomImage && !localPreviews[config.key] && (
                      <span className="absolute bottom-2.5 left-2.5 bg-stone-900/60 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                        Default Fallback
                      </span>
                    )}

                    {localPreviews[config.key] && (
                      <span className="absolute bottom-2.5 left-2.5 bg-amber-600/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                        Unsaved Preview
                      </span>
                    )}
                  </div>

                  {/* Actions & Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-sm font-bold text-stone-800">{config.name}</h3>
                        <code className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                          {config.key}
                        </code>
                      </div>
                      <p className="text-xs text-stone-550 leading-relaxed">{config.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {/* Upload Button */}
                      <label className={`cursor-pointer inline-flex items-center gap-2 bg-[#6B5656] hover:bg-[#584646] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                        isUploading ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(config.key, e)}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>

                      {/* Reset to Default Button */}
                      {hasCustomImage && (
                        <button
                          onClick={() => handleReset(config.key)}
                          disabled={isResetting}
                          className={`inline-flex items-center gap-2 border border-stone-250 hover:bg-stone-50 text-stone-600 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                            isResetting ? 'opacity-50' : ''
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-red-500" />
                          {isResetting ? 'Resetting...' : 'Reset to Default'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick instructions sidebar panel */}
          <div className="space-y-6">
            <div className="bg-[#FEF9F6] border border-[#D9B4B4]/40 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#6B5656]">
                <Settings className="w-5 h-5" />
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider">Cloudinary Integration</h4>
              </div>
              <p className="text-xs text-stone-550 leading-relaxed">
                When you upload a new image, it will be automatically uploaded to Cloudinary, and saved directly to the database. 
              </p>
              <div className="p-3 bg-white border border-stone-100 rounded-2xl text-[11px] text-stone-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#6B5656]" />
                  <span>Old assets are safely purged from Cloudinary.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#6B5656]" />
                  <span>Images update instantly on the main page.</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">Need to preview?</h4>
              <p className="text-xs text-stone-450 leading-relaxed">
                Click the <strong>Live Preview</strong> tab above to view a responsive mockup of the homepage featuring your newly set assets side-by-side.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Preview tab */
        <div className="space-y-4">
          {/* Device toggle buttons */}
          <div className="flex items-center justify-between bg-white px-6 py-3 border border-stone-200 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Device Viewport Simulator:</span>
            <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded-md transition-all ${
                  previewDevice === 'mobile' ? 'bg-white text-[#6B5656] shadow-sm' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-2 rounded-md transition-all ${
                  previewDevice === 'tablet' ? 'bg-white text-[#6B5656] shadow-sm' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded-md transition-all ${
                  previewDevice === 'desktop' ? 'bg-white text-[#6B5656] shadow-sm' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Desktop View"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="flex justify-center bg-stone-100 border border-stone-250 rounded-3xl p-6 md:p-10 min-h-[70vh] overflow-x-auto">
            <div 
              className={`bg-[#FEF9F6] border border-stone-300 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 flex flex-col ${
                previewDevice === 'mobile' ? 'w-[375px] h-[667px]' :
                previewDevice === 'tablet' ? 'w-[768px] h-[1024px]' :
                'w-full max-w-5xl h-[700px]'
              }`}
            >
              {/* Browser Bar */}
              <div className="bg-stone-100 border-b border-stone-250 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>
                <div className="flex-1 bg-white border border-stone-200 rounded-md py-0.5 text-center text-[10px] text-stone-400 font-mono truncate select-none mx-6">
                  https://crochetcreation.samiransamanta.in/
                </div>
              </div>

              {/* Mock Storefront Content */}
              <div className="flex-1 overflow-y-auto space-y-12 pb-16 scrollbar-thin select-none">
                
                {/* 1. Header Navigation */}
                <header className="px-6 py-4 bg-transparent border-b border-stone-200/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={getSectionSrc('logo', '/assets/crochet_creation_logo.png')} 
                      alt="Logo" 
                      className="h-8 object-contain"
                    />
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                    <span className="text-[#6B5656]">Home</span>
                    <span>Collection</span>
                    <span>Custom Craft</span>
                    <span>About</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-stone-600" />
                  </div>
                </header>

                {/* 2. Hero Section Banner */}
                <section className="px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D9B4B4] bg-[#D9B4B4]/10 px-3 py-1 rounded-full">
                      100% Handmade Quality
                    </span>
                    <h1 className="font-serif text-3xl font-bold text-stone-850 leading-tight">
                      Crafting Cozy Crochet Stories
                    </h1>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Custom, high-quality crochet toys, wear, and gifts hand-stitched with premium cotton yarns.
                    </p>
                    <button className="bg-[#6B5656] text-white text-[10px] font-bold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2">
                      Browse Collection <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative aspect-square max-w-[350px] mx-auto w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-[32px] p-6 shadow-md flex items-center justify-center">
                    <img
                      src={getSectionSrc('heroYarn', '/assets/marilyn_hero_yarn.png')}
                      alt="Hero Yarn"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  </div>
                </section>

                {/* 3. Crafting Tools & Stacked Sweaters Row */}
                <section className="px-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-stone-50">
                      <img
                        src={getSectionSrc('craftingTools', '/assets/marilyn_crafting_tools.png')}
                        alt="Crafting Tools"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-sm font-bold text-stone-800">Premium Needlecraft</h4>
                      <p className="text-[11px] text-stone-450 leading-relaxed">
                        Handcrafted utilizing strictly verified allergen-free organic cotton needles.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-stone-50">
                      <img
                        src={getSectionSrc('stackedSweaters', '/assets/marilyn_stacked_sweaters.png')}
                        alt="Stacked Sweaters"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-sm font-bold text-stone-800">Finished Quality</h4>
                      <p className="text-[11px] text-stone-450 leading-relaxed">
                        Soft, warm, and highly durable stitching designed to pass generations.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 4. Woman Knitting Section */}
                <section className="bg-stone-50 py-8 px-8 border-y border-stone-200/50 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="relative aspect-square max-w-[320px] mx-auto w-full bg-[#FEF9F6] border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <img
                      src={getSectionSrc('womanKnitting', '/assets/marilyn_woman_knitting.png')}
                      alt="Woman Knitting"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-4">
                    <h2 className="font-serif text-xl font-bold text-stone-800 leading-tight">
                      Made with Love & Handpicked Yarn
                    </h2>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Every stitch is executed carefully by hand. The textures we use ensure maximum comfort and softness.
                    </p>
                    <div className="flex gap-4">
                      <img 
                        src={getSectionSrc('knitTexture', '/assets/marilyn_knit_texture.png')} 
                        alt="Texture" 
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <h5 className="text-[11px] font-bold text-stone-700">Detailed Wool Textures</h5>
                        <p className="text-[10px] text-stone-450 mt-0.5">We review wool quality before knitting.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Testimonial Card */}
                <section className="px-8 max-w-lg mx-auto text-center space-y-4">
                  <div className="w-14 h-14 rounded-full border border-[#EADBDB] overflow-hidden mx-auto">
                    <img
                      src={getSectionSrc('customerAlice', '/assets/marilyn_customer_alice.png')}
                      alt="Alice Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-serif italic text-xs text-stone-600 leading-relaxed">
                    "I ordered a custom toy for my niece and she absolutely loved it! The crochet stitching is extremely neat and the material feels incredibly premium."
                  </p>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#6B5656]">Alice Kingsley</h5>
                    <span className="text-[9px] text-stone-400">Verified Crochet Collector</span>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
