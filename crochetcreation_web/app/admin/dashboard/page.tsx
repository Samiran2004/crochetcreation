'use client';

import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    // Fetch products count dynamically to display accurate stats
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://crochetcreation.onrender.com';
        const res = await fetch(`${apiUrl}/api/products`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProductsCount(data.length);
          }
        }
      } catch (err) {
        console.error("Failed to fetch products count:", err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      title: 'Total Revenue',
      value: '₹42,850.00',
      change: '+14.2% vs last month',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: '184',
      change: '+8.3% vs last month',
      icon: ShoppingBag,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Active Catalog',
      value: productsCount || '12',
      change: 'Fully managed items',
      icon: TrendingUp,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: 'New Artisans',
      value: '89',
      change: '+22.5% this week',
      icon: Users,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
  ];

  const recentOrders = [
    { id: 'ORD-9831', customer: 'Anuradha Roy', items: 'Crochet Teddy Bear (1)', amount: '₹1,999.00', date: 'Just now', status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'ORD-9830', customer: 'Sayan Banerjee', items: 'Warm Woolen Scarf (1), Coasters (4)', amount: '₹2,450.00', date: '2 hours ago', status: 'Pending', statusColor: 'bg-amber-100 text-amber-800' },
    { id: 'ORD-9829', customer: 'Priyanka Das', items: 'Crochet Hanging Planter (2)', amount: '₹1,299.00', date: '5 hours ago', status: 'Processing', statusColor: 'bg-sky-100 text-sky-800' },
    { id: 'ORD-9828', customer: 'Rahul Sharma', items: 'Amigurumi Keychain Set (3)', amount: '₹899.00', date: 'Yesterday', status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'ORD-9827', customer: 'Nandini Sen', items: 'Knitted Baby Blanket (1)', amount: '₹3,200.00', date: '2 days ago', status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Welcome Banner */}
      <div className="bg-[#6B5656] text-[#FEF9F6] p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold tracking-wide">Welcome back to your Workshop!</h2>
          <p className="text-xs text-stone-200 mt-1">
            Here is what is happening with your handmade crochet creations today.
          </p>
        </div>
        <button className="bg-[#FEF9F6] text-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] transition-all duration-350 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95">
          View Live Site <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-450 uppercase tracking-wider">{stat.title}</span>
                <h3 className="text-2xl font-bold text-stone-800">{stat.value}</h3>
                <p className="text-[10px] text-stone-500 font-medium">{stat.change}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${stat.color}`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-stone-800 uppercase tracking-wide">Recent Orders</h3>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:text-[#6B5656] transition-colors">
              View All
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-450 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Ordered</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#6B5656]">{order.id}</td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">{order.customer}</td>
                    <td className="py-3.5 px-4 text-stone-500 max-w-[200px] truncate">{order.items}</td>
                    <td className="py-3.5 px-4 font-bold text-stone-800">{order.amount}</td>
                    <td className="py-3.5 px-4 text-stone-500">{order.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workshop Updates & Alerts */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-serif text-sm font-bold text-stone-800 uppercase tracking-wide">Workshop Alerts</h3>
          
          <div className="space-y-3">
            <div className="flex gap-3.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800">Pending Order Packings</h4>
                <p className="text-[10px] text-amber-650 mt-0.5">
                  Order ORD-9830 requires premium wrapping box & thank you card.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800">Payout Released</h4>
                <p className="text-[10px] text-emerald-650 mt-0.5">
                  Artisan payouts for last month's items successfully processed.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 p-3 rounded-xl bg-rose-50 border border-rose-100">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800">Low Stock Warning</h4>
                <p className="text-[10px] text-rose-650 mt-0.5">
                  "Crochet Teddy Bear Amigurumi" only has 2 items left in stock.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
