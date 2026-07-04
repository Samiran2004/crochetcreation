'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Download, 
  Eye, 
  CheckCircle, 
  Trash2, 
  X,
  FileText,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';

interface OrderTableProps {
  orders: any[];
  onOpenDrawer: (order: any) => void;
  onUpdateStatus: (orderId: string, nextStatus: string) => Promise<void>;
  onDownloadInvoice: (orderId: string) => Promise<void>;
  onValidatePayment: (orderId: string) => void;
}

export default function OrderTable({
  orders,
  onOpenDrawer,
  onUpdateStatus,
  onDownloadInvoice,
  onValidatePayment
}: OrderTableProps) {
  // Search and Pagination
  const [search, setSearch] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Rows
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Row Dropdown Menu
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

  // Downloading state tracker
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Helper: Get initials and colors for avatar
  const getAvatarDetails = (name: string) => {
    const initials = name
      ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';
    
    const colors = [
      'bg-emerald-50 text-emerald-700 ring-emerald-100',
      'bg-blue-50 text-blue-700 ring-blue-100',
      'bg-indigo-50 text-indigo-700 ring-indigo-100',
      'bg-purple-50 text-purple-700 ring-purple-100',
      'bg-pink-50 text-pink-700 ring-pink-100',
      'bg-amber-50 text-amber-700 ring-amber-100'
    ];
    const index = name ? name.length % colors.length : 0;
    return { initials, colorClass: colors[index] };
  };

  // Helper: Map status to payment/fulfillment statuses
  const getOrderStatuses = (order: any) => {
    const isUPI = order.payment_method === 'UPI';
    const isPaid = order.status === 'Delivered' || order.status === 'Processing' || order.status === 'Confirmed';
    const isCancelled = order.status === 'Cancelled';
    const isPendingValidation = order.status === 'Pending Validation' || (order.status === 'Pending' && isUPI);

    let paymentStatus = 'Unpaid';
    let paymentStyle = 'bg-gray-50 text-gray-600 ring-gray-200';
    let paymentDot = 'bg-gray-400';

    if (isPaid) {
      paymentStatus = 'Paid';
      paymentStyle = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      paymentDot = 'bg-emerald-500';
    } else if (isPendingValidation) {
      paymentStatus = 'Pending Validation';
      paymentStyle = 'bg-amber-50 text-amber-700 ring-amber-200';
      paymentDot = 'bg-amber-500';
    } else if (isCancelled) {
      paymentStatus = 'Unpaid';
      paymentStyle = 'bg-rose-50 text-rose-700 ring-rose-200';
      paymentDot = 'bg-rose-500';
    }

    return { paymentStatus, paymentStyle, paymentDot };
  };

  // Filters logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search Query
      const matchQuery = 
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
        order._id?.toLowerCase().includes(search.toLowerCase());
      
      // 2. Fulfillment Status
      const matchFulfillment = fulfillmentFilter === 'ALL' || order.status === fulfillmentFilter;

      // 3. Payment Status
      const { paymentStatus } = getOrderStatuses(order);
      const matchPayment = paymentFilter === 'ALL' || paymentStatus === paymentFilter;

      // 4. Date Range
      let matchDate = true;
      if (order.created_at && dateRange !== 'ALL') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (dateRange === 'TODAY') matchDate = diffDays <= 1;
        else if (dateRange === 'WEEK') matchDate = diffDays <= 7;
        else if (dateRange === 'MONTH') matchDate = diffDays <= 30;
      }

      return matchQuery && matchFulfillment && matchPayment && matchDate;
    });
  }, [orders, search, fulfillmentFilter, paymentFilter, dateRange]);

  // Paginated Orders
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, page]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedOrders.map(o => o._id);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        pageIds.forEach(id => newSet.add(id));
        return newSet;
      });
    } else {
      const pageIds = paginatedOrders.map(o => o._id);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        pageIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (e.target.checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const isAllPageSelected = useMemo(() => {
    if (paginatedOrders.length === 0) return false;
    return paginatedOrders.every(o => selectedIds.has(o._id));
  }, [paginatedOrders, selectedIds]);

  // Bulk Actions
  const handleBulkMarkDelivered = async () => {
    try {
      const updates = Array.from(selectedIds).map(id => onUpdateStatus(id, 'Delivered'));
      await Promise.all(updates);
      setSelectedIds(new Set());
      alert('Selected orders successfully marked as Delivered.');
    } catch (err) {
      console.error(err);
      alert('Could not update some orders.');
    }
  };

  const handleBulkDelete = () => {
    alert(`Bulk deleting ${selectedIds.size} orders is restricted for security. Please cancel them manually.`);
    setSelectedIds(new Set());
  };

  const handleExportCSV = (specificIds?: Set<string>) => {
    const targets = specificIds ? orders.filter(o => specificIds.has(o._id)) : filteredOrders;
    if (targets.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Amount', 'Payment Method', 'Status'];
    const rows = targets.map(o => [
      o._id,
      o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Unknown',
      o.customer_name,
      o.customer_email || 'N/A',
      o.total_amount,
      o.payment_method || 'COD',
      o.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CrochetCreation_Orders_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4">
      
      {/* Table Utility Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left Search + Filter Bars */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search order ID, buyer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none placeholder-gray-400 font-semibold shadow-sm w-56 text-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {/* Fulfillment Status */}
          <select
            value={fulfillmentFilter}
            onChange={(e) => { setFulfillmentFilter(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm focus:outline-none cursor-pointer hover:border-gray-300"
          >
            <option value="ALL">Fulfillment: All</option>
            <option value="Pending">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm focus:outline-none cursor-pointer hover:border-gray-300"
          >
            <option value="ALL">Payment: All</option>
            <option value="Paid">Paid</option>
            <option value="Pending Validation">Pending Validation</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          {/* Date Picker Button */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm p-1">
            {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((range) => (
              <button
                key={range}
                onClick={() => { setDateRange(range); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                  dateRange === range
                    ? 'bg-slate-900 text-white'
                    : 'text-gray-400 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleExportCSV()}
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" /> Export CSV
          </button>
        </div>

      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md text-[10px]">
              {selectedIds.size}
            </span>
            <span>Items Selected</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleExportCSV(selectedIds)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> CSV Export
            </button>
            <button
              onClick={handleBulkMarkDelivered}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark Delivered
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enterprise Data Grid */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 select-none">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Payment Status</th>
              <th className="py-3 px-4">Fulfillment Phase</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4 text-right sticky right-0 bg-gray-50/75">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-semibold">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400 text-xs">
                  No order registers found in matching ledger filters.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const { initials, colorClass } = getAvatarDetails(order.customer_name);
                const { paymentStatus, paymentStyle, paymentDot } = getOrderStatuses(order);
                const isSelected = selectedIds.has(order._id);
                const needsAttention = paymentStatus === 'Pending Validation' || paymentStatus === 'Unpaid';

                return (
                  <tr 
                    key={order._id} 
                    onClick={() => onOpenDrawer(order)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                      isSelected ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    {/* Checkbox cell with attention left border */}
                    <td 
                      className={`py-3.5 px-4 border-l-4 transition-colors ${
                        needsAttention ? 'border-l-amber-400' : 'border-l-transparent'
                      }`}
                      onClick={(e) => e.stopPropagation()} // Stop drawer from opening
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(e, order._id)}
                        className="w-4 h-4 rounded border-gray-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                    </td>
                    
                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ORD-{order._id?.slice(-6).toUpperCase()}
                    </td>
                    
                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-450 font-medium">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] ring-1 ${colorClass}`}>
                          {initials}
                        </div>
                        <div className="text-left">
                          <p className="text-slate-900 font-bold">{order.customer_name}</p>
                          <p className="text-[10px] text-gray-400 font-normal leading-tight">{order.customer_email}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Payment Status badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ${paymentStyle}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${paymentDot} ${
                          paymentStatus === 'Pending Validation' ? 'animate-pulse' : ''
                        }`} />
                        {paymentStatus}
                      </span>
                    </td>
                    
                    {/* Fulfillment Status badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ${
                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                        order.status === 'Pending' || order.status === 'Confirmed' ? 'bg-teal-50 text-teal-700 ring-teal-200' :
                        order.status === 'Processing' ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                        'bg-rose-50 text-rose-700 ring-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'Delivered' ? 'bg-emerald-500' :
                          order.status === 'Pending' || order.status === 'Confirmed' ? 'bg-teal-500' :
                          order.status === 'Processing' ? 'bg-blue-500' :
                          'bg-rose-500'
                        }`} />
                        {order.status === 'Pending' || order.status === 'Confirmed' ? 'CONFIRMED' : order.status.toUpperCase()}
                      </span>
                    </td>
                    
                    {/* Price */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-800">
                      ₹{order.total_amount?.toFixed(2)}
                    </td>
                    
                    {/* Actions column */}
                    <td 
                      className="py-3.5 px-4 text-right sticky right-0 bg-white hover:bg-slate-50/50"
                      onClick={(e) => e.stopPropagation()} // Stop drawer from opening
                    >
                      <div className="flex items-center justify-end relative">
                        <button
                          onClick={() => setActiveMenuOrderId(activeMenuOrderId === order._id ? null : order._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-slate-900 hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeMenuOrderId === order._id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActiveMenuOrderId(null)}></div>
                            <div className="absolute right-4 mt-8 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-45 animate-in fade-in-50 slide-in-from-top-2 duration-150 text-left">
                              <button
                                onClick={() => {
                                  onOpenDrawer(order);
                                  setActiveMenuOrderId(null);
                                }}
                                className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-400" />
                                View Details
                              </button>
                              
                              {paymentStatus === 'Pending Validation' && (
                                <button
                                  onClick={() => {
                                    onValidatePayment(order._id);
                                    setActiveMenuOrderId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-amber-700 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                                  Validate Payment
                                </button>
                              )}

                              <button
                                disabled={downloadingId === order._id}
                                onClick={async () => {
                                  setDownloadingId(order._id);
                                  try {
                                    await onDownloadInvoice(order._id);
                                  } finally {
                                    setDownloadingId(null);
                                    setActiveMenuOrderId(null);
                                  }
                                }}
                                className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2 border-t border-gray-100 mt-1 pt-1 disabled:opacity-50"
                              >
                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                {downloadingId === order._id ? 'Downloading...' : 'Download Invoice'}
                              </button>

                              {order.status !== 'Cancelled' && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Are you sure you want to cancel Order #ORD-${order._id.slice(-6).toUpperCase()}?`)) {
                                      await onUpdateStatus(order._id, 'Cancelled');
                                      setActiveMenuOrderId(null);
                                    }
                                  }}
                                  className="w-full px-4 py-2 hover:bg-rose-50 text-xs font-semibold text-rose-600 flex items-center gap-2 border-t border-gray-100 mt-1 pt-1"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-500" />
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">
          Showing {filteredOrders.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
        </span>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page === 1}
            onClick={() => setPage(prev => prev - 1)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-extrabold text-slate-900 px-3">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(prev => prev + 1)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
