'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Eye,
  Filter,
  RefreshCw,
  Phone,
  Trash2,
  AlertTriangle,
  Calendar,
  Mail,
  User,
  Check,
  Package
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  items: string;
  amount: number;
  date: string;
  status: 'Delivered' | 'Pending' | 'Processing' | 'Cancelled';
  payment: string;
  rawItems: any[];
}

export default function AdminOrders() {
  const router = useRouter();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Processing' | 'Delivered' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Deletion States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const formattedOrders: Order[] = data.map((o: any) => ({
          id: o._id || o.id,
          customer: o.customer_name,
          email: o.customer_email,
          mobile: o.customer_mobile || "",
          items: o.items.map((item: any) => `${item.title} (${item.quantity})`).join(', '),
          amount: o.total_amount,
          date: o.created_at ? new Date(o.created_at).toLocaleString() : 'Just now',
          status: o.status,
          payment: o.payment_method || 'COD',
          rawItems: o.items || []
        }));
        setOrders(formattedOrders);
        
        // Re-sync selected order if any
        if (selectedOrder) {
          const updatedSelected = formattedOrders.find(fo => fo.id === selectedOrder.id);
          if (updatedSelected) {
            setSelectedOrder(updatedSelected);
          }
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
        } else {
          setError("Failed to fetch orders.");
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [API_URL, router]);

  const handleUpdateStatus = async (orderId: string, newStatus: 'Delivered' | 'Pending' | 'Processing' | 'Cancelled') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/orders/${orderId}?status_update=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        alert("Failed to update status on server.");
      }
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Error contacting server.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeleteConfirm = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
        if (selectedOrder?.id === orderToDelete.id) {
          setSelectedOrder(null);
        }
        setDeleteConfirmOpen(false);
        setOrderToDelete(null);
      } else {
        alert("Failed to delete order on server.");
      }
    } catch (err) {
      console.error("Delete order failed:", err);
      alert("Error contacting server.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250/20';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-250/20';
      case 'Processing':
        return 'bg-sky-50 text-sky-700 border-sky-250/20';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-250/20';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'All' || order.status === filter;
    const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-850">Order Dispatch & Logs</h2>
          <p className="text-xs text-stone-450 mt-1">
            Track customer purchases, update courier shipping states, and manage transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchOrders}
            className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all duration-300 active:scale-95 shadow-2xs"
            title="Refresh Orders List"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-stone-650 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', count: orders.length, color: 'text-stone-700 bg-white border border-stone-200', icon: <ShoppingBag className="w-4 h-4" /> },
          { label: 'Pending Packings', count: orders.filter(o => o.status === 'Pending').length, color: 'text-amber-700 bg-amber-50/30 border-amber-200/50', icon: <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> },
          { label: 'Processing Dispatch', count: orders.filter(o => o.status === 'Processing').length, color: 'text-sky-700 bg-sky-50/30 border-sky-200/50', icon: <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> },
          { label: 'Delivered Products', count: orders.filter(o => o.status === 'Delivered').length, color: 'text-emerald-700 bg-emerald-50/30 border-emerald-200/50', icon: <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> },
        ].map((item, i) => (
          <div key={i} className={`p-4 rounded-2xl flex items-center justify-between shadow-2xs ${item.color}`}>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">{item.label}</span>
              <span className="text-xl font-bold block">{item.count}</span>
            </div>
            <div className="opacity-90">{item.icon}</div>
          </div>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mr-2 hidden sm:inline">Filter Status:</span>
          {(['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                filter === tab 
                  ? 'bg-[#6B5656] text-white shadow-xs' 
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl gap-2 w-full lg:w-72 focus-within:border-[#D9B4B4] focus-within:bg-white transition-all shadow-2xs">
          <Search className="w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by ID, Customer name, Items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-stone-400 text-stone-800"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Orders Table list */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
          {loading ? (
            <div className="text-center py-16 text-stone-450 text-xs font-semibold uppercase tracking-wider flex flex-col items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></span>
              Loading orders...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50/50">
                    <th className="py-4 px-6 w-32">Order ID</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6 w-28">Date</th>
                    <th className="py-4 px-6 w-28">Amount</th>
                    <th className="py-4 px-6 w-32">Status</th>
                    <th className="py-4 px-6 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                        No matching transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className={`cursor-pointer transition-all border-l-4 ${
                            isSelected 
                              ? 'bg-[#FEF9F6]/40 border-l-[#6B5656]' 
                              : 'hover:bg-stone-50/30 border-l-transparent'
                          }`}
                        >
                          <td className="py-4 px-6 font-mono font-bold text-[#6B5656] text-xs">
                            ORD-{order.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-stone-850">{order.customer}</div>
                            <div className="text-[10px] text-stone-400 mt-0.5">{order.email}</div>
                          </td>
                          <td className="py-4 px-6 text-stone-500 font-medium">
                            {order.date.split(',')[0]}
                          </td>
                          <td className="py-4 px-6 font-bold text-stone-900 text-sm">
                            ₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                title="View Details"
                                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleOpenDeleteConfirm(order, e)}
                                title="Delete Order"
                                className="p-1.5 hover:bg-red-50 rounded-lg text-stone-500 hover:text-red-650 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Panel */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 space-y-5">
          {selectedOrder ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                <div className="space-y-0.5">
                  <span className="font-serif font-bold text-stone-800 text-sm block">Invoice Details</span>
                  <span className="text-[9px] text-stone-400 font-mono">ID: {selectedOrder.id}</span>
                </div>
                <span className="font-mono font-bold text-[#6B5656] text-xs bg-[#FEF9F6] border border-[#D9B4B4]/40 px-2.5 py-1 rounded-lg">
                  ORD-{selectedOrder.id.slice(-6).toUpperCase()}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Client Info */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-stone-450 uppercase tracking-widest block flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#6B5656]" /> Buyer Profile
                  </span>
                  <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100/60 space-y-1.5">
                    <p className="font-bold text-stone-850 text-xs">{selectedOrder.customer}</p>
                    <p className="text-stone-500 text-[10px] flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-stone-400" /> {selectedOrder.email}
                    </p>
                    {selectedOrder.mobile && (
                      <p className="text-stone-500 text-[10px] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-stone-400" /> {selectedOrder.mobile}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Purchased */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-stone-455 uppercase tracking-widest block flex items-center gap-1.5">
                    <Package className="w-3 h-3 text-[#6B5656]" /> Items Ordered
                  </span>
                  <div className="space-y-2 bg-stone-50/50 p-3.5 rounded-xl border border-stone-100/60">
                    {selectedOrder.rawItems && selectedOrder.rawItems.length > 0 ? (
                      selectedOrder.rawItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-[11px] text-stone-700 font-medium pb-2 last:pb-0 border-b border-stone-150/45 last:border-b-0">
                          <div className="space-y-0.5">
                            <span className="font-bold text-stone-800">{item.title}</span>
                            <span className="text-[10px] text-stone-450 block">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</span>
                          </div>
                          <span className="font-bold text-stone-900 mt-0.5">₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone-400 italic text-[11px]">No items found</p>
                    )}
                  </div>
                </div>

                {/* Totals & Payments */}
                <div className="grid grid-cols-2 gap-3 bg-stone-50/40 p-3 rounded-xl border border-stone-100/50">
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Payment Mode</label>
                    <p className="text-stone-700 font-bold mt-1 text-[11px] uppercase tracking-wide">{selectedOrder.payment}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Grand Total</label>
                    <p className="text-[#6B5656] font-extrabold mt-0.5 text-sm">₹{selectedOrder.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Update Dispatch State */}
                <div className="space-y-2 pt-1">
                  <label className="text-[9px] font-bold text-stone-450 uppercase tracking-widest block mb-1.5">Modify Dispatch State</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Pending', 'Processing', 'Delivered', 'Cancelled'] as const).map(state => {
                      const isActive = selectedOrder.status === state;
                      let activeStyle = '';
                      if (isActive) {
                        if (state === 'Pending') activeStyle = 'bg-amber-500 border-amber-600 text-white shadow-sm';
                        else if (state === 'Processing') activeStyle = 'bg-sky-500 border-sky-600 text-white shadow-sm';
                        else if (state === 'Delivered') activeStyle = 'bg-emerald-500 border-emerald-600 text-white shadow-sm';
                        else if (state === 'Cancelled') activeStyle = 'bg-rose-500 border-rose-600 text-white shadow-sm';
                      }
                      return (
                        <button
                          key={state}
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(selectedOrder.id, state)}
                          className={`py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 active:scale-95 ${
                            isActive
                              ? activeStyle
                              : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                          }`}
                        >
                          {state}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delete Button inside panel */}
                <div className="pt-2 border-t border-stone-100">
                  <button
                    onClick={(e) => handleOpenDeleteConfirm(selectedOrder, e)}
                    className="w-full bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-rose-700 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Order Records
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-stone-400 space-y-4">
              <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mx-auto text-stone-350">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-700">No Order Selected</p>
                <p className="text-[10px] text-stone-450 leading-relaxed px-4">
                  Select any row from the orders catalog on the left to inspect buyer profiles, purchased items, receipt details, and change status.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-650">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-sm font-bold text-stone-850 uppercase tracking-wide">Delete Order Records</h3>
                <p className="text-xs text-stone-450 leading-relaxed">
                  Are you sure you want to permanently delete order <span className="font-mono font-bold text-stone-800">ORD-{orderToDelete.id.slice(-6).toUpperCase()}</span>? This will clear it from database logs.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4.5 bg-stone-50 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="bg-white hover:bg-stone-50 border border-stone-250 text-stone-650 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
              >
                {actionLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
