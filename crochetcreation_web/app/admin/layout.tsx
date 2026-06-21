'use client';

import React, { useEffect, useState } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  useEffect(() => {
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
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#6B5656] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Verifying Credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const menuItems: { name: string; path: string; icon: any; disabled?: boolean }[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Homepage', path: '/admin/customizer', icon: ImageIcon },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname.includes('/admin/dashboard')) return 'Dashboard Overview';
    if (pathname.includes('/admin/products')) return 'Product Catalog';
    if (pathname.includes('/admin/orders')) return 'Order Operations';
    if (pathname.includes('/admin/customers')) return 'Customer Records';
    if (pathname.includes('/admin/customizer')) return 'Homepage Customizer';
    if (pathname.includes('/admin/settings')) return 'Global Settings';
    return 'Admin Panel';
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex text-stone-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-[#4A3B3B] text-white flex flex-col transition-all duration-350 ease-in-out border-r border-[#3E3131] ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#3E3131]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#D9B4B4] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4.5 h-4.5 text-[#4A3B3B]" />
            </div>
            {sidebarOpen && (
              <span className="font-serif font-bold text-sm uppercase tracking-widest text-[#FEF9F6] whitespace-nowrap">
                Crochet Admin
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-stone-300 hover:text-white p-1 rounded-md hover:bg-[#5C4B4B] transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <button
                key={item.name}
                onClick={() => !item.disabled && router.push(item.path)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-[#6B5656] text-white shadow-sm'
                    : item.disabled
                    ? 'opacity-40 cursor-not-allowed text-stone-400'
                    : 'text-stone-300 hover:text-white hover:bg-[#5C4B4B]/50'
                }`}
              >
                <IconComponent className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#D9B4B4]' : 'text-stone-400'}`} />
                {sidebarOpen && <span>{item.name}</span>}
                {item.disabled && sidebarOpen && (
                  <span className="ml-auto text-[7px] bg-[#5C4B4B] text-stone-300 px-1.5 py-0.5 rounded uppercase tracking-widest font-normal">
                    Soon
                  </span>
                )}
                
                {/* Tooltip on collapsed */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#3E3131] text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-md uppercase tracking-wider font-semibold">
                    {item.name} {item.disabled ? '(Coming Soon)' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info / Logout Footer */}
        <div className="p-4 border-t border-[#3E3131] flex flex-col gap-2">
          {sidebarOpen ? (
            <div className="bg-[#3E3131] rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D9B4B4] flex items-center justify-center text-[#4A3B3B] font-bold text-xs uppercase shadow-inner">
                {adminUser?.first_name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#FEF9F6] truncate">
                  {adminUser?.first_name} {adminUser?.last_name}
                </p>
                <p className="text-[9px] text-stone-400 truncate mt-0.5">
                  {adminUser?.email}
                </p>
              </div>
            </div>
          ) : null}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#D9B4B4] hover:bg-[#804D4D]/20 hover:text-red-300 transition-all duration-300 group relative"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-red-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-md uppercase tracking-wider font-semibold">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-lg font-bold text-stone-800 tracking-wide">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar (aesthetic) */}
            <div className="hidden md:flex items-center bg-[#F7F5F2] border border-stone-200 px-3 py-1.5 rounded-xl gap-2 w-64 focus-within:border-[#D9B4B4] transition-all">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search catalog, orders..."
                className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-stone-400 text-stone-700"
              />
            </div>

            {/* Notification Badge */}
            <button className="relative p-2 text-stone-500 hover:text-[#6B5656] hover:bg-stone-50 rounded-full transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D9B4B4] rounded-full ring-2 ring-white"></span>
            </button>

            <span className="w-px h-6 bg-stone-250"></span>

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:bg-stone-50 p-1.5 rounded-xl transition-all"
              >
                <div className="w-7.5 h-7.5 rounded-full bg-[#6B5656] flex items-center justify-center text-[#FEF9F6] font-bold text-xs uppercase shadow-sm">
                  {adminUser?.first_name?.charAt(0) || 'A'}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-stone-700">
                  {adminUser?.first_name}
                </span>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-20"
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-2xl shadow-xl py-2 z-30 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-850 truncate">
                        {adminUser?.first_name} {adminUser?.last_name}
                      </p>
                      <p className="text-[10px] text-stone-450 truncate">
                        {adminUser?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        router.push('/');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                      View Storefront
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold flex items-center gap-2 border-t border-stone-100"
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

        {/* Main Content scrollable area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
