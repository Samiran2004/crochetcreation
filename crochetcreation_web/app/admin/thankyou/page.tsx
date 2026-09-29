'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Heart,
  Send,
  User,
  Mail,
  Phone,
  Link2,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Gift,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { apiFetch, getApiUrl } from '../../utils/apiFetch';

interface ThankYouEntry {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  unique_id: string;
  slug: string;
  thankyou_url: string;
  email_sent: boolean;
  created_at: string;
}

export default function AdminThankYou() {
  const [entries, setEntries] = useState<ThankYouEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const API_URL = useMemo(() => getApiUrl(), []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_URL}/api/admin/thankyou`);
      if (res.ok) {
        const data = await res.json();
        const formatted: ThankYouEntry[] = data.map((e: any) => ({
          id: e._id || e.id,
          name: e.name,
          email: e.email,
          mobile: e.mobile,
          unique_id: e.unique_id,
          slug: e.slug,
          thankyou_url: e.thankyou_url,
          email_sent: e.email_sent,
          created_at: e.created_at,
        }));
        setEntries(formatted);
      } else {
        setError('Failed to fetch thank-you entries.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setSubmitError('Customer name is required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const body: any = { name: formName.trim() };
      if (formEmail.trim()) body.email = formEmail.trim();
      if (formMobile.trim()) body.mobile = formMobile.trim();

      const res = await apiFetch(`${API_URL}/api/admin/thankyou`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.thankyou_url;
        setSubmitSuccess(url);
        setFormName('');
        setFormEmail('');
        setFormMobile('');
        // Refresh the list
        fetchEntries();
      } else {
        const errData = await res.json().catch(() => null);
        setSubmitError(
          errData?.detail || 'Failed to create thank-you entry. Please try again.'
        );
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const res = await apiFetch(`${API_URL}/api/admin/thankyou/${entryId}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch {
      // silent fail
    }
    setDeleteConfirmId(null);
  };

  const handleCopy = async (url: string, entryId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(entryId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(entryId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleWhatsAppShare = (url: string, name: string) => {
    const text = `Hi ${name}! 💖 Thank you so much for choosing Crochet Creation! Every purchase means the world to us.\n\nWe've created a special personalized thank-you page just for you! Click the link below to view it:\n${url}\n\nWarmest stitches,\nThe Crochet Creation Team 🧶`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.email && e.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.mobile && e.mobile.includes(searchQuery)) ||
      e.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C0663A] to-[#A5522C] flex items-center justify-center shadow-sm">
              <Heart className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-850 dark:text-parchment">
                Thank You Pages
              </h2>
              <p className="text-[10px] text-stone-450 dark:text-slate-500 mt-0.5">
                Generate personalized thank-you pages for your customers
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            className="p-2.5 hover:bg-stone-50 dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl transition-all"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 text-stone-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSubmitError(null);
              setSubmitSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              showForm
                ? 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700'
                : 'bg-[#1F4E4A] hover:bg-[#16403C] text-white shadow-sm'
            }`}
          >
            {showForm ? (
              <>
                <X className="w-3.5 h-3.5" /> Close
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> New Thank You
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-stone-100 dark:border-slate-800 px-5 py-3.5 bg-stone-50/50 dark:bg-slate-900/50">
            <h3 className="text-xs font-bold text-stone-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-3.5 h-3.5 text-[#C0663A]" />
              Create Thank You Page
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Customer Name */}
            <div>
              <label className="text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2.5 gap-2.5 focus-within:border-[#1F4E4A] dark:focus-within:border-parchment transition-colors">
                <User className="w-4 h-4 text-stone-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jhon Doe"
                  className="bg-transparent border-none text-sm focus:outline-none w-full text-stone-800 dark:text-slate-200 placeholder-stone-400 dark:placeholder-slate-600"
                  required
                />
              </div>
            </div>

            {/* Two-column: Email & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Email <span className="text-stone-300 dark:text-slate-600">(Optional)</span>
                </label>
                <div className="flex items-center bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2.5 gap-2.5 focus-within:border-[#1F4E4A] dark:focus-within:border-parchment transition-colors">
                  <Mail className="w-4 h-4 text-stone-400 dark:text-slate-500 shrink-0" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="bg-transparent border-none text-sm focus:outline-none w-full text-stone-800 dark:text-slate-200 placeholder-stone-400 dark:placeholder-slate-600"
                  />
                </div>
                <p className="text-[9px] text-stone-400 dark:text-slate-600 mt-1 ml-1">
                  If provided, thank-you page will be emailed automatically
                </p>
              </div>

              {/* Mobile */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Mobile Number <span className="text-stone-300 dark:text-slate-600">(Optional)</span>
                </label>
                <div className="flex items-center bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2.5 gap-2.5 focus-within:border-[#1F4E4A] dark:focus-within:border-parchment transition-colors">
                  <Phone className="w-4 h-4 text-stone-400 dark:text-slate-500 shrink-0" />
                  <input
                    type="tel"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="bg-transparent border-none text-sm focus:outline-none w-full text-stone-800 dark:text-slate-200 placeholder-stone-400 dark:placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Error / Success */}
            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-xs font-semibold">
                <XCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Thank-you page created successfully!
                </div>
                <div className="flex items-center gap-2 bg-emerald-100/60 dark:bg-emerald-900/30 px-3 py-2 rounded-lg">
                  <Link2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate font-mono">
                    {submitSuccess}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(submitSuccess!, 'success')}
                    className="ml-auto shrink-0 p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/30 rounded transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === 'success' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !formName.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#1F4E4A] hover:bg-[#16403C] disabled:bg-stone-300 dark:disabled:bg-slate-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-sm transition-all disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Thank You Page
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            label: 'Total Thank You Pages',
            value: entries.length,
            color:
              'bg-[#C0663A]/5 text-[#C0663A] border-[#C0663A]/10',
            icon: Heart,
          },
          {
            label: 'Emails Sent',
            value: entries.filter((e) => e.email_sent).length,
            color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            icon: CheckCircle2,
          },
          {
            label: 'Pending Emails',
            value: entries.filter((e) => e.email && !e.email_sent).length,
            color: 'bg-amber-50 text-amber-700 border-amber-100',
            icon: Mail,
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-5 border border-stone-200 dark:border-slate-800 rounded-2xl flex items-center justify-between bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-450 dark:text-slate-500">
                  {item.label}
                </span>
                <h3 className="text-xl font-bold text-stone-800 dark:text-parchment">
                  {item.value}
                </h3>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center bg-[#F7F5F2] dark:bg-slate-950 border border-stone-200 dark:border-slate-700 px-3 py-1.5 rounded-xl gap-2 w-full sm:w-80 focus-within:border-[#1F4E4A] dark:focus-within:border-parchment transition-all">
          <Search className="w-3.5 h-3.5 text-stone-450 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, mobile, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-stone-400 dark:placeholder-slate-600 text-stone-750 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-stone-500 dark:text-slate-400 text-xs font-semibold">
            Loading thank-you entries...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 dark:border-slate-800 text-[10px] font-bold text-stone-450 dark:text-slate-500 uppercase tracking-wider bg-stone-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Contact</th>
                  <th className="py-3 px-5">Thank You URL</th>
                  <th className="py-3 px-5">Email Status</th>
                  <th className="py-3 px-5">Created</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-stone-450 dark:text-slate-500 font-medium"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center">
                          <Heart className="w-6 h-6 text-stone-300 dark:text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-500 dark:text-slate-400">
                            {searchQuery
                              ? 'No matching entries found'
                              : 'No thank-you pages yet'}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-slate-600 mt-0.5">
                            {searchQuery
                              ? 'Try a different search term'
                              : 'Click "New Thank You" to create your first page'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Customer */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C0663A]/10 to-[#C0663A]/5 text-[#C0663A] flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-[#C0663A]/10">
                            {entry.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-850 dark:text-parchment">
                              {entry.name}
                            </div>
                            <div className="text-[10px] text-stone-400 dark:text-slate-600 font-mono mt-0.5">
                              {entry.unique_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          {entry.email ? (
                            <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-400">
                              <Mail className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                              <span className="truncate max-w-[140px]">
                                {entry.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-300 dark:text-slate-700 text-[10px]">
                              No email
                            </span>
                          )}
                          {entry.mobile ? (
                            <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-400">
                              <Phone className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                              <span className="font-mono">{entry.mobile}</span>
                            </div>
                          ) : (
                            <span className="text-stone-300 dark:text-slate-700 text-[10px]">
                              No mobile
                            </span>
                          )}
                        </div>
                      </td>

                      {/* URL */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-2 max-w-[220px]">
                            <Link2 className="w-3 h-3 text-stone-400 dark:text-slate-500 shrink-0" />
                            <span className="text-[10px] text-stone-600 dark:text-slate-400 truncate font-mono">
                              {entry.thankyou_url}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleCopy(entry.thankyou_url, entry.id)
                            }
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                            title="Copy URL"
                          >
                            {copiedId === entry.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                            )}
                          </button>
                          <a
                            href={entry.thankyou_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                          </a>
                          <button
                            onClick={() => handleWhatsAppShare(entry.thankyou_url, entry.name)}
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0 group"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 group-hover:fill-emerald-600" />
                          </button>
                        </div>
                      </td>

                      {/* Email Status */}
                      <td className="py-4 px-5">
                        {!entry.email ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 dark:bg-slate-800 text-stone-400 dark:text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            N/A
                          </span>
                        ) : entry.email_sent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-100 dark:border-amber-900/30">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-4 px-5 text-stone-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {deleteConfirmId === entry.id ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold mr-1">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1 bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-lg text-[10px] font-bold hover:bg-stone-300 dark:hover:bg-slate-600 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(entry.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors group"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-stone-400 dark:text-slate-600 group-hover:text-red-500" />
                          </button>
                        )}
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
