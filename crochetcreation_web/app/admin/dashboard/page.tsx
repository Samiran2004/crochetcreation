'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Minus,
  Save,
  FileText,
  Truck,
  RotateCcw,
  UserCheck,
  Percent,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Tab/Module Navigation State: overview | orders | inventory | crm
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory' | 'crm'>('overview');

  // Stats Data
  const [statsData, setStatsData] = useState({
    total_revenue: 0.0,
    total_orders: 0,
    products_count: 0,
    customers_count: 0,
    recent_orders: [] as any[],
    alerts: [] as any[]
  });
  
  // ERP Operational States
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderPage, setOrderPage] = useState(1);
  const itemsPerPage = 8;

  // Inventory Quick Edit States
  const [inventorySearch, setInventorySearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL | LOW | IN | OUT
  const [stockEditState, setStockEditState] = useState<Record<string, number>>({});
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  // CRM States
  const [crmSearch, setCrmSearch] = useState('');

  // Row Action Menu States
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  
  // Status Update Inline State
  const [statusUpdateOrder, setStatusUpdateOrder] = useState<any | null>(null);

  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  const token = useMemo(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  // Fetch initial stats, orders, products, and customers
  const fetchERPData = async () => {
    if (!token) {
      router.push('/');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Admin Stats
      const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setStatsData(stats);
      }

      // 2. Fetch Orders
      const ordersRes = await fetch(`${API_URL}/api/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const ordersList = await ordersRes.json();
        setOrders(ordersList);
      }

      // 3. Fetch Products
      const productsRes = await fetch(`${API_URL}/api/products`);
      if (productsRes.ok) {
        const productsList = await productsRes.json();
        setProducts(productsList);
        
        // Initialize local stock edit numbers
        const initialStock: Record<string, number> = {};
        productsList.forEach((prod: any) => {
          // MongoDB products might not have 'stock_count' default, let's seed mock quantity
          const seededStock = prod.stock_count !== undefined ? prod.stock_count : (prod.in_stock ? 15 : 0);
          initialStock[prod._id || prod.id] = seededStock;
        });
        setStockEditState(initialStock);
      }

      // 4. Fetch Customers
      const customersRes = await fetch(`${API_URL}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (customersRes.ok) {
        const customersList = await customersRes.json();
        setCustomers(customersList);
      }

    } catch (err) {
      console.error("Error loading ERP workspace stats:", err);
      setError("Could not fully retrieve ERP records from backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchERPData();
  }, [API_URL, token]);

  // Quick Action Menu Handlers
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}?status_update=${nextStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Refresh local orders list
        setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status: nextStatus } : o)));
        setActiveMenuOrderId(null);
        setStatusUpdateOrder(null);
      } else {
        alert("Failed to update order status. Please verify roles.");
      }
    } catch (err) {
      console.error("Order status update failed:", err);
    }
  };

  const handleSaveTrackingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;
    
    // Optimistic tracking updates (simulate backend storage update)
    setOrders(prev => prev.map(o => (o._id === trackingModalOrder._id ? { ...o, tracking_number: trackingNumber } : o)));
    setTrackingModalOrder(null);
    setTrackingNumber('');
    alert(`Tracking info added for Order #${trackingModalOrder._id.slice(-6).toUpperCase()}`);
  };

  const handleUpdateStockLevel = async (productId: string, stockVal: number) => {
    setUpdatingStockId(productId);
    try {
      // Toggle backend catalog in_stock flag based on count
      const inStockFlag = stockVal > 0;
      const formData = new FormData();
      formData.append('in_stock', String(inStockFlag));
      
      const res = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => {
          const id = p._id || p.id;
          if (id === productId) {
            return { ...p, in_stock: inStockFlag, stock_count: stockVal };
          }
          return p;
        }));
      } else {
        alert("Could not synchronize stock updates to database.");
      }
    } catch (err) {
      console.error("Stock sync error:", err);
    } finally {
      setUpdatingStockId(null);
    }
  };

  // ----------------------------------------------------
  // Computations & Filters for Order OMS Module
  // ----------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchQuery = 
        order.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order._id?.toLowerCase().includes(orderSearch.toLowerCase());
      
      const matchStatus = orderStatusFilter === 'ALL' || order.status === orderStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const paginatedOrders = useMemo(() => {
    const startIdx = (orderPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredOrders, orderPage]);

  const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // ----------------------------------------------------
  // Computations & Filters for Inventory Module
  // ----------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const matchQuery = 
        prod.title?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        prod.category?.toLowerCase().includes(inventorySearch.toLowerCase());

      const currentStock = stockEditState[prod._id || prod.id] || 0;
      let matchStock = true;
      if (stockFilter === 'LOW') matchStock = currentStock > 0 && currentStock <= 5;
      else if (stockFilter === 'OUT') matchStock = currentStock === 0;
      else if (stockFilter === 'IN') matchStock = currentStock > 5;

      return matchQuery && matchStock;
    });
  }, [products, inventorySearch, stockFilter, stockEditState]);

  // ----------------------------------------------------
  // Computations & Filters for CRM Customers Module
  // ----------------------------------------------------
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      return (
        cust.first_name?.toLowerCase().includes(crmSearch.toLowerCase()) ||
        cust.last_name?.toLowerCase().includes(crmSearch.toLowerCase()) ||
        cust.email?.toLowerCase().includes(crmSearch.toLowerCase())
      );
    });
  }, [customers, crmSearch]);

  // ----------------------------------------------------
  // Dashboard Analytics Mock Data Generators
  // ----------------------------------------------------
  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const stock = stockEditState[p._id || p.id] || 0;
      return stock <= 5;
    }).length;
  }, [products, stockEditState]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Synchronizing ERP Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Upper Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">ERP Control Center</h2>
          <p className="text-xs text-gray-500 mt-1">Real-time catalog distribution, order lifecycle, CRM profiles, and workshop diagnostics.</p>
        </div>
        
        {/* Module Segment Buttons */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200 shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-slate-900'
            }`}
          >
            Orders OMS
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-slate-900'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'crm'
                ? 'bg-white text-slate-900 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-slate-900'
            }`}
          >
            CRM
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-55/10 border border-red-200 text-red-750 p-4 rounded-xl text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 2: OVERVIEW & ANALYTICS TAB */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Dashboard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Total Revenue Month */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between hover:border-gray-300 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Month Revenue</span>
                <h3 className="text-2xl font-black text-slate-900">
                  ₹{statsData.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <span>📈 +14.2%</span> <span className="text-gray-400 font-medium">from last month</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Pending Orders count */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between hover:border-gray-300 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Pending Packings</span>
                <h3 className="text-2xl font-black text-slate-900">
                  {orders.filter(o => o.status === 'Pending').length} Orders
                </h3>
                <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                  <span>⏳ Requires Packing</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between hover:border-gray-300 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Customers</span>
                <h3 className="text-2xl font-black text-slate-900">{statsData.customers_count}</h3>
                <p className="text-[10px] text-sky-600 font-bold flex items-center gap-1 mt-1">
                  <span>👥 +4.8% new users</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                <Users className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between hover:border-gray-300 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Warnings</span>
                <h3 className="text-2xl font-black text-slate-900">{lowStockCount} Items</h3>
                <p className={`text-[10px] font-bold mt-1 ${lowStockCount > 0 ? 'text-red-650' : 'text-emerald-600'}`}>
                  {lowStockCount > 0 ? '⚠️ Critically Low levels' : '✅ Inventory healthy'}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                lowStockCount > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                <AlertCircle className="w-5.5 h-5.5" />
              </div>
            </div>

          </div>

          {/* Charts Placeholder Card Containers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sales Chart Container (2/3 width) */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Revenue over Time</h4>
                  <p className="text-[10px] text-gray-450 mt-0.5">Aggregated weekly sales projection chart</p>
                </div>
                <select className="text-[10px] font-bold border border-gray-200 rounded-lg p-1.5 uppercase bg-white">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Current Year</option>
                </select>
              </div>
              
              {/* Aesthetic Mock Chart for Recharts Hook */}
              <div className="h-64 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                <svg className="w-full h-full max-h-[180px] text-slate-350" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    d="M0,25 Q15,15 30,22 T60,8 T90,14 T100,6 L100,30 L0,30 Z"
                    fill="url(#grad)"
                    stroke="rgb(15 23 42)"
                    strokeWidth="1"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(226, 232, 240)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="rgb(248, 250, 252)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#f1f5f9" strokeWidth="0.3" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.3" />
                </svg>
                <div className="absolute inset-0 bg-white/20 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow">
                    📊 Ready for Recharts library
                  </p>
                </div>
                <div className="w-full flex justify-between text-[9px] text-gray-400 font-bold uppercase px-2 mt-4">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* Sales by Category Container (1/3 width) */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Sales by Category</h4>
                <p className="text-[10px] text-gray-450 mt-0.5">Amigurumi vs Wearables distribution</p>
              </div>

              {/* Pie Chart Mock Container */}
              <div className="h-64 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                <div className="relative w-36 h-36 rounded-full border-[10px] border-slate-100 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[10px] border-slate-900 border-t-transparent border-r-transparent animate-spin duration-1000"></div>
                  <div className="text-center">
                    <span className="text-xs font-black text-slate-950 block">Toys</span>
                    <span className="text-[10px] font-bold text-gray-400">64% Sales</span>
                  </div>
                </div>

                <div className="absolute inset-0 bg-white/20 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow">
                    🍩 Pie / Doughnut ready
                  </p>
                </div>

                <div className="w-full flex items-center justify-center gap-4 text-[9px] text-gray-500 font-bold uppercase mt-4">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900"></span> Toys</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Scarves</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Kids</span>
                </div>
              </div>
            </div>

          </div>

          {/* Grid Bottom: Alerts & Recent Activity List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Orders Overview list */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Recent Order Placements</h4>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-[10px] font-bold text-gray-500 hover:text-slate-950 uppercase tracking-widest"
                >
                  Go to OMS →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {orders.slice(0, 4).map((order) => {
                      let statusBadge = "bg-gray-100 text-gray-800";
                      if (order.status === "Delivered") statusBadge = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                      else if (order.status === "Pending") statusBadge = "bg-amber-50 text-amber-700 border border-amber-100";
                      else if (order.status === "Processing") statusBadge = "bg-sky-50 text-sky-700 border border-sky-100";
                      else if (order.status === "Cancelled") statusBadge = "bg-rose-50 text-rose-700 border border-rose-100";

                      return (
                        <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">ORD-{order._id?.slice(-6).toUpperCase()}</td>
                          <td className="py-3 px-3 text-gray-650">{order.customer_name}</td>
                          <td className="py-3 px-3 font-bold">₹{order.total_amount?.toFixed(2)}</td>
                          <td className="py-3 px-3 text-gray-400">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusBadge}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diagnostic Workshop Alerts */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Workshop Alerts</h4>
              <div className="space-y-3">
                {statsData.alerts.map((alert, idx) => (
                  <div key={idx} className={`flex gap-3 p-3.5 rounded-xl border text-left ${alert.color}`}>
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[11px] font-black uppercase tracking-wider">{alert.title}</h5>
                      <p className="text-[10px] opacity-90 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 3: ADVANCED ORDER MANAGEMENT SYSTEM (OMS) */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Left: Headline */}
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">Order Operations</h3>
              <p className="text-[10px] text-gray-450 mt-0.5">Filter, fulfill, and update tracking indicators for artisan creations.</p>
            </div>

            {/* Right: Search + Filter Tools */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search order ID, buyer..."
                  value={orderSearch}
                  onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
                  className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none placeholder-gray-400 font-semibold shadow-xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderPage(1); }}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto border border-gray-150 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Total</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 text-xs">
                      No matching order logs found.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    let statusBadge = "bg-gray-100 text-gray-800";
                    if (order.status === "Delivered") statusBadge = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                    else if (order.status === "Pending") statusBadge = "bg-amber-50 text-amber-700 border border-amber-100";
                    else if (order.status === "Processing") statusBadge = "bg-sky-50 text-sky-700 border border-sky-100";
                    else if (order.status === "Cancelled") statusBadge = "bg-rose-50 text-rose-700 border border-rose-100";

                    return (
                      <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          ORD-{order._id?.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-medium">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="text-slate-900">{order.customer_name}</p>
                            <p className="text-[10px] text-gray-400 font-normal">{order.customer_email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          ₹{order.total_amount?.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-[10px] tracking-wide text-gray-500 uppercase">
                          {order.payment_method || 'COD'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${statusBadge}`}>
                            {order.status}
                          </span>
                          {order.tracking_number && (
                            <span className="block text-[8px] text-gray-450 mt-0.5 font-bold uppercase tracking-wider">
                              📦 Track: {order.tracking_number}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right relative">
                          <button
                            onClick={() => setActiveMenuOrderId(activeMenuOrderId === order._id ? null : order._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-slate-900 hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Row Context Menu */}
                          {activeMenuOrderId === order._id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveMenuOrderId(null)}></div>
                              <div className="absolute right-4 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2.5 z-40 animate-in fade-in-50 slide-in-from-top-2 duration-150 text-left">
                                <button
                                  onClick={() => setStatusUpdateOrder(order)}
                                  className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                                  Update Status
                                </button>
                                <button
                                  onClick={() => {
                                    setTrackingModalOrder(order);
                                    setTrackingNumber(order.tracking_number || '');
                                    setActiveMenuOrderId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                                >
                                  <Truck className="w-3.5 h-3.5 text-gray-400" />
                                  Add Tracking Info
                                </button>
                                <button
                                  onClick={() => {
                                    alert(`Generating Invoice PDF for ORD-${order._id.slice(-6).toUpperCase()}`);
                                    setActiveMenuOrderId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2 border-t border-gray-100 mt-1.5 pt-1.5"
                                >
                                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                                  Print Invoice
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controller */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">
              Showing {filteredOrders.length > 0 ? (orderPage - 1) * itemsPerPage + 1 : 0} to {Math.min(orderPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={orderPage === 1}
                onClick={() => setOrderPage(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-55/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-900 px-3">{orderPage} / {totalOrderPages}</span>
              <button
                disabled={orderPage === totalOrderPages}
                onClick={() => setOrderPage(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-55/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 4: INVENTORY & CATALOG CONTROL TAB */}
      {/* ==================================================== */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Header */}
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">Inventory Stock Control</h3>
              <p className="text-[10px] text-gray-450 mt-0.5">Bulk update active units, allocate SKU codes, and track restocking metrics.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search SKU or title..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none placeholder-gray-400 font-semibold shadow-xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs focus:outline-none"
              >
                <option value="ALL">All Stocks</option>
                <option value="IN">In Stock</option>
                <option value="LOW">Low Stock (≤5)</option>
                <option value="OUT">Out of Stock</option>
              </select>
            </div>

          </div>

          {/* Stock Table with thumbnails */}
          <div className="overflow-x-auto border border-gray-150 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75">
                  <th className="py-3 px-4">Product Info</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status Indicator</th>
                  <th className="py-3 px-4">Units Stock</th>
                  <th className="py-3 px-4 text-right">Quick Restock / Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                {filteredProducts.map((p) => {
                  const id = p._id || p.id;
                  const currentStock = stockEditState[id] || 0;
                  
                  let stockBadge = "bg-rose-50 text-rose-700 border border-rose-100"; // Out of stock
                  let badgeText = "Out of Stock";
                  if (currentStock > 5) {
                    stockBadge = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                    badgeText = "In Stock";
                  } else if (currentStock > 0) {
                    stockBadge = "bg-amber-50 text-amber-700 border border-amber-100";
                    badgeText = "Low Stock";
                  }

                  return (
                    <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-stone-50">
                            <Image
                              src={p.image_url}
                              alt={p.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold truncate max-w-[150px]">{p.title}</p>
                            <p className="text-[10px] text-gray-400 font-normal">{p.size || 'Standard Size'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 uppercase font-bold text-[10px] tracking-wide">
                        SKU-CR-{id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-gray-550 uppercase text-[9px] tracking-wider font-bold">
                        {p.category}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        ₹{p.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${stockBadge}`}>
                          {badgeText}
                        </span>
                      </td>
                      
                      {/* Interactive Stock Number Counter */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const nextVal = Math.max(0, currentStock - 1);
                              setStockEditState(prev => ({ ...prev, [id]: nextVal }));
                            }}
                            className="w-6 h-6 rounded-md border border-gray-250 flex items-center justify-center hover:bg-gray-150 transition-colors text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-black text-slate-900">{currentStock}</span>
                          <button
                            onClick={() => {
                              const nextVal = currentStock + 1;
                              setStockEditState(prev => ({ ...prev, [id]: nextVal }));
                            }}
                            className="w-6 h-6 rounded-md border border-gray-250 flex items-center justify-center hover:bg-gray-150 transition-colors text-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Sync to DB action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          disabled={updatingStockId === id}
                          onClick={() => handleUpdateStockLevel(id, currentStock)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-45 flex items-center gap-1 ml-auto shadow-xs active:scale-95"
                        >
                          <Save className="w-3 h-3" />
                          {updatingStockId === id ? 'Syncing...' : 'Save Sync'}
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 5: CRM (CUSTOMER RELATIONSHIP MANAGEMENT) */}
      {/* ==================================================== */}
      {activeTab === 'crm' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Header */}
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">Customer Directory CRM</h3>
              <p className="text-[10px] text-gray-450 mt-0.5">LTV metrics, order placement frequency, and digital user records.</p>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or email..."
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none placeholder-gray-400 font-semibold shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>

          </div>

          {/* Customer CRM Table */}
          <div className="overflow-x-auto border border-gray-150 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75">
                  <th className="py-3 px-4">Customer Info</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">LTV (Lifetime Value)</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Relationship Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                      No customer files registered in CRM database.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center font-extrabold text-slate-800 text-xs">
                            {cust.first_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold">{cust.first_name} {cust.last_name}</p>
                            <p className="text-[10px] text-gray-450 font-normal">{cust.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {cust.mobile || 'No Mobile Registered'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-850">
                        {cust.orders_count} Placements
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ₹{cust.total_spent?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
                          {cust.total_spent > 5000 ? '⭐ VIP Tier' : 'Standard Buyer'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* OPERATIONS & OMS SUPPORT MODALS */}
      {/* ==================================================== */}

      {/* 1. Add Tracking Information Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-slate-900 text-white">
              <div className="text-left">
                <h4 className="text-xs font-black uppercase tracking-widest">ALLOCATE TRACKING INFO</h4>
                <p className="text-[9px] text-gray-300 mt-0.5">Order #{trackingModalOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setTrackingModalOrder(null)}
                className="text-white/80 hover:text-white text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTrackingInfo} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-450 block mb-1">
                  Courier / Tracking Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IN-DELIVERY-9403810"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-4 py-2 border border-gray-200 text-slate-700 hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Update Order Status Modal */}
      {statusUpdateOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-slate-900 text-white">
              <div className="text-left">
                <h4 className="text-xs font-black uppercase tracking-widest">UPDATE ORDER STATUS</h4>
                <p className="text-[9px] text-gray-300 mt-0.5">Order #{statusUpdateOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setStatusUpdateOrder(null)}
                className="text-white/80 hover:text-white text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-2 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-450 mb-3">Choose delivery phase:</p>
              {["Pending", "Processing", "Delivered", "Cancelled"].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => handleUpdateOrderStatus(statusUpdateOrder._id, statusOption)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between ${
                    statusUpdateOrder.status === statusOption
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-gray-200 hover:bg-gray-50 text-slate-600'
                  }`}
                >
                  <span>{statusOption}</span>
                  {statusUpdateOrder.status === statusOption && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
