'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  Sparkles, 
  Scissors, 
  ArrowRight, 
  Mail, 
  ChevronRight, 
  Instagram, 
  Gift, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';

// Sample data for the crochet collections
const COLLECTIONS = [
  {
    id: 1,
    title: 'Cute Amigurumi Plushies',
    description: 'Adorable stuffed companions perfect for gifts and decor.',
    image: '🧸',
    tag: 'Popular',
    items: '12 items',
    color: 'bg-amber-100/70 border-amber-200 text-amber-800'
  },
  {
    id: 2,
    title: 'Cozy Winter Apparel',
    description: 'Soft sweaters, beanies, and custom cardigans.',
    image: '🧥',
    tag: 'Cozy Wear',
    items: '8 items',
    color: 'bg-rose-100/70 border-rose-200 text-rose-800'
  },
  {
    id: 3,
    title: 'Aesthetic Home Decor',
    description: 'Coasters, wall hangings, and functional storage baskets.',
    image: '🪴',
    tag: 'New',
    items: '15 items',
    color: 'bg-emerald-100/70 border-emerald-200 text-emerald-800'
  }
];

const PRODUCTS = [
  {
    id: 1,
    name: 'Strawberry Crochet Frog',
    category: 'Amigurumi',
    price: '$24.99',
    image: '🐸',
    rating: 5,
    tag: 'Best Seller'
  },
  {
    id: 2,
    name: 'Oversized Pastel Cardigan',
    category: 'Apparel',
    price: '$79.00',
    image: '🧶',
    rating: 5,
    tag: 'Bestseller'
  },
  {
    id: 3,
    name: 'Aesthetic Daisy Coasters (Set of 4)',
    category: 'Home',
    price: '$18.50',
    image: '🌸',
    rating: 4,
    tag: 'New'
  },
  {
    id: 4,
    name: 'Chunky Knit Beanie',
    category: 'Apparel',
    price: '$22.00',
    image: '👒',
    rating: 5,
    tag: 'Sale'
  }
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [customOrderModal, setCustomOrderModal] = useState(false);
  const [customOrderDetails, setCustomOrderDetails] = useState({ name: '', description: '', yarnType: 'Cotton' });
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const handleCustomOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSubmitted(true);
    setTimeout(() => {
      setCustomOrderModal(false);
      setOrderSubmitted(false);
      setCustomOrderDetails({ name: '', description: '', yarnType: 'Cotton' });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-stone-50/80 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧶</span>
            <span className="text-xl font-bold tracking-tight text-stone-800">
              Crochet<span className="text-amber-600">Creation</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <a href="#collections" className="hover:text-amber-600 transition-colors">Collections</a>
            <a href="#products" className="hover:text-amber-600 transition-colors">Products</a>
            <a href="#about" className="hover:text-amber-600 transition-colors">Our Craft</a>
            <a href="#contact" className="hover:text-amber-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCustomOrderModal(true)}
              className="text-xs uppercase tracking-wider font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-full transition-all hover:shadow-md active:scale-95"
            >
              Custom Order
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/60 via-stone-50 to-transparent pt-12 pb-20 md:py-32">
          {/* Subtle background graphics */}
          <div className="absolute top-10 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-100/80 border border-amber-200/60 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" /> 100% Handcrafted Love
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-stone-900 leading-tight">
                Stitched with Joy, <br className="hidden md:inline" />
                <span className="text-amber-600 relative inline-block">
                  Crafted for Wonders
                  <svg className="absolute left-0 bottom-1 w-full h-2 text-rose-300" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,5 Q50,0 100,5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Welcome to Crochet Creation! We spin custom-designed amigurumi plushies, warm accessories, and cozy aesthetics using premium, soft yarns that bring warmth to your life.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <a 
                  href="#products" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-8 py-3.5 rounded-full font-medium transition-all hover:shadow-lg active:scale-95 group"
                >
                  Explore Collection 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <button 
                  onClick={() => setCustomOrderModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 px-8 py-3.5 rounded-full font-medium transition-all hover:border-stone-400 active:scale-95"
                >
                  <Scissors className="w-4 h-4 text-amber-600" />
                  Request Custom Design
                </button>
              </div>
            </div>

            {/* Interactive Hero Box Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200/50">
                <div className="absolute top-4 right-4 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-600" /> Made to Order
                </div>
                <div className="text-8xl my-6 text-center animate-bounce duration-1000">🧸</div>
                <h3 className="text-xl font-bold text-stone-800 text-center">Bespoke Teddy Plushie</h3>
                <p className="text-stone-500 text-sm text-center mt-2 px-4">
                  Hand-knit with 100% organic soft cotton yarn. Safe for babies and super huggable.
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                  <div>
                    <span className="text-xs uppercase text-stone-400 font-bold tracking-wider">Starting from</span>
                    <p className="text-2xl font-black text-amber-600">$29.99</p>
                  </div>
                  <button 
                    onClick={() => setCustomOrderModal(true)}
                    className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 px-5 py-2.5 rounded-xl font-bold transition-all text-sm active:scale-95"
                  >
                    Customize <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="collections" className="py-20 bg-stone-50/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-stone-900">Explore Hand-Stitched Collections</h2>
              <p className="text-stone-500">
                We craft beautiful yarn goods divided into cozy sub-categories. Click to filter below!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {COLLECTIONS.map((col) => (
                <div 
                  key={col.id}
                  className="bg-white rounded-2xl border border-stone-200/80 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
                >
                  <div>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${col.color}`}>
                      {col.tag}
                    </span>
                    <div className="text-4xl mb-4">{col.image}</div>
                    <h3 className="text-lg font-bold text-stone-800 mb-2">{col.title}</h3>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6">{col.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-400 font-semibold uppercase tracking-wider">
                    <span>{col.items}</span>
                    <span className="text-amber-600 flex items-center gap-1 group cursor-pointer hover:underline">
                      View products <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="products" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-stone-900">Trending Creations</h2>
                <p className="text-stone-500">Pick standard classics ready-to-ship directly to your doorstep.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {['All', 'Amigurumi', 'Apparel', 'Home'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeCategory === cat 
                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {PRODUCTS.filter(p => activeCategory === 'All' || p.category === activeCategory).map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full"
                >
                  <div className="h-48 bg-amber-50/40 flex items-center justify-center text-6xl relative">
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-stone-100 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full text-stone-700">
                      {product.tag}
                    </span>
                    {product.image}
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{product.category}</span>
                      <h4 className="font-bold text-stone-800 text-base leading-snug group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-black text-stone-900">{product.price}</span>
                      <button className="p-2.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 transition-all active:scale-90">
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="about" className="py-20 bg-amber-50/20 border-y border-stone-200/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-3 text-center md:text-left">
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-800">Beautiful Packaging</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Every order is packed with custom notes, gift boxes, and mini keychains as a warm thank you.
                </p>
              </div>

              <div className="space-y-3 text-center md:text-left">
                <div className="w-12 h-12 bg-rose-100 text-rose-800 rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-800">100% Allergy-Safe Yarns</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  We verify all wools and cottons to be extremely soft, baby-safe, and dust-resistant.
                </p>
              </div>

              <div className="space-y-3 text-center md:text-left">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-800">Worldwide Shipping</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Trackable international standard shipping so our stitched creations reach you safely.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-16 text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl" />

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-2">
                <Mail className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Join Our Woolly Community</h2>
              <p className="text-stone-400 max-w-md mx-auto text-sm md:text-base">
                Subscribe to get 10% off your first custom order, plus sneak peeks of upcoming drops.
              </p>

              {subscribed ? (
                <div className="bg-white/10 text-amber-300 font-bold py-3 px-6 rounded-full max-w-sm mx-auto animate-pulse">
                  🎉 Thank you! Check your inbox soon.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full bg-white/10 border border-white/20 text-white px-5 py-3 rounded-full text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold px-6 py-3 rounded-full text-sm transition-all active:scale-95 whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-stone-100 border-t border-stone-200 py-12 text-sm text-stone-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧶</span>
              <span className="text-base font-bold text-stone-800">CrochetCreation</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Bespoke handmade crochet patterns and merchandise created with high-grade organic fibers.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-stone-800 uppercase tracking-wider text-xs mb-4">Shop Links</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#collections" className="hover:text-amber-600">Amigurumi</a></li>
              <li><a href="#collections" className="hover:text-amber-600">Scarves & Sweaters</a></li>
              <li><a href="#collections" className="hover:text-amber-600">Home Ornaments</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-stone-800 uppercase tracking-wider text-xs mb-4">Customer Care</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-amber-600">Custom Order Guidelines</a></li>
              <li><a href="#" className="hover:text-amber-600">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-amber-600">FAQs & Help</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold text-stone-800 uppercase tracking-wider text-xs mb-4">Follow Our Progress</h5>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-stone-200/50 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-stone-200/50 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors">
                <Heart className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-stone-400">© 2026 Crochet Creation. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Order Modal */}
      {customOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-stone-200/80">
            <button 
              onClick={() => setCustomOrderModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            >
              ✕
            </button>
            <div className="text-center space-y-2 mb-6">
              <span className="text-3xl">🎨</span>
              <h3 className="text-xl font-bold text-stone-800">Design Custom Crochet</h3>
              <p className="text-xs text-stone-500">Describe your ideas and we will bring them to life!</p>
            </div>

            {orderSubmitted ? (
              <div className="py-8 text-center space-y-3 text-emerald-600 font-bold">
                <div className="text-5xl">✨</div>
                <p>Order Draft Created!</p>
                <p className="text-xs text-stone-500 font-normal">Closing configuration form...</p>
              </div>
            ) : (
              <form onSubmit={handleCustomOrderSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    value={customOrderDetails.name}
                    onChange={(e) => setCustomOrderDetails({ ...customOrderDetails, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-stone-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Describe what you want</label>
                  <textarea
                    required
                    rows={3}
                    value={customOrderDetails.description}
                    onChange={(e) => setCustomOrderDetails({ ...customOrderDetails, description: e.target.value })}
                    placeholder="E.g., A green frog with a tiny yellow hat, about 6 inches tall..."
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-stone-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Preferred Yarn Material</label>
                  <select
                    value={customOrderDetails.yarnType}
                    onChange={(e) => setCustomOrderDetails({ ...customOrderDetails, yarnType: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-stone-800"
                  >
                    <option value="Cotton">Soft Organic Cotton (Best for toys)</option>
                    <option value="Merino">Merino Wool (Warm sweaters & beanies)</option>
                    <option value="Acrylic">Chunky Acrylic (Durable home decor)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-sm tracking-wider uppercase mt-4 transition-all active:scale-95"
                >
                  Send Design Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
