'use client';
import { apiFetch, getApiUrl } from '../utils/apiFetch';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Film, 
  Clapperboard, 
  ExternalLink,
  Loader2,
  AlertCircle,
  Youtube,
  Sparkles,
  VolumeX,
  Volume2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrganicEdge from '../components/ui/OrganicEdge';
import SectionHeading from '../components/ui/SectionHeading';
import { Sprig, Spool } from '../components/decor/Botanicals';
import { Reveal, ScrollProgress } from '../components/motion/Motion';

const API_URL = getApiUrl();

interface Video {
  _id: string;
  youtube_url: string;
  title: string;
  video_type: 'long' | 'shorts';
  video_id: string;
  thumbnail_url: string;
  created_at: string;
}

// Theme setup matching existing site
const DEFAULT_THEME_COLORS: Record<string, { primary: string; primaryDark: string }> = {
  rose: { primary: '#D9B4B4', primaryDark: '#6B5656' },
  mustard: { primary: '#E6C17A', primaryDark: '#7A6A3D' },
  green: { primary: '#A8BC98', primaryDark: '#5A6B4D' },
  teal: { primary: '#9CBEC2', primaryDark: '#4D6B6E' },
};

export default function VideosPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: isMuted ? 'unMute' : 'mute', args: [] }),
        '*'
      );
      setIsMuted(!isMuted);
    }
  };

  // Theme & Auth
  const [themeColor, setThemeColor] = useState('rose');
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  // Data
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'long' | 'shorts'>('all');

  // Hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('crochet_theme');
      if (savedTheme) setThemeColor(savedTheme);

      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken) setToken(savedToken);
      if (savedUser) {
        try { setUserProfile(JSON.parse(savedUser)); } catch (_) {}
      }

      const syncCartCount = () => {
        const savedCart = localStorage.getItem('crochet_cart_count');
        setCartItemsCount(savedCart ? parseInt(savedCart, 10) : 0);
      };
      syncCartCount();
      window.addEventListener('cart-change', syncCartCount);
      return () => window.removeEventListener('cart-change', syncCartCount);
    }
  }, []);

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`${API_URL}/api/videos/`);
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        } else {
          setError('Failed to load videos');
        }
      } catch (err) {
        console.error('Failed to fetch videos:', err);
        setError('Could not connect to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Filter logic
  const filteredVideos = useMemo(() => {
    if (activeFilter === 'all') return videos;
    return videos.filter(v => v.video_type === activeFilter);
  }, [videos, activeFilter]);

  // Latest video for hero
  const latestVideo = videos.length > 0 ? videos[0] : null;
  // Remaining videos for grid (skip latest in "all" filter)
  const gridVideos = useMemo(() => {
    if (activeFilter === 'all' && latestVideo) {
      return filteredVideos.filter(v => v._id !== latestVideo._id);
    }
    return filteredVideos;
  }, [filteredVideos, latestVideo, activeFilter]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUserProfile(null);
    router.push('/');
  };

  // Get YouTube embed URL
  const getEmbedUrl = (videoId: string) => 
    `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&controls=0&modestbranding=1&enablejsapi=1&vq=hd1080`;

  // Get high-res thumbnail
  const getThumbnail = (video: Video) => {
    // For shorts, use a different ratio thumbnail
    return `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Masonry column assignment for Pinterest look
  const getMasonryColumns = (videos: Video[], colCount: number): Video[][] => {
    const cols: Video[][] = Array.from({ length: colCount }, () => []);
    videos.forEach((video, i) => {
      cols[i % colCount].push(video);
    });
    return cols;
  };

  const filterTabs = [
    { key: 'all' as const, label: 'All Videos', icon: Sparkles },
    { key: 'long' as const, label: 'Full Videos', icon: Film },
    { key: 'shorts' as const, label: 'Shorts', icon: Clapperboard },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* Navbar */}
      <Navbar alwaysOpaque />
      <ScrollProgress />

      {/* Page header */}
      <section className="relative bg-paper-deep pt-24 md:pt-32 pb-10 md:pb-14 overflow-hidden">
        <Sprig className="absolute top-16 right-4 w-44 h-auto text-olive/20 hidden lg:block" />
        <Spool className="absolute bottom-3 left-6 w-14 h-auto text-terracotta/20 hidden lg:block" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <Reveal>
          <SectionHeading
            eyebrow="From the studio"
            lede="Short films of the hooks, yarn and rounds behind each handmade piece."
          >
            Watch It Come Together
          </SectionHeading>
          </Reveal>
        </div>
      </section>
      <OrganicEdge variant="wave" fill="var(--parchment)" height={64} />

      {/* Page Content */}
      <main className="pt-8 pb-16">

        {/* Hero Section - Latest Video */}
        {!loading && latestVideo && (
          <section className="max-w-6xl mx-auto px-4 md:px-6 mb-12">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-line/30 bg-ink group">
              {/* Embedded YouTube Player - Autoplay */}
              <div className="relative w-full" style={{ paddingBottom: latestVideo.video_type === 'shorts' ? '56.25%' : '56.25%' }}>
                <iframe
                  ref={iframeRef}
                  className="absolute inset-0 w-full h-full"
                  src={getEmbedUrl(latestVideo.video_id)}
                  title={latestVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 0 }}
                />
                {/* Overlay to prevent clicking iframe directly (pausing) */}
                <div className="absolute inset-0 z-10 bg-transparent"></div>
              </div>

              {/* Overlay Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent p-6 md:p-8 pointer-events-none">
                <div className="flex items-end justify-between gap-4">
                  <div className="pointer-events-auto">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/15 px-2.5 py-1 rounded-full mb-3">
                      <Sparkles className="w-3 h-3" /> Latest Video
                    </span>
                    <h2 className="text-white text-lg md:text-2xl font-bold leading-tight line-clamp-2">{latestVideo.title}</h2>
                    <p className="text-ondark-muted text-xs mt-1.5 font-medium">{formatDate(latestVideo.created_at)}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3 pointer-events-auto">
                    <button
                      onClick={toggleMute}
                      className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <a 
                      href={latestVideo.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-500/30"
                    >
                      <Youtube className="w-4 h-4" /> Watch on YouTube
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section Header & Filter Tabs */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Youtube className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal/60">Creative Canvas</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-ink">Video Gallery</h2>
              <p className="text-xs text-muted mt-1 max-w-md">Explore tutorials, behind-the-scenes, and creative inspiration from our YouTube channel @Creativecanvas002</p>
            </div>

            {/* Filter Tabs - Pill style */}
            <div className="flex bg-white border border-line p-1 rounded-2xl shadow-sm">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeFilter === tab.key 
                      ? 'bg-teal text-white shadow-sm' 
                      : 'text-muted hover:text-teal hover:bg-parchment-deep'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-line border-t-terracotta rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-teal animate-pulse">Loading Videos...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center py-16 bg-red-50 border border-red-200 rounded-3xl p-8 space-y-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-base font-bold text-red-800">Failed to Load Videos</h3>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center py-20 bg-white border border-dashed border-line rounded-3xl p-8 space-y-4">
              <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-2xl mx-auto">
                🎬
              </div>
              <h3 className="text-base font-bold text-ink">No Videos Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">Videos from our YouTube channel will appear here soon. Stay tuned!</p>
              <a 
                href="https://www.youtube.com/@Creativecanvas002" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all"
              >
                <Youtube className="w-4 h-4" /> Visit Our Channel
              </a>
            </div>
          </div>
        )}

        {/* Pinterest Masonry Grid */}
        {!loading && !error && gridVideos.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 md:px-6">
            {/* Desktop: 4 columns, Tablet: 3, Mobile: 2 */}
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {gridVideos.map((video, idx) => (
                <a
                  key={video._id}
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-inside-avoid group cursor-pointer mb-6"
                >
                  <div className="relative rounded-3xl overflow-hidden mb-2 shadow-sm bg-line-soft">
                    <img 
                      src={getThumbnail(video)} 
                      alt={video.title}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl">
                        <Play className="w-5 h-5 text-ink fill-ink ml-0.5" />
                      </div>
                    </div>

                    {/* Video Type Badge */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-ink/70 text-white backdrop-blur-md">
                        {video.video_type === 'shorts' ? (
                          <><Clapperboard className="w-3 h-3" /> Short</>
                        ) : (
                          <><Film className="w-3 h-3" /> Video</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Text below image like Pinterest */}
                  <div className="px-1">
                    <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-black transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-4 h-4 bg-red-50 rounded-full flex items-center justify-center">
                        <Youtube className="w-2.5 h-2.5 text-red-500" />
                      </div>
                      <span className="text-[11px] text-muted font-semibold">Creative Canvas</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Subscribe Banner */}
            <div className="mt-16 bg-teal-weave rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-red-600/20 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Youtube className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-display text-ondark text-[26px] md:text-[32px] mb-2">Subscribe to Creative Canvas</h3>
                <p className="text-ondark-muted text-sm max-w-md mx-auto mb-6">Don&apos;t miss any new tutorial or creative inspiration. Join 21K+ subscribers on our YouTube channel!</p>
                <a 
                  href="https://www.youtube.com/@Creativecanvas002?sub_confirmation=1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-xl shadow-red-500/20"
                >
                  <Youtube className="w-5 h-5" /> Subscribe Now
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
