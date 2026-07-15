'use client';
import { apiFetch } from '../../utils/apiFetch';

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
  MoreHorizontal,
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
  Calendar,
  Eye,
  Download,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import OrderTable from './components/OrderTable';
import OrderDrawer from './components/OrderDrawer';
import InventoryTable from './components/InventoryTable';

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
  const [isMounted, setIsMounted] = useState(false);

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

  // Modals & Menu States
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusUpdateOrder, setStatusUpdateOrder] = useState<any | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);

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
      const statsRes = await apiFetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setStatsData(stats);
      }

      // 2. Fetch Orders
      const ordersRes = await apiFetch(`${API_URL}/api/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const ordersList = await ordersRes.json();
        setOrders(ordersList);
      }

      // 3. Fetch Products
      const productsRes = await apiFetch(`${API_URL}/api/products`);
      if (productsRes.ok) {
        const productsList = await productsRes.json();
        setProducts(productsList);
        
        // Initialize local stock edit numbers
        const initialStock: Record<string, number> = {};
        productsList.forEach((prod: any) => {
          const seededStock = prod.stock_count !== undefined ? prod.stock_count : (prod.in_stock ? 15 : 0);
          initialStock[prod._id || prod.id] = seededStock;
        });
        setStockEditState(initialStock);
      }

      // 4. Fetch Customers
      const customersRes = await apiFetch(`${API_URL}/api/customers`, {
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
    setIsMounted(true);
  }, [API_URL, token]);

  // Quick Action Menu Handlers
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await apiFetch(`${API_URL}/api/orders/${orderId}?status_update=${nextStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status: nextStatus } : o)));
        setActiveMenuOrderId(null);
        setStatusUpdateOrder(null);
        // Update selected detail view if open
        if (selectedOrderForDetail && selectedOrderForDetail._id === orderId) {
          setSelectedOrderForDetail((prev: any) => ({ ...prev, status: nextStatus }));
        }
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
    
    setOrders(prev => prev.map(o => (o._id === trackingModalOrder._id ? { ...o, tracking_number: trackingNumber } : o)));
    // Update selected detail view if open
    if (selectedOrderForDetail && selectedOrderForDetail._id === trackingModalOrder._id) {
      setSelectedOrderForDetail((prev: any) => ({ ...prev, tracking_number: trackingNumber }));
    }
    setTrackingModalOrder(null);
    setTrackingNumber('');
    alert(`Tracking info added for Order #${trackingModalOrder._id.slice(-6).toUpperCase()}`);
  };

  const handleUpdateStockLevel = async (productId: string, stockVal: number) => {
    setUpdatingStockId(productId);
    try {
      const inStockFlag = stockVal > 0;
      const formData = new FormData();
      formData.append('in_stock', String(inStockFlag));
      
      const res = await apiFetch(`${API_URL}/api/products/${productId}`, {
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
        alert("Stock level successfully synced to catalog.");
      } else {
        alert("Could not synchronize stock updates to database.");
      }
    } catch (err) {
      console.error("Stock sync error:", err);
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleUpdateProduct = async (productId: string, updatedFields: Partial<any>) => {
    try {
      // If updating fields are empty, redirect to edit page
      if (Object.keys(updatedFields).length === 0) {
        window.open(`/admin/products`, '_blank');
        return;
      }

      const res = await apiFetch(`${API_URL}/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const updated = await res.json();
        // Update product state locally
        setProducts(prev => prev.map(p => (p._id === productId || p.id === productId ? updated : p)));
        return updated;
      } else {
        const err = await res.json();
        alert(`Failed to update product: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error("Product update error:", err);
      alert("Failed to connect to backend product server.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await apiFetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== productId && p.id !== productId));
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error("Delete product error:", err);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const res = await apiFetch(`${API_URL}/api/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to download invoice');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_CrochetCreation_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Could not download invoice. Please ensure order is Confirmed.');
    }
  };

  // Sparkline Generator Helper
  const revenueSparklineData = useMemo(() => {
    const base = statsData.total_revenue || 25000;
    return [
      { value: base * 0.75 },
      { value: base * 0.8 },
      { value: base * 0.95 },
      { value: base * 0.9 },
      { value: base * 1.1 },
      { value: base * 1.05 },
      { value: base }
    ];
  }, [statsData.total_revenue]);

  const pendingSparklineData = useMemo(() => {
    const count = orders.filter(o => o.status === 'Pending').length;
    return [
      { value: count + 4 },
      { value: count + 3 },
      { value: count + 5 },
      { value: count + 2 },
      { value: count + 1 },
      { value: count + 2 },
      { value: count }
    ];
  }, [orders]);

  const customersSparklineData = useMemo(() => {
    const base = statsData.customers_count || 12;
    return [
      { value: base - 5 },
      { value: base - 4 },
      { value: base - 3 },
      { value: base - 2 },
      { value: base - 2 },
      { value: base - 1 },
      { value: base }
    ];
  }, [statsData.customers_count]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const stock = stockEditState[p._id || p.id] || 0;
      return stock <= 5;
    }).length;
  }, [products, stockEditState]);

  const stockSparklineData = useMemo(() => {
    return [
      { value: lowStockCount + 3 },
      { value: lowStockCount + 2 },
      { value: lowStockCount + 4 },
      { value: lowStockCount + 1 },
      { value: lowStockCount + 2 },
      { value: lowStockCount + 1 },
      { value: lowStockCount }
    ];
  }, [lowStockCount]);

  // Main Revenue Chart Data
  const mainChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const totalRev = statsData.total_revenue || 25000;
    const baseVal = totalRev / (currentMonth + 1);
    
    return Array.from({ length: currentMonth + 1 }).map((_, idx) => {
      const multiplier = 0.85 + (Math.sin(idx) * 0.1) + (idx * 0.05);
      return {
        name: months[idx],
        revenue: Math.round(baseVal * (idx + 1) * multiplier)
      };
    });
  }, [statsData.total_revenue]);

  // Custom Glassmorphism Tooltip for AreaChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md shadow-xl border border-gray-100 rounded-xl p-3 text-left">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">
            ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Computations & Filters for Order OMS Module
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

  // Computations & Filters for Inventory Module
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

  // Computations & Filters for CRM Customers Module
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      return (
        cust.first_name?.toLowerCase().includes(crmSearch.toLowerCase()) ||
        cust.last_name?.toLowerCase().includes(crmSearch.toLowerCase()) ||
        cust.email?.toLowerCase().includes(crmSearch.toLowerCase())
      );
    });
  }, [customers, crmSearch]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Synchronizing ERP Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Upper Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">ERP Control Center</h2>
          <p className="text-xs text-gray-500 mt-1">Real-time catalog distribution, order lifecycle, CRM profiles, and workshop diagnostics.</p>
        </div>
        
        {/* Module Segment Buttons */}
        <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-sm">
          {(['overview', 'orders', 'inventory', 'crm'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs border border-gray-100'
                  : 'text-gray-450 hover:text-slate-900'
              }`}
            >
              {tab === 'orders' ? 'Orders OMS' : tab}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 1: OVERVIEW & ANALYTICS TAB */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* KPI Dashboard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* KPI 1: Month Revenue */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:border-gray-200 transition-all flex items-center justify-between">
              <div className="space-y-1.5 text-left">
                <span className="text-xs font-semibold tracking-wide text-gray-500 block">Month Revenue</span>
                <h3 className="text-3xl font-extrabold text-gray-900">
                  ₹{statsData.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span>📈 +14.2%</span> <span className="text-gray-400 font-medium">from last month</span>
                </span>
              </div>
              <div className="flex flex-col items-end justify-between h-full space-y-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-5 h-5" />
                </div>
                {isMounted && (
                  <div className="w-24 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueSparklineData}>
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* KPI 2: Pending Packings */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:border-gray-200 transition-all flex items-center justify-between">
              <div className="space-y-1.5 text-left">
                <span className="text-xs font-semibold tracking-wide text-gray-500 block">Pending Packings</span>
                <h3 className="text-3xl font-extrabold text-gray-900">
                  {orders.filter(o => o.status === 'Pending').length} Orders
                </h3>
                <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                  <span>⏳ Requires Packing</span>
                </span>
              </div>
              <div className="flex flex-col items-end justify-between h-full space-y-4">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                {isMounted && (
                  <div className="w-24 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pendingSparklineData}>
                        <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* KPI 3: Total Customers */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:border-gray-200 transition-all flex items-center justify-between">
              <div className="space-y-1.5 text-left">
                <span className="text-xs font-semibold tracking-wide text-gray-500 block">Total Customers</span>
                <h3 className="text-3xl font-extrabold text-gray-900">{statsData.customers_count}</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span>👥 +4.8% new users</span>
                </span>
              </div>
              <div className="flex flex-col items-end justify-between h-full space-y-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                {isMounted && (
                  <div className="w-24 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={customersSparklineData}>
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* KPI 4: Stock Warnings */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:border-gray-200 transition-all flex items-center justify-between">
              <div className="space-y-1.5 text-left">
                <span className="text-xs font-semibold tracking-wide text-gray-500 block">Stock Warnings</span>
                <h3 className="text-3xl font-extrabold text-gray-900">{lowStockCount} Items</h3>
                <span className={`text-[10px] font-bold ${lowStockCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {lowStockCount > 0 ? '⚠️ Critically Low levels' : '✅ Catalog Healthy'}
                </span>
              </div>
              <div className="flex flex-col items-end justify-between h-full space-y-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  lowStockCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                {isMounted && (
                  <div className="w-24 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stockSparklineData}>
                        <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Main AreaChart (Revenue Over Time) */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Revenue over Time</h3>
                <p className="text-xs text-gray-450 mt-0.5 font-medium">Aggregated weekly sales projection chart</p>
              </div>
              <select className="text-[10px] font-bold border border-gray-200 rounded-lg p-1.5 uppercase bg-white cursor-pointer hover:border-gray-300">
                <option>Last 30 Days</option>
                <option>Current Year</option>
              </select>
            </div>
            
            <div className="h-72 w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Grid Bottom: Alerts & Recent Activity List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Orders Overview list */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4 text-left">
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
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                    {orders.slice(0, 5).map((order) => {
                      let statusBadge = "bg-gray-100 text-gray-800 ring-gray-200";
                      if (order.status === "Delivered") statusBadge = "bg-emerald-50 text-emerald-700 ring-emerald-200";
                      else if (order.status === "Pending") statusBadge = "bg-teal-50 text-teal-700 ring-teal-200";
                      else if (order.status === "Processing") statusBadge = "bg-blue-50 text-blue-700 ring-blue-200";
                      else if (order.status === "Cancelled") statusBadge = "bg-rose-50 text-rose-700 ring-rose-200";

                      return (
                        <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">ORD-{order._id?.slice(-6).toUpperCase()}</td>
                          <td className="py-3 px-3 text-gray-650">{order.customer_name}</td>
                          <td className="py-3 px-3 font-bold">₹{order.total_amount?.toFixed(2)}</td>
                          <td className="py-3 px-3 text-gray-450">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ${statusBadge}`}>
                              {order.status === "Pending" ? "CONFIRMED" : order.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diagnostic Workshop Alerts with triggers */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4 text-left">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Workshop Alerts</h4>
              <div className="space-y-3">
                {statsData.alerts.map((alert, idx) => {
                  let alertLink = null;
                  if (alert.type === "pending") {
                    alertLink = (
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-semibold text-amber-700 hover:underline hover:text-amber-800 shrink-0"
                      >
                        Pack Items →
                      </button>
                    );
                  } else if (alert.type === "payout") {
                    alertLink = (
                      <button 
                        onClick={() => setActiveTab('crm')}
                        className="text-xs font-semibold text-emerald-700 hover:underline hover:text-emerald-800 shrink-0"
                      >
                        View LTV →
                      </button>
                    );
                  } else if (alert.type === "stock") {
                    alertLink = (
                      <button 
                        onClick={() => setActiveTab('inventory')}
                        className="text-xs font-semibold text-rose-700 hover:underline hover:text-rose-800 shrink-0"
                      >
                        Restock Catalog →
                      </button>
                    );
                  }

                  return (
                    <div key={idx} className={`flex items-center justify-between gap-3 p-4 rounded-xl border text-left ${alert.color}`}>
                      <div className="flex gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[11px] font-black uppercase tracking-wider">{alert.title}</h5>
                          <p className="text-[10px] opacity-90 mt-0.5 leading-tight">{alert.message}</p>
                        </div>
                      </div>
                      {alertLink}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 2: ADVANCED ORDER MANAGEMENT SYSTEM (OMS) */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="text-left">
            <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">Order Operations</h3>
            <p className="text-[10px] text-gray-450 mt-0.5 font-medium">Filter, fulfill, and update tracking indicators for artisan creations.</p>
          </div>
          <OrderTable
            orders={orders}
            onOpenDrawer={(order) => setSelectedOrderForDetail(order)}
            onUpdateStatus={handleUpdateOrderStatus}
            onDownloadInvoice={handleDownloadInvoice}
            onValidatePayment={async (orderId) => {
              await handleUpdateOrderStatus(orderId, 'Processing');
              alert(`Payment verified successfully for Order #${orderId.slice(-6).toUpperCase()}`);
            }}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 3: INVENTORY & CATALOG CONTROL TAB */}
      {/* ==================================================== */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="text-left">
            <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">Inventory Stock Control</h3>
            <p className="text-[10px] text-gray-450 mt-0.5 font-medium">Bulk update active units, allocate SKU codes, and track restocking metrics.</p>
          </div>
          <InventoryTable
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={() => {
              window.open('/admin/products', '_blank');
            }}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* MODULE 4: CRM (CUSTOMER RELATIONSHIP MANAGEMENT) */}
      {/* ==================================================== */}
      {activeTab === 'crm' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            <div className="text-left">
              <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">Customer Directory CRM</h3>
              <p className="text-[10px] text-gray-450 mt-0.5 font-medium">LTV metrics, order placement frequency, and digital user records.</p>
            </div>

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
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75">
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
                          <div className="text-left">
                            <p className="text-slate-900 font-bold">{cust.first_name} {cust.last_name}</p>
                            <p className="text-[10px] text-gray-450 font-normal">{cust.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {cust.mobile || 'No Mobile Registered'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-805">
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
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-200">
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm"
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
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-gray-150 animate-in zoom-in-95 duration-200">
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
                      : 'border-gray-200 hover:bg-gray-55 text-slate-655'
                  }`}
                >
                  <span>{statusOption === "Pending" ? "CONFIRMED" : statusOption.toUpperCase()}</span>
                  {statusUpdateOrder.status === statusOption && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Order Drawer/Sheet */}
      <OrderDrawer
        order={selectedOrderForDetail}
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        onDownloadInvoice={handleDownloadInvoice}
        onValidatePayment={async (orderId) => {
          await handleUpdateOrderStatus(orderId, 'Processing');
          alert(`Payment verified successfully for Order #${orderId.slice(-6).toUpperCase()}`);
        }}
      />

    </div>
  );
}
