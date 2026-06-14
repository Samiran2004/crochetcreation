'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';

interface Order {
  id: string;
  customer: string;
  email: string;
  items: string;
  amount: string;
  date: string;
  status: 'Delivered' | 'Pending' | 'Processing' | 'Cancelled';
  payment: string;
}

export default function AdminOrders() {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Processing' | 'Delivered' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const initialOrders: Order[] = [
    { id: 'ORD-9831', customer: 'Anuradha Roy', email: 'anuradha@gmail.com', items: 'Crochet Teddy Bear (1)', amount: '₹1,999.00', date: '2026-06-14 20:15', status: 'Delivered', payment: 'UPI' },
    { id: 'ORD-9830', customer: 'Sayan Banerjee', email: 'sayan.b@yahoo.com', items: 'Warm Woolen Scarf (1), Coasters (4)', amount: '₹2,450.00', date: '2026-06-14 18:30', status: 'Pending', payment: 'Cash on Delivery' },
    { id: 'ORD-9829', customer: 'Priyanka Das', email: 'das.priyanka@gmail.com', items: 'Crochet Hanging Planter (2)', amount: '₹1,299.00', date: '2026-06-14 15:45', status: 'Processing', payment: 'Card' },
    { id: 'ORD-9828', customer: 'Rahul Sharma', email: 'rahul.sharma@outlook.com', items: 'Amigurumi Keychain Set (3)', amount: '₹899.00', date: '2026-06-13 11:20', status: 'Delivered', payment: 'UPI' },
    { id: 'ORD-9827', customer: 'Nandini Sen', email: 'sen.nandini@gmail.com', items: 'Knitted Baby Blanket (1)', amount: '₹3,200.00', date: '2026-06-12 09:10', status: 'Delivered', payment: 'UPI' },
    { id: 'ORD-9826', customer: 'Joydeep Ghosh', email: 'joydeep.g@gmail.com', items: 'Woolen Cozies (6)', amount: '₹1,150.00', date: '2026-06-11 14:00', status: 'Cancelled', payment: 'Card' },
  ];

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleUpdateStatus = (orderId: string, newStatus: 'Delivered' | 'Pending' | 'Processing' | 'Cancelled') => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Processing':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'All' || order.status === filter;
    const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.items.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-850">Order History & Logs</h2>
          <p className="text-xs text-stone-450 mt-1">
            Track purchase orders, edit shipping dispatch status, and manage payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setOrders(initialOrders)}
            className="p-2.5 hover:bg-stone-50 border border-stone-200 rounded-xl transition-all"
            title="Reset to Initial Data"
          >
            <RefreshCw className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', count: orders.length, color: 'text-stone-700 bg-white' },
          { label: 'Pending Packings', count: orders.filter(o => o.status === 'Pending').length, color: 'text-amber-700 bg-amber-50/50 border-amber-100' },
          { label: 'Processing Dispatch', count: orders.filter(o => o.status === 'Processing').length, color: 'text-sky-700 bg-sky-50/50 border-sky-100' },
          { label: 'Delivered Products', count: orders.filter(o => o.status === 'Delivered').length, color: 'text-emerald-700 bg-emerald-50/50 border-emerald-100' },
        ].map((item, i) => (
          <div key={i} className={`p-4 border border-stone-200 rounded-xl flex items-center justify-between ${item.color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{item.label}</span>
            <span className="text-lg font-bold">{item.count}</span>
          </div>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-2 hidden sm:inline">Filter:</span>
          {(['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                filter === tab 
                  ? 'bg-[#6B5656] text-white' 
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center bg-[#F7F5F2] border border-stone-200 px-3 py-1.5 rounded-xl gap-2 w-full md:w-64 focus-within:border-[#D9B4B4] transition-all">
          <Search className="w-3.5 h-3.5 text-stone-450" />
          <input
            type="text"
            placeholder="Search by ID, name, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-stone-400 text-stone-750"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Orders Table list */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 font-medium">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? 'bg-stone-50' : 'hover:bg-stone-50/50'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-[#6B5656]">{order.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-850">{order.customer}</div>
                        <div className="text-[10px] text-stone-400 truncate max-w-[120px]">{order.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">{order.date.split(' ')[0]}</td>
                      <td className="py-3.5 px-4 font-bold text-stone-800">{order.amount}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1 hover:bg-stone-100 rounded-lg text-stone-450 hover:text-stone-700 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Panel */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 space-y-4">
          {selectedOrder ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="font-bold text-stone-800 text-xs uppercase tracking-wider">Order Specifications</span>
                <span className="font-mono font-bold text-[#6B5656] text-xs">{selectedOrder.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Client details</label>
                  <p className="font-semibold text-stone-800 mt-0.5">{selectedOrder.customer}</p>
                  <p className="text-stone-550 text-[10px]">{selectedOrder.email}</p>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Items purchased</label>
                  <p className="text-stone-700 font-medium mt-0.5 leading-relaxed">{selectedOrder.items}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Payment mode</label>
                    <p className="text-stone-700 font-semibold mt-0.5">{selectedOrder.payment}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Total fee</label>
                    <p className="text-stone-900 font-bold mt-0.5">{selectedOrder.amount}</p>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Modify Dispatch State</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Pending', 'Processing', 'Delivered', 'Cancelled'] as const).map(state => (
                      <button
                        key={state}
                        onClick={() => handleUpdateStatus(selectedOrder.id, state)}
                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                          selectedOrder.status === state
                            ? 'bg-[#6B5656] text-white border-transparent shadow-sm'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-650'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-stone-400 space-y-3">
              <ShoppingBag className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs font-semibold uppercase tracking-wider">Select an order details block</p>
              <p className="text-[10px] text-stone-450 leading-relaxed px-4">
                Click any transaction row in the catalog list to inspect buyer configurations, totals, and state changes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
