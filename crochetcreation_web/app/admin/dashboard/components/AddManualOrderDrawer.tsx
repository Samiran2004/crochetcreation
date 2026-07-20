'use client';
import { apiFetch } from '../../../utils/apiFetch';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  IndianRupee, 
  Package, 
  Plus, 
  Trash2,
  Loader2,
  CreditCard
} from 'lucide-react';

interface OrderItemInput {
  title: string;
  price: number;
  quantity: number;
}

interface AddManualOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddManualOrderDrawer({ isOpen, onClose, onSuccess }: AddManualOrderDrawerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, UPI, Cash, Bank Transfer
  const [items, setItems] = useState<OrderItemInput[]>([{ title: '', price: 0, quantity: 1 }]);
  const [manualTotal, setManualTotal] = useState<string>('');

  // API Config
  const API_URL = (() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  })();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Sync drawer open animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setDrawerOpen(true), 50);
      return () => clearTimeout(timer);
    } else {
      setDrawerOpen(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setDrawerOpen(false);
    setTimeout(onClose, 300);
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerMobile('');
    setCustomerEmail('');
    setShippingAddress('');
    setNotes('');
    setPaymentMethod('COD');
    setItems([{ title: '', price: 0, quantity: 1 }]);
    setManualTotal('');
    setError(null);
  };

  // Items manipulation
  const addItem = () => setItems([...items, { title: '', price: 0, quantity: 1 }]);
  
  const updateItem = (index: number, field: keyof OrderItemInput, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calculatedTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const finalTotal = manualTotal !== '' ? parseFloat(manualTotal) : calculatedTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!token) throw new Error('Not authenticated');

      if (items.some(i => !i.title || i.price < 0 || i.quantity < 1)) {
        throw new Error('Please fill all item details correctly.');
      }

      const payload = {
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_mobile: customerMobile || null,
        shipping_address: shippingAddress || null,
        notes: notes || null,
        payment_method: paymentMethod,
        items: items,
        total_amount: finalTotal
      };

      const response = await fetch(`${API_URL}/api/orders/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create manual order');
      }

      resetForm();
      onSuccess();
      handleClose();

    } catch (err: any) {
      console.error('Manual order creation error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !drawerOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div 
        className={`relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Manual Order</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Add orders from DM, WhatsApp or offline sales.</p>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl flex items-center">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
              {error}
            </div>
          )}

          <form id="manual-order-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Customer Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Customer Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={customerMobile}
                      onChange={e => setCustomerMobile(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Shipping Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <textarea 
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      placeholder="Full delivery address..."
                      rows={2}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Items
                </h3>
                <button 
                  type="button"
                  onClick={addItem}
                  className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Item Name</label>
                      <input 
                        type="text" 
                        required
                        value={item.title}
                        onChange={e => updateItem(idx, 'title', e.target.value)}
                        placeholder="E.g. Custom Amigurumi Bear"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Price (₹)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={item.price}
                        onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="w-20 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Qty</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="mt-6 p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment & Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Payment Method</label>
                  <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="UPI">UPI / Online Payment</option>
                    <option value="Cash">Cash (In-person)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Override Total Amount (Optional)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      min="0"
                      value={manualTotal}
                      onChange={e => setManualTotal(e.target.value)}
                      placeholder={`Calculated: ₹${calculatedTotal}`}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Admin Notes / Source</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <textarea 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="E.g. Received via WhatsApp from Aunt Mary..."
                      rows={2}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between mt-4">
                <span className="text-sm font-black text-emerald-800 uppercase">Final Total</span>
                <span className="text-2xl font-black text-emerald-600">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button 
            type="button"
            onClick={handleClose}
            className="flex-1 py-3.5 bg-white border border-gray-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="manual-order-form"
            disabled={isSubmitting}
            className="flex-[2] py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg shadow-slate-900/20 disabled:opacity-70"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating Order...</>
            ) : (
              'Create Manual Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
