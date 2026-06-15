'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
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
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  
  const [statsData, setStatsData] = useState({
    total_revenue: 0.0,
    total_orders: 0,
    products_count: 0,
    customers_count: 0,
    recent_orders: [] as any[],
    alerts: [] as any[]
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/');
          return;
        }

        const res = await fetch(`${API_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        } else {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/');
          } else {
            setError("Failed to fetch dashboard stats.");
          }
        }
      } catch (err) {
        console.error("Dashboard stats fetch failed:", err);
        setError("Could not connect to backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [API_URL, router]);

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${statsData.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: 'Lifetime earnings',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: statsData.total_orders.toString(),
      change: 'All-time placements',
      icon: ShoppingBag,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Active Catalog',
      value: statsData.products_count.toString(),
      change: 'Fully managed items',
      icon: TrendingUp,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: 'Total Customers',
      value: statsData.customers_count.toString(),
      change: 'Registered artisans/buyers',
      icon: Users,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#6B5656] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Loading Dashboard Data...</span>
        </div>
      </div>
    );
  }

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
        <button 
          onClick={() => router.push('/')}
          className="bg-[#FEF9F6] text-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] transition-all duration-350 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95"
        >
          View Live Site <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

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
            <span 
              onClick={() => router.push('/admin/orders')}
              className="text-[10px] font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:text-[#6B5656] transition-colors"
            >
              View All
            </span>
          </div>

          <div className="overflow-x-auto">
            {statsData.recent_orders.length === 0 ? (
              <div className="text-center py-8 text-stone-450 text-xs font-medium">
                No orders registered yet. Start sharing your creations to get sales!
              </div>
            ) : (
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
                  {statsData.recent_orders.map((order) => {
                    let statusColor = "bg-stone-100 text-stone-800";
                    if (order.status === "Delivered") statusColor = "bg-emerald-100 text-emerald-800";
                    if (order.status === "Pending") statusColor = "bg-amber-100 text-amber-800";
                    if (order.status === "Processing") statusColor = "bg-sky-100 text-sky-800";
                    if (order.status === "Cancelled") statusColor = "bg-rose-100 text-rose-800";

                    return (
                      <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#6B5656] truncate max-w-[100px]">ORD-{order.id.slice(-6).toUpperCase()}</td>
                        <td className="py-3.5 px-4 font-medium text-stone-800">{order.customer}</td>
                        <td className="py-3.5 px-4 text-stone-500 max-w-[200px] truncate">{order.items}</td>
                        <td className="py-3.5 px-4 font-bold text-stone-800">₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-4 text-stone-500">{order.date.split(' ')[0]}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Workshop Updates & Alerts */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-serif text-sm font-bold text-stone-800 uppercase tracking-wide">Workshop Alerts</h3>
          
          <div className="space-y-3">
            {statsData.alerts.map((alert, idx) => {
              let Icon = Clock;
              if (alert.type === "payout") Icon = CheckCircle;
              if (alert.type === "stock") Icon = AlertCircle;

              return (
                <div key={idx} className={`flex gap-3.5 p-3 rounded-xl border ${alert.color}`}>
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">{alert.title}</h4>
                    <p className="text-[10px] opacity-90 mt-0.5">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
