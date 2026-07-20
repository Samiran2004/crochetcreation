'use client';
import { apiFetch } from '../../../utils/apiFetch';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  User,
  Mail,
  Phone,
  StickyNote,
  Package,
  IndianRupee,
  Hash,
  AlertCircle
} from 'lucide-react';

interface LineItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export default function CreateManualOrder() {
  const router = useRouter();

  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { id: Math.random().toString(36).substring(2, 9), title: '', price: 0, quantity: 1 }
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Computed total
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Item management
  const addItem = () => {
    setItems(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), title: '', price: 0, quantity: 1 }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'price') return { ...item, price: Math.max(0, Number(value)) };
      if (field === 'quantity') return { ...item, quantity: Math.max(1, Math.floor(Number(value))) };
      return { ...item, [field]: value };
    }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLinkedAccount(null);

    // Validation
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    const validItems = items.filter(i => i.title.trim() && i.price > 0);
    if (validItems.length === 0) {
      setError('Add at least one item with a valid name and price.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const payload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || null,
        customer_mobile: customerMobile.trim() || null,
        items: validItems.map(i => ({
          product_id: null,
          title: i.title.trim(),
          price: i.price,
          quantity: i.quantity
        })),
        total_amount: validItems.reduce((s, i) => s + i.price * i.quantity, 0),
        payment_method: paymentMethod,
        notes: notes.trim() || null
      };

      const res = await apiFetch(`${API_URL}/api/orders/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create manual order.');
      }

      const data = await res.json();
      const orderData = data.order || data;
      const wasEmailSent = data.email_sent === true;

      setEmailSent(wasEmailSent);
      if (orderData.user_id) {
        setLinkedAccount(orderData.customer_email || customerEmail);
      }

      // Show conditional toast
      if (wasEmailSent) {
        showToast('Order created successfully! Confirmation email sent to user.', 'success');
      } else {
        showToast('Manual order logged successfully (No email linked).', 'info');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in-50 duration-300">
        <div className="bg-white border border-stone-200 rounded-3xl shadow-sm p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-stone-800">
              Manual Order Created
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed max-w-sm mx-auto">
              The order for <span className="font-bold text-stone-700">{customerName}</span> has been
              successfully recorded with a total of{' '}
              <span className="font-bold text-[#6B5656]">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>.
            </p>
            {linkedAccount && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 inline-block mt-2">
                ✓ Linked to registered account: <span className="font-bold">{linkedAccount}</span>
              </p>
            )}
            {emailSent ? (
              <p className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 inline-block mt-1">
                ✉️ Confirmation email sent to the customer.
              </p>
            ) : (
              <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 inline-block mt-1">
                No email linked — order logged without notification.
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSuccess(false);
                setCustomerName('');
                setCustomerEmail('');
                setCustomerMobile('');
                setNotes('');
                setPaymentMethod('COD');
                setItems([{ id: Math.random().toString(36).substring(2, 9), title: '', price: 0, quantity: 1 }]);
                setLinkedAccount(null);
                setEmailSent(false);
              }}
              className="bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all"
            >
              Create Another
            </button>
            <button
              onClick={() => router.push('/admin/orders')}
              className="bg-[#6B5656] hover:bg-[#4A3E3E] text-white font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all shadow-sm"
            >
              View All Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/orders')}
          className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all active:scale-95 shadow-sm"
          title="Back to Orders"
        >
          <ArrowLeft className="w-4 h-4 text-stone-600" />
        </button>
        <div>
          <h1 className="font-serif text-xl font-bold text-stone-800 tracking-wide">
            Create Manual Order
          </h1>
          <p className="text-[11px] text-stone-450 mt-0.5">
            Log orders received via WhatsApp, Instagram, or custom requests.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in-50 duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-rose-800">{error}</p>
          </div>
        )}

        {/* Customer Details Section */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-stone-50/50 border-b border-stone-100 px-6 py-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#6B5656]" />
              Customer Details
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Customer Name */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name of the customer"
                  className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#D9B4B4] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Customer Email */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                  Customer Email
                  <span className="ml-1.5 text-[8px] font-semibold normal-case text-stone-350 tracking-normal">(links to account if registered)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#D9B4B4] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Customer Mobile */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                  Customer Mobile
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="Phone number"
                    className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#D9B4B4] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Section */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-stone-50/50 border-b border-stone-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-[#6B5656]" />
              Order Items
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 bg-[#6B5656] hover:bg-[#4A3E3E] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
          </div>
          <div className="p-6 space-y-4">
            {/* Column Headers */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-1 text-[9px] font-black uppercase tracking-widest text-stone-400">
              <div className="col-span-6">Item Name / Description</div>
              <div className="col-span-2">Price (₹)</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {items.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#FEF9F6]/30 border border-stone-100 rounded-xl p-4 sm:p-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center group hover:border-[#D9B4B4]/40 transition-colors"
              >
                {/* Item Name */}
                <div className="sm:col-span-6">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 sm:hidden">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                    placeholder={`Item ${idx + 1} — e.g. Custom Pink Shawl`}
                    className="w-full bg-white border border-stone-100 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-all"
                  />
                </div>

                {/* Price */}
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 sm:hidden">
                    Price (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ''}
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white border border-stone-100 rounded-lg pl-7 pr-2 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-all"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 sm:hidden">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    className="w-full bg-white border border-stone-100 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#D9B4B4] transition-all text-center"
                  />
                </div>

                {/* Subtotal + Delete */}
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                  <span className="text-xs font-bold text-[#6B5656]">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-stone-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Grand Total */}
            <div className="flex items-center justify-between bg-[#6B5656]/5 border border-[#D9B4B4]/30 rounded-xl px-5 py-4 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                Grand Total
              </span>
              <span className="text-lg font-bold text-[#6B5656]">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment & Notes Section */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-stone-50/50 border-b border-stone-100 px-6 py-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <StickyNote className="w-3.5 h-3.5 text-[#6B5656]" />
              Payment & Notes
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Payment Method */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">
                Payment Method
              </label>
              <div className="flex flex-wrap gap-2">
                {['COD', 'UPI', 'CARD', 'Prepaid'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 active:scale-95 ${
                      paymentMethod === method
                        ? 'bg-[#6B5656] text-white border-[#6B5656] shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                Internal Notes
                <span className="ml-1.5 text-[8px] font-semibold normal-case text-stone-350 tracking-normal">(only visible to admin)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. WhatsApp order — needs pink yarn, custom size Large, deliver by Friday..."
                rows={3}
                className="w-full bg-[#FEF9F6]/40 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#D9B4B4] focus:bg-white transition-all resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between bg-white border border-stone-200 rounded-2xl shadow-sm px-6 py-5">
          <button
            type="button"
            onClick={() => router.push('/admin/orders')}
            className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-700 transition-colors py-2.5 px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2.5 bg-[#6B5656] hover:bg-[#4A3E3E] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3 px-8 rounded-xl transition-all shadow-sm active:scale-95"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{loading ? 'Creating...' : 'Create Order'}</span>
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-sky-50 border-sky-200 text-sky-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Mail className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <p className="text-xs font-semibold">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-stone-400 hover:text-stone-700 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
