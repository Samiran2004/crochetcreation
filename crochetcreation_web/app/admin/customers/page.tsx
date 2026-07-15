'use client';
import { apiFetch } from '../../utils/apiFetch';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  IndianRupee, 
  Search,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  orders: number;
  spent: number;
}

export default function AdminCustomers() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
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

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const res = await apiFetch(`${API_URL}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const formatted: Customer[] = data.map((c: any) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          email: c.email,
          mobile: c.mobile,
          orders: c.orders_count || 0,
          spent: c.total_spent || 0.0
        }));
        setCustomers(formatted);
      } else {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
        } else {
          setError("Failed to fetch customers from server.");
        }
      }
    } catch (err) {
      console.error("Customers fetch failed:", err);
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [API_URL, router]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile.includes(searchQuery)
  );

  const totalSpentAll = useMemo(() => {
    return customers.reduce((acc, c) => acc + c.spent, 0.0);
  }, [customers]);

  const totalOrdersAll = useMemo(() => {
    return customers.reduce((acc, c) => acc + c.orders, 0);
  }, [customers]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-850">Customer Profiles</h2>
          <p className="text-xs text-stone-455 mt-1">
            Browse registered clients, audit purchase counts, and inspect messaging coordinates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchCustomers}
            className="p-2.5 hover:bg-stone-50 border border-stone-200 rounded-xl transition-all"
            title="Refresh Customers List"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-stone-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Clients', value: customers.length, color: 'bg-[#6B5656]/5 text-[#6B5656] border-[#6B5656]/10', icon: Users },
          { label: 'Total Order Registrations', value: totalOrdersAll, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: ShoppingBag },
          { label: 'Total Value Captured', value: `₹${totalSpentAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'bg-amber-50 text-amber-700 border-amber-100', icon: IndianRupee },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`p-5 border rounded-2xl flex items-center justify-between bg-white shadow-sm hover:shadow-md transition-all duration-300`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-450">{item.label}</span>
                <h3 className="text-xl font-bold text-stone-800">{item.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Input bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center bg-[#F7F5F2] border border-stone-200 px-3 py-1.5 rounded-xl gap-2 w-full sm:w-80 focus-within:border-[#D9B4B4] transition-all">
          <Search className="w-3.5 h-3.5 text-stone-450" />
          <input
            type="text"
            placeholder="Search by client name, email, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-stone-400 text-stone-750"
          />
        </div>
      </div>

      {/* Customers List Grid */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-stone-500 text-xs font-semibold">
            Loading customer records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-450 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Artisan User</th>
                  <th className="py-3 px-5">Mobile</th>
                  <th className="py-3 px-5">Total Orders</th>
                  <th className="py-3 px-5">Spent Aggregate</th>
                  <th className="py-3 px-5 text-right">Reach Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-450 font-medium">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-4 px-5 font-bold text-[#6B5656]">CST-{c.id.slice(-4).toUpperCase()}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#6B5656]/5 text-[#6B5656] flex items-center justify-center font-bold text-xs uppercase shadow-inner border border-[#6B5656]/10 shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-850">{c.name}</div>
                            <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-2.5 h-2.5" /> {c.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-stone-500 font-medium font-mono">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-stone-400" /> {c.mobile}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-bold text-stone-800">{c.orders} orders</td>
                      <td className="py-4 px-5 font-bold text-stone-850">₹{c.spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-5 text-right">
                        <a 
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-[#D9B4B4] bg-white hover:bg-stone-50 text-[10px] font-bold text-stone-650 uppercase tracking-wider transition-all"
                        >
                          <MessageSquare className="w-3 h-3 text-stone-400" /> Message
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
