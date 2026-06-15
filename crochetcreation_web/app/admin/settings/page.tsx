'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Store, 
  CreditCard, 
  Bell, 
  Save, 
  Check, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettings() {
  const router = useRouter();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    storeName: 'CrochetCreation',
    supportEmail: 'support@crochetcreation.com',
    supportPhone: '+91 86375 10045',
    currency: 'INR',
    enableCOD: true,
    enableUPI: true,
    upiId: 'samiran.samanta@upi',
    maxCustomRequestsPerDay: '5',
    enableEmailNotifications: true,
  });

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
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            storeName: data.store_name,
            supportEmail: data.support_email,
            supportPhone: data.support_phone,
            currency: data.currency,
            enableCOD: data.enable_cod,
            enableUPI: data.enable_upi,
            upiId: data.upi_id,
            maxCustomRequestsPerDay: data.max_custom_requests_per_day.toString(),
            enableEmailNotifications: data.enable_email_notifications ?? true,
          });
        } else {
          setError("Failed to fetch settings from server.");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Failed to connect to backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [API_URL]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const payload = {
        store_name: formData.storeName,
        support_email: formData.supportEmail,
        support_phone: formData.supportPhone,
        currency: formData.currency,
        enable_cod: formData.enableCOD,
        enable_upi: formData.enableUPI,
        upi_id: formData.upiId,
        max_custom_requests_per_day: parseInt(formData.maxCustomRequestsPerDay) || 5,
        enable_email_notifications: formData.enableEmailNotifications,
      };

      const res = await fetch(`${API_URL}/api/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        const errData = await res.json();
        setError(errData.detail || "Failed to save settings.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setError("Failed to connect to backend server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#6B5656] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Loading Global Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-850">Global Workshop Settings</h2>
          <p className="text-xs text-stone-455 mt-1">
            Configure storefront identity, payment modes, custom artisan limits, and logging.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="w-4 h-4 text-emerald-600" />
            Settings saved successfully! Workshop variables reloaded.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main settings form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Settings */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-stone-100">
                <Store className="w-5 h-5 text-[#6B5656]" />
                <h3 className="font-serif text-sm font-bold text-stone-850 uppercase tracking-wider">General Configuration</h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Storefront Brand Name</label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleInputChange}
                      className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Store Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 font-bold"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Artisan Support Email</label>
                    <input
                      type="email"
                      name="supportEmail"
                      value={formData.supportEmail}
                      onChange={handleInputChange}
                      className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Support Phone Number</label>
                    <input
                      type="text"
                      name="supportPhone"
                      value={formData.supportPhone}
                      onChange={handleInputChange}
                      className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Gateway Settings */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-stone-100">
                <CreditCard className="w-5 h-5 text-[#6B5656]" />
                <h3 className="font-serif text-sm font-bold text-stone-850 uppercase tracking-wider">Payment Options & Integrations</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50/50 border border-stone-100">
                  <div>
                    <h4 className="font-bold text-stone-800">Cash on Delivery (COD)</h4>
                    <p className="text-[10px] text-stone-450 mt-0.5">Allow buyers to pay when delivery arrives at their address.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enableCOD"
                      checked={formData.enableCOD}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6B5656]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50/50 border border-stone-100">
                  <div>
                    <h4 className="font-bold text-stone-800">Direct UPI Gateway</h4>
                    <p className="text-[10px] text-stone-450 mt-0.5">Collect digital payments using barcode or instant VPA routing.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enableUPI"
                      checked={formData.enableUPI}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6B5656]"></div>
                  </label>
                </div>

                {formData.enableUPI && (
                  <div className="space-y-1 p-3.5 bg-[#FEF9F6] border border-[#D9B4B4]/40 rounded-xl animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">UPI VPA Address</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="e.g. name@upi"
                      className="w-full bg-white border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Custom Request Configuration */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-stone-100">
                <FileText className="w-5 h-5 text-[#6B5656]" />
                <h3 className="font-serif text-sm font-bold text-stone-850 uppercase tracking-wider">Custom Creation Settings</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Max Custom Requests per Day</label>
                  <input
                    type="number"
                    name="maxCustomRequestsPerDay"
                    value={formData.maxCustomRequestsPerDay}
                    onChange={handleInputChange}
                    className="w-full sm:w-48 bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 font-bold"
                  />
                  <p className="text-[9px] text-stone-400 mt-1">Prevents workshop overload by disabling submission forms after limits are reached.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Side panel: Tips & Save Action */}
          <div className="space-y-6">
            
            {/* Save Settings Action */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">Apply Changes</h4>
              <p className="text-xs text-stone-450 leading-relaxed">
                Ensure all parameters (specifically UPI and currencies) match physical inventory limits before committing.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all duration-350 active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Helper tips block */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#6B5656] font-bold">
                <HelpCircle className="w-4.5 h-4.5" />
                <h4 className="uppercase tracking-wider text-[10px]">Need Help?</h4>
              </div>
              <p className="text-stone-500 leading-relaxed">
                These settings configure options globally across storefront requests. Changing the store currency or name takes effect immediately.
              </p>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
