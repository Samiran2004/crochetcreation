'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  Search,
  MessageSquare
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  joined: string;
  orders: number;
  spent: string;
}

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const initialCustomers: Customer[] = [
    { id: 'CST-101', name: 'Anuradha Roy', email: 'anuradha@gmail.com', mobile: '9830098300', joined: '2026-05-12', orders: 8, spent: '₹12,450.00' },
    { id: 'CST-102', name: 'Sayan Banerjee', email: 'sayan.b@yahoo.com', mobile: '9876543210', joined: '2026-05-18', orders: 4, spent: '₹7,800.00' },
    { id: 'CST-103', name: 'Priyanka Das', email: 'das.priyanka@gmail.com', mobile: '8100123456', joined: '2026-05-29', orders: 12, spent: '₹19,250.00' },
    { id: 'CST-104', name: 'Rahul Sharma', email: 'rahul.sharma@outlook.com', mobile: '9007123456', joined: '2026-06-02', orders: 2, spent: '₹1,899.00' },
    { id: 'CST-105', name: 'Nandini Sen', email: 'sen.nandini@gmail.com', mobile: '8637512345', joined: '2026-06-04', orders: 3, spent: '₹5,400.00' },
    { id: 'CST-106', name: 'Joydeep Ghosh', email: 'joydeep.g@gmail.com', mobile: '9831123456', joined: '2026-06-11', orders: 1, spent: '₹1,150.00' },
  ];

  const [customers] = useState<Customer[]>(initialCustomers);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-850">Customer Profiles</h2>
          <p className="text-xs text-stone-450 mt-1">
            Browse registered clients, audit purchase counts, and inspect messaging coordinates.
          </p>
        </div>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Clients', value: customers.length, color: 'bg-[#6B5656]/5 text-[#6B5656] border-[#6B5656]/10', icon: Users },
          { label: 'Total Order Registrations', value: customers.reduce((acc, c) => acc + c.orders, 0), color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: ShoppingBag },
          { label: 'Total Value Captured', value: '₹47,949.00', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: DollarSign },
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-450 uppercase tracking-wider bg-stone-50/50">
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">Artisan User</th>
                <th className="py-3 px-5">Mobile</th>
                <th className="py-3 px-5">Date Registered</th>
                <th className="py-3 px-5">Total Orders</th>
                <th className="py-3 px-5">Spent Aggregate</th>
                <th className="py-3 px-5 text-right">Reach Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 font-medium">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 px-5 font-bold text-[#6B5656]">{c.id}</td>
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
                    <td className="py-4 px-5 text-stone-550 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-stone-400" /> {c.joined}
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-stone-800">{c.orders} orders</td>
                    <td className="py-4 px-5 font-bold text-stone-850">{c.spent}</td>
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
      </div>
    </div>
  );
}
