'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  LogOut, 
  Menu, 
  X, 
  ShoppingBag, 
  Loader2, 
  Eye,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
}

interface Order {
  _id?: string;
  id?: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  invoice_url?: string;
}

export default function UserDashboard() {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');

  // Auth States
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    mobile: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Address Book States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false
  });

  // Orders History States
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  // UI Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Navigation / Header States
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [themeColor, setThemeColor] = useState('rose');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle PDF invoice generation and download on-the-fly
  const handleDownloadInvoice = async (orderId: string) => {
    if (!orderId || !token) return;
    setDownloadingOrderId(orderId);
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_CrochetCreation_${orderId.substring(orderId.length - 8).toUpperCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('Invoice downloaded successfully.');
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to download invoice.', 'error');
      }
    } catch (err) {
      showToast('Network error downloading invoice.', 'error');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  // Sync session and settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Theme and Cart
      const savedTheme = localStorage.getItem('themeColor');
      if (savedTheme) setThemeColor(savedTheme);

      const savedCart = localStorage.getItem('crochet_cart_count');
      if (savedCart) setCartItemsCount(parseInt(savedCart, 10));

      const syncCartCount = () => {
        const count = localStorage.getItem('crochet_cart_count');
        if (count) setCartItemsCount(parseInt(count, 10));
      };
      window.addEventListener('cart-change', syncCartCount);

      // 2. Authentication Check
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!savedToken || !savedUser) {
        // Not authenticated - redirect to home with login modal request
        router.push('/?login=true&redirect=/dashboard');
      } else {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUserProfile(parsedUser);
        setProfileForm({
          first_name: parsedUser.first_name || '',
          last_name: parsedUser.last_name || '',
          mobile: parsedUser.mobile || ''
        });
        setAuthLoading(false);
        // Load data depending on active tab
        fetchUserProfile(savedToken);
      }

      return () => {
        window.removeEventListener('cart-change', syncCartCount);
      };
    }
  }, [router]);

  // Fetch updated profile (with addresses)
  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setAddresses(data.addresses || []);
        // Save back to local storage
        localStorage.setItem('user', JSON.stringify({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          mobile: data.mobile,
          is_admin: data.is_admin
        }));
      }
    } catch (err) {
      console.error('Failed to fetch profile info', err);
    }
  };

  // Fetch my orders
  const fetchMyOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        showToast('Failed to fetch order history.', 'error');
      }
    } catch (err) {
      showToast('Network error while retrieving orders.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Trigger data fetches on tab change
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'orders') {
      fetchMyOrders();
    } else if (activeTab === 'addresses') {
      fetchUserProfile(token);
    }
  }, [activeTab]);

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        // Sync local storage
        localStorage.setItem('user', JSON.stringify({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          mobile: data.mobile,
          is_admin: data.is_admin
        }));
        showToast('Profile details updated successfully!');
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showToast('Network error updating profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Open Address Modal for Create / Edit
  const openAddressModal = (address: Address | null = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        full_name: address.full_name,
        phone: address.phone,
        street_address: address.street_address,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        is_default: address.is_default
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        full_name: '',
        phone: '',
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        is_default: addresses.length === 0 // Make default if it's the first address
      });
    }
    setAddressModalOpen(true);
  };

  // Handle Address Submit (Add / Edit)
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddressLoading(true);

    const url = editingAddress 
      ? `${API_URL}/api/users/me/addresses/${editingAddress.id}`
      : `${API_URL}/api/users/me/addresses`;

    const method = editingAddress ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });

      if (response.ok) {
        const updatedAddresses = await response.json();
        setAddresses(updatedAddresses);
        setAddressModalOpen(false);
        showToast(editingAddress ? 'Address updated successfully!' : 'New address added successfully!');
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to save address.', 'error');
      }
    } catch (err) {
      showToast('Network error saving address.', 'error');
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle Address Delete
  const handleDeleteAddress = async (addressId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`${API_URL}/api/users/me/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedAddresses = await response.json();
        setAddresses(updatedAddresses);
        showToast('Address deleted successfully!');
      } else {
        showToast('Failed to delete address.', 'error');
      }
    } catch (err) {
      showToast('Network error deleting address.', 'error');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FEF9F6] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-[#6B5656] animate-spin mb-4" />
        <p className="text-stone-500 font-medium tracking-wide">Loading your dashboard...</p>
      </div>
    );
  }

  // Get current active theme background/text colors
  const themeStyles = {
    primary: '#D9B4B4',
    primaryDark: '#6B5656',
    accent: '#FEF9F6',
    textDark: '#4A3E3E'
  };

  return (
    <div className="min-h-screen bg-[#FEF9F6] font-sans flex flex-col">
      {/* Dynamic Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-stone-100 shadow-2xl rounded-2xl px-5 py-4 max-w-sm animate-slide-in">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-semibold text-stone-700 leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* Navbar Component */}
      <Navbar
        themeColor={themeColor}
        themeColors={{
          rose: { primary: '#D9B4B4', primaryDark: '#6B5656' },
          mustard: { primary: '#E6C17A', primaryDark: '#5C4A2E' },
          green: { primary: '#A8BC98', primaryDark: '#3E4D36' },
          teal: { primary: '#9CBEC2', primaryDark: '#3A4E52' }
        }}
        onThemeChange={(color) => {
          setThemeColor(color);
          localStorage.setItem('themeColor', color);
        }}
        token={token}
        userProfile={userProfile}
        onLogout={handleLogout}
        cartItemsCount={cartItemsCount}
        currentPage="Dashboard"
        alwaysOpaque={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Welcome Section */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-serif text-3xl md:text-4xl font-light tracking-wide text-[#4A3E3E] mb-2">
            Welcome, {userProfile?.first_name} {userProfile?.last_name}
          </h1>
          <p className="text-xs md:text-sm font-semibold tracking-widest uppercase text-stone-500">
            Manage your personal profile, delivery addresses and order history
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Sidebar */}
          <aside className="col-span-1 md:col-span-3 bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all w-full shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-[#F0E4E4] text-[#6B5656]'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all w-full shrink-0 ${
                  activeTab === 'addresses'
                    ? 'bg-[#F0E4E4] text-[#6B5656]'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Manage Addresses</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all w-full shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-[#F0E4E4] text-[#6B5656]'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>My Orders</span>
              </button>
            </div>

            <div className="hidden md:block border-t border-stone-100 mt-6 pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-800 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Content Pane */}
          <section className="col-span-1 md:col-span-9 bg-white rounded-2xl border border-stone-100 p-6 md:p-8 shadow-sm min-h-[500px]">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="font-serif text-2xl font-light text-[#4A3E3E] border-b border-stone-100 pb-4 mb-6">
                  Personal Details
                </h2>
                
                <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        className="w-full bg-[#FEF9F6]/50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D9B4B4] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        className="w-full bg-[#FEF9F6]/50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D9B4B4] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                      Email Address (Cannot be changed)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={userProfile?.email || ''}
                      className="w-full bg-stone-50 border border-stone-100 text-stone-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                      placeholder="e.g. +919876543210"
                      className="w-full bg-[#FEF9F6]/50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D9B4B4] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex items-center gap-2 bg-[#6B5656] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#4A3E3E] transition-colors disabled:opacity-50"
                  >
                    {profileLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </form>
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
                  <h2 className="font-serif text-2xl font-light text-[#4A3E3E]">
                    Address Book
                  </h2>
                  <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase">
                    {addresses.length} Addresses
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Add New Address Card */}
                  <button
                    onClick={() => openAddressModal()}
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-200 hover:border-[#D9B4B4] rounded-2xl p-6 bg-stone-50/50 hover:bg-white transition-all group"
                  >
                    <Plus className="w-6 h-6 text-stone-400 group-hover:text-[#6B5656] mb-2 transition-colors" />
                    <span className="text-xs font-bold uppercase tracking-widest text-stone-500 group-hover:text-[#6B5656] transition-colors">
                      Add New Address
                    </span>
                  </button>

                  {/* Address List */}
                  {addresses.map((address) => (
                    <div 
                      key={address.id}
                      className={`relative flex flex-col justify-between border rounded-2xl p-6 transition-all ${
                        address.is_default 
                          ? 'border-[#D9B4B4] bg-[#FEF9F6]/20 shadow-sm' 
                          : 'border-stone-100 bg-white hover:border-stone-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="font-bold text-stone-700 text-sm">
                            {address.full_name}
                          </h3>
                          {address.is_default && (
                            <span className="bg-[#6B5656]/10 text-[#6B5656] text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed mb-1">
                          {address.street_address}
                        </p>
                        <p className="text-xs text-stone-500 leading-relaxed mb-3">
                          {address.city}, {address.state} - {address.postal_code}
                        </p>
                        <p className="text-[10px] font-bold text-stone-400 tracking-wider">
                          PHONE: {address.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mt-6 border-t border-stone-100/60 pt-4">
                        <button
                          onClick={() => openAddressModal(address)}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6B5656] hover:text-[#4A3E3E] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="font-serif text-2xl font-light text-[#4A3E3E] border-b border-stone-100 pb-4 mb-6">
                  Order History
                </h2>

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#6B5656] animate-spin mb-3" />
                    <p className="text-stone-400 text-xs font-semibold tracking-wider uppercase">Fetching history...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                    <h3 className="font-serif text-lg font-light text-stone-600 mb-2">No orders placed yet</h3>
                    <p className="text-stone-400 text-xs mb-6 max-w-sm mx-auto">Creations and custom crochet apparel that you order will appear right here.</p>
                    <Link 
                      href="/shop" 
                      className="inline-block bg-[#6B5656] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#4A3E3E] transition-colors"
                    >
                      Browse creations
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const orderId = order.id || order._id || '';
                      const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });

                      // Status Badge Styles
                      let badgeClasses = 'bg-amber-50 text-amber-700 border border-amber-200/50';
                      if (order.status === 'Processing') badgeClasses = 'bg-sky-50 text-sky-700 border border-sky-200/50';
                      if (order.status === 'Shipped') badgeClasses = 'bg-indigo-50 text-indigo-700 border border-indigo-200/50';
                      if (order.status === 'Delivered') badgeClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
                      if (order.status === 'Cancelled') badgeClasses = 'bg-rose-50 text-rose-700 border border-rose-200/50';

                      return (
                        <div 
                          key={orderId} 
                          className="border border-stone-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Order Card Header */}
                          <div className="bg-stone-50/50 border-b border-stone-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <p className="text-[9px] font-black tracking-widest text-stone-400 uppercase mb-1">
                                ORDER ID: #{orderId.substring(orderId.length - 8).toUpperCase()}
                              </p>
                              <p className="text-xs font-semibold text-stone-500">
                                Placed on {orderDate}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {order.status === 'Confirmed' && (
                                <button
                                  disabled={downloadingOrderId === orderId}
                                  onClick={() => handleDownloadInvoice(orderId)}
                                  className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                                >
                                  {downloadingOrderId === orderId ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                  <span>{downloadingOrderId === orderId ? 'Generating...' : 'Download Invoice'}</span>
                                </button>
                              )}
                              
                              <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${badgeClasses}`}>
                                {order.status}
                              </span>
                              
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center gap-1 bg-white hover:bg-stone-100 text-[#6B5656] border border-stone-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Details</span>
                              </button>
                            </div>
                          </div>

                          {/* Order Quick Details */}
                          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase">
                                Items Ordered
                              </span>
                              <p className="text-xs text-stone-600 font-medium">
                                {order.items.map((item) => `${item.title} (x${item.quantity})`).join(', ')}
                              </p>
                            </div>

                            <div className="text-right sm:text-right shrink-0">
                              <span className="block text-[10px] font-black tracking-widest text-stone-400 uppercase mb-1">
                                Total Paid
                              </span>
                              <p className="text-base font-bold text-[#6B5656]">
                                ₹{order.total_amount.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ADDRESS FORM MODAL */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-stone-100 animate-scale-up">
            <div className="bg-[#6B5656] text-[#FEF9F6] px-6 py-5 flex items-center justify-between">
              <h3 className="font-serif text-xl font-light tracking-wide">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button 
                onClick={() => setAddressModalOpen(false)}
                className="hover:text-[#D9B4B4] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.full_name}
                    onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                    className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street_address}
                  onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                  placeholder="Apartment, House number, Street name"
                  className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="rounded border-stone-200 text-[#6B5656] focus:ring-[#D9B4B4]"
                />
                <label htmlFor="is_default" className="text-xs font-bold text-stone-500 uppercase tracking-wide cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="flex items-center gap-2 bg-[#6B5656] hover:bg-[#4A3E3E] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {addressLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-stone-100 animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#6B5656] text-[#FEF9F6] px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif text-lg font-light tracking-wide">
                  Order Details
                </h3>
                <p className="text-[8px] font-black tracking-widest text-[#D9B4B4] uppercase mt-0.5">
                  ID: #{selectedOrder.id || selectedOrder._id}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="hover:text-[#D9B4B4] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Order Status & Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/50 rounded-2xl p-4 border border-stone-100">
                <div>
                  <span className="block text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1">
                    Order Status
                  </span>
                  <span className="inline-block text-[10px] font-black tracking-widest bg-stone-100 text-stone-600 border border-stone-200 px-3 py-1 rounded-full uppercase">
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-black tracking-widest text-stone-400 uppercase mb-1">
                    Payment Method
                  </span>
                  <span className="text-xs font-bold text-stone-600">
                    {selectedOrder.payment_method}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-[10px] font-black tracking-widest text-stone-400 uppercase mb-3">
                  Purchased Items
                </h4>
                
                <div className="border border-stone-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100 text-[9px] font-black tracking-widest text-stone-400 uppercase">
                        <th className="px-4 py-3">Creation Name</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="text-stone-600">
                          <td className="px-4 py-3.5 font-medium">{item.title}</td>
                          <td className="px-4 py-3.5 text-center font-bold">{item.quantity}</td>
                          <td className="px-4 py-3.5 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-[#6B5656]">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-4 border-t border-stone-100">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-bold uppercase tracking-wider text-[9px]">Free Delivery</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-700 pt-2 border-t border-stone-100">
                    <span>Grand Total</span>
                    <span className="text-[#6B5656]">₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="border-t border-stone-100 pt-5">
                <h4 className="text-[10px] font-black tracking-widest text-stone-400 uppercase mb-3">
                  Customer & Shipping Info
                </h4>
                <div className="text-xs text-stone-600 space-y-1 bg-stone-50/30 border border-stone-100 rounded-2xl p-4">
                  <p><span className="font-bold text-stone-500 uppercase tracking-wider text-[9px] mr-2">Recipient:</span> {selectedOrder.customer_name}</p>
                  <p><span className="font-bold text-stone-500 uppercase tracking-wider text-[9px] mr-2">Contact Mobile:</span> {selectedOrder.customer_mobile}</p>
                  <p><span className="font-bold text-stone-500 uppercase tracking-wider text-[9px] mr-2">Email Address:</span> {selectedOrder.customer_email}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 flex justify-between items-center shrink-0 border-t border-stone-100">
                              <div>
                                {selectedOrder.status === 'Confirmed' && (
                                  <button
                                    disabled={downloadingOrderId === (selectedOrder.id || selectedOrder._id)}
                                    onClick={() => handleDownloadInvoice(selectedOrder.id || selectedOrder._id || '')}
                                    className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                                  >
                                    {downloadingOrderId === (selectedOrder.id || selectedOrder._id) ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                    <span>{downloadingOrderId === (selectedOrder.id || selectedOrder._id) ? 'Generating...' : 'Download Invoice'}</span>
                                  </button>
                                )}
                              </div>
              
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-[#6B5656] hover:bg-[#4A3E3E] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
