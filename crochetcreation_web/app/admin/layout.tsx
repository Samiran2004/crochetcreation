'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Search,
  User as UserIcon,
  ShoppingBag,
  Image as ImageIcon,
  Compass,
  ArrowRight,
  ChevronDown,
  Sun,
  Moon,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Responsive sidebar open states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // Dark Mode Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load user, admin verify and theme state
  useEffect(() => {
    // 1. Verify credentials
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      if (!parsedUser.is_admin) {
        router.push('/');
        return;
      }
      setAdminUser(parsedUser);
      setIsAdmin(true);
    } catch (err) {
      console.error("Failed to parse admin profile:", err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    } finally {
      setLoading(false);
    }

    // 2. Load theme preference
    const savedTheme = localStorage.getItem('admin_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system pref
      const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemPref);
    }
  }, [router]);

  // Toggle Theme helper
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('admin_theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Dynamically build breadcrumbs
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, idx) => {
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      const url = '/' + segments.slice(0, idx + 1).join('/');
      const isLast = idx === segments.length - 1;
      return { label, url, isLast };
    });
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-slate-900 dark:border-slate-100 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Loading ERP Workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const sidebarGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Homepage', path: '/admin/customizer', icon: ImageIcon },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Products', path: '/admin/products', icon: Package },
      ]
    },
    {
      title: 'CRM',
      items: [
        { name: 'Customers', path: '/admin/customers', icon: Users },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', path: '/admin/settings', icon: Settings },
      ]
    }
  ];

  // Common Nav component to reuse in desktop and mobile sidebar drawer
  const NavLinks = () => (
    <nav className="flex-grow py-5 px-3 space-y-6 overflow-y-auto scrollbar-none">
      {sidebarGroups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          {(sidebarOpen || mobileSidebarOpen) && (
            <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-slate-500 uppercase px-3 mb-2">
              {group.title}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.path);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm font-bold'
                      : 'text-gray-655 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-gray-100/75 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white dark:text-slate-900' : 'text-gray-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                  {(sidebarOpen || mobileSidebarOpen) && <span>{item.name}</span>}

                  {/* Tooltip on collapsed desktop view */}
                  {!sidebarOpen && !mobileSidebarOpen && (
                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-md uppercase tracking-widest font-bold">
                      {item.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="w-full min-h-screen bg-gray-50 dark:bg-slate-950 flex text-slate-800 dark:text-slate-100 font-sans selection:bg-slate-900/10 dark:selection:bg-white/10 transition-colors duration-250">
        
        {/* ========================================== */}
        {/* 1. DESKTOP SIDEBAR */}
        {/* ========================================== */}
        <aside
          className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shrink-0 transition-all duration-300 ease-in-out z-30 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Brand Logo header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-150 dark:border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                <ShoppingBag className="w-4 h-4 text-white dark:text-slate-950" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                    Crochet ERP
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium -mt-0.5 tracking-wider uppercase">
                    Enterprise Suite
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-slate-900 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-gray-105 dark:hover:bg-slate-800 transition-colors"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <NavLinks />

          {/* Desktop Footer Profiler */}
          <div className="p-3 border-t border-gray-150 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
            {sidebarOpen ? (
              <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-slate-150 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-slate-850 dark:text-slate-100 font-extrabold text-xs uppercase shadow-inner shrink-0">
                  {adminUser?.first_name?.charAt(0) || 'A'}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {adminUser?.first_name} {adminUser?.last_name}
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                    {adminUser?.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-150 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-slate-850 dark:text-slate-105 font-extrabold text-xs uppercase shadow-inner shrink-0">
                  {adminUser?.first_name?.charAt(0) || 'A'}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 transition-all duration-200 group relative"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              {sidebarOpen && <span>Logout</span>}
              {!sidebarOpen && (
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-red-650 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-md uppercase tracking-wider font-bold">
                  Logout
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* ========================================== */}
        {/* 2. MOBILE DRAWER SIDEBAR */}
        {/* ========================================== */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileSidebarOpen(false)}
            ></div>
            
            {/* Drawer Container */}
            <div className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-850 h-full animate-in slide-in-from-left duration-300">
              <div className="h-16 flex items-center justify-between px-5 border-b border-gray-150 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-white dark:text-slate-950" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                      Crochet ERP
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium -mt-0.5 tracking-wider uppercase">
                      Enterprise Suite
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-gray-400 hover:text-slate-900 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-850"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <NavLinks />

              {/* Mobile Drawer Footer Profiler */}
              <div className="p-4 border-t border-gray-150 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <div className="bg-white dark:bg-slate-950 border border-gray-250 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-slate-150 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-slate-850 dark:text-slate-100 font-extrabold text-xs uppercase shadow-inner shrink-0">
                    {adminUser?.first_name?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {adminUser?.first_name} {adminUser?.last_name}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                      {adminUser?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 transition-all duration-200"
                >
                  <LogOut className="w-4.5 h-4.5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. MAIN CONTAINER & TOPBAR */}
        {/* ========================================== */}
        <div className="flex-grow flex flex-col min-w-0">
          
          {/* Sticky Header Topbar */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-850 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-xs transition-colors duration-250">
            
            {/* Left: Mobile hamburger menu toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 text-gray-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-850 rounded-lg md:hidden transition-all shrink-0 border border-gray-200 dark:border-slate-800"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>

              {/* Breadcrumbs (Hidden on narrow screens for cleaner look) */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span className="text-gray-400 dark:text-slate-500 font-medium">ERP Workspace</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-700 shrink-0" />
                <div className="flex items-center gap-1.5">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.url}>
                      {idx > 0 && <ChevronRight className="w-3 h-3 text-gray-300 dark:text-slate-700 shrink-0" />}
                      <span className={`font-semibold tracking-wide ${crumb.isLast ? 'text-slate-900 dark:text-white font-extrabold' : 'text-gray-500 dark:text-slate-400'}`}>
                        {crumb.label}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Search, Theme toggler, Notifications, Profile */}
            <div className="flex items-center gap-2.5 md:gap-4">
              
              {/* Global Search Bar (hidden on mobile, expandable layout) */}
              <div className="hidden lg:flex items-center bg-gray-55 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-3.5 py-1.5 rounded-lg gap-2.5 w-64 focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-xs">
                <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search orders, SKU, users..."
                  className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-gray-400 dark:placeholder-slate-600 text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-550 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-850 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-800 transition-all shrink-0"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4.5 h-4.5" />
                ) : (
                  <Sun className="w-4.5 h-4.5 text-amber-400" />
                )}
              </button>

              {/* Notification Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="relative p-2 text-gray-550 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-850 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-800 transition-all shrink-0"
                >
                  <Bell className="w-4.5 h-4.5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                </button>

                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                    <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                      <div className="px-4 pb-2.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Notifications</span>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">2 New</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-850">
                        <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors text-left">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">📦 Low stock alert</p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Amigurumi Bunny Plushie is running out of stock (only 2 left).</p>
                          <span className="text-[8px] text-gray-400 dark:text-slate-500 font-bold block mt-1">10 minutes ago</span>
                        </div>
                        <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors text-left">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">💰 New order received</p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Order #9403 placed successfully by samiran@creation.com.</p>
                          <span className="text-[8px] text-gray-400 dark:text-slate-500 font-bold block mt-1">1 hour ago</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <span className="w-px h-6 bg-gray-250 dark:bg-slate-800"></span>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-55/70 dark:hover:bg-slate-850 px-2 py-1 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-800 transition-all animate-none"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 font-extrabold text-xs uppercase shadow-sm">
                    {adminUser?.first_name?.charAt(0) || 'A'}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-805 dark:text-slate-205">
                    {adminUser?.first_name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0 hidden sm:inline" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-2.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {adminUser?.first_name} {adminUser?.last_name}
                        </p>
                        <p className="text-[10px] text-gray-450 dark:text-slate-500 truncate mt-0.5">
                          {adminUser?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          router.push('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors font-semibold flex items-center gap-2"
                      >
                        <Compass className="w-3.5 h-3.5 text-gray-400" />
                        View Storefront
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-red-655 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-bold flex items-center gap-2 border-t border-gray-100 dark:border-slate-850"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout Panel
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          </header>

          {/* Scrollable Workspace Container */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-55/40 dark:bg-slate-950/70 transition-colors duration-250">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>

      </div>
    </div>
  );
}
