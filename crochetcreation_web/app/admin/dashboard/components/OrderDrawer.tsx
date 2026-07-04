'use client';

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Download, 
  CreditCard, 
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import Image from 'next/image';

interface OrderDrawerProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, nextStatus: string) => Promise<void>;
  onDownloadInvoice: (orderId: string) => Promise<void>;
  onValidatePayment: (orderId: string) => void;
}

export default function OrderDrawer({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onDownloadInvoice,
  onValidatePayment
}: OrderDrawerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  // Determine avatar initials
  const initials = order.customer_name
    ? order.customer_name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  // Determine payment status visual elements
  const isUPI = order.payment_method === 'UPI';
  const isPaid = order.status === 'Delivered' || order.status === 'Processing' || order.status === 'Confirmed';
  const isCancelled = order.status === 'Cancelled';
  const isPendingValidation = order.status === 'Pending Validation' || (order.status === 'Pending' && isUPI);

  let paymentStatusLabel = 'Unpaid';
  let paymentBadgeStyle = 'bg-gray-50 text-gray-700 ring-gray-200';
  if (isPaid) {
    paymentStatusLabel = 'Paid';
    paymentBadgeStyle = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  } else if (isPendingValidation) {
    paymentStatusLabel = 'Pending Validation';
    paymentBadgeStyle = 'bg-amber-50 text-amber-700 ring-amber-200';
  } else if (isCancelled) {
    paymentStatusLabel = 'Unpaid';
    paymentBadgeStyle = 'bg-rose-50 text-rose-700 ring-rose-200';
  }

  // Create deterministic mock UTR or transaction code
  const utrNumber = isUPI ? `UTR${order._id?.slice(-8).toUpperCase()}94` : `TXN${order._id?.slice(-8).toUpperCase()}`;

  // Footer Actions Handler
  const handleCancelClick = async () => {
    if (window.confirm(`Are you sure you want to cancel Order #ORD-${order._id.slice(-6).toUpperCase()}?`)) {
      setIsUpdating(true);
      try {
        await onUpdateStatus(order._id, 'Cancelled');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDeliverClick = async () => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order._id, 'Delivered');
      alert(`Order #ORD-${order._id.slice(-6).toUpperCase()} successfully marked as Delivered!`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    try {
      await onDownloadInvoice(order._id);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[150] transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Slide-out Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[160] transform transition-transform duration-300 translate-x-0 animate-in slide-in-from-right flex flex-col text-left">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Order Ledger Detail</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">ORD-{order._id?.slice(-6).toUpperCase()}</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {order.created_at ? new Date(order.created_at).toLocaleString() : 'Unknown Date'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

          {/* Dual Status Block */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100 text-xs">
            <div>
              <span className="text-[9px] font-black text-gray-400 uppercase block">Payment Status</span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 flex items-center gap-1 ${paymentBadgeStyle}`}>
                  {paymentStatusLabel === 'Pending Validation' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  {paymentStatusLabel}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[9px] font-black text-gray-400 uppercase block">Fulfillment Phase</span>
              <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ${
                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                order.status === 'Pending' || order.status === 'Confirmed' ? 'bg-teal-50 text-teal-700 ring-teal-200' :
                order.status === 'Processing' ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                'bg-rose-50 text-rose-700 ring-rose-200'
              }`}>
                {order.status === 'Pending' || order.status === 'Confirmed' ? 'CONFIRMED' : order.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Section 1: Customer Profile Block */}
          <div className="border border-gray-100 p-4 rounded-xl space-y-3">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" /> Customer Information
            </h5>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-extrabold text-slate-700 text-sm shrink-0">
                {initials}
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900 text-sm">{order.customer_name}</p>
                <p className="text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {order.customer_email}</p>
                <p className="text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {order.customer_mobile || 'No mobile number'}</p>
                <div className="pt-2 border-t border-gray-100/70 mt-2 space-y-1 text-slate-700 font-medium">
                  <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> Delivery Destination</p>
                  <p className="leading-relaxed">{order.shipping_address || 'No address provided'}</p>
                  
                  {/* Coordinates view */}
                  {(order.latitude !== undefined || order.longitude !== undefined) && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-gray-100 text-[10px] text-gray-500 font-bold flex items-center gap-2 mt-2">
                      <span>📍 GPS Coordinates:</span>
                      <span>Lat: {order.latitude?.toFixed(4) || 'N/A'}, Lng: {order.longitude?.toFixed(4) || 'N/A'}</span>
                      {order.latitude && order.longitude && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-655 hover:underline ml-auto"
                        >
                          View on Map →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Items Catalog List */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-gray-100">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-900">Ordered Items List</h5>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-12 rounded-lg border border-gray-100 overflow-hidden bg-slate-50 shrink-0">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">📦</div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="text-[10px] text-gray-400 font-normal">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">₹{(item.quantity * item.price)?.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 uppercase text-[10px]">Grand Ledger Total</span>
              <span className="text-sm font-extrabold text-slate-950">₹{order.total_amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Section 3: Payment Details & UTR */}
          <div className="border border-gray-100 p-4 rounded-xl space-y-3">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" /> Payment & Settlement
            </h5>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Payment Method</span>
                <span className="font-extrabold text-slate-900 uppercase">{order.payment_method || 'COD'}</span>
              </div>
              
              {isUPI && (
                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-amber-800 uppercase">UPI UTR Reference</span>
                    <span className="font-mono text-[10px] font-bold text-amber-900 select-all">{utrNumber}</span>
                  </div>
                  {isPendingValidation && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-800 font-semibold mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Validation required to sync inventory and generate invoice.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Quick Actions */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0 select-none">
          <div className="flex gap-2">
            {order.status !== 'Cancelled' && (
              <button
                disabled={isUpdating}
                onClick={handleCancelClick}
                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Download Invoice (only active for confirmed/paid/delivered orders) */}
            {order.status !== 'Cancelled' && (
              <button
                disabled={isDownloading || isPendingValidation}
                onClick={handleDownloadClick}
                className="px-4 py-2 bg-white border border-gray-250 hover:bg-gray-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" /> 
                {isDownloading ? 'Downloading...' : 'Invoice'}
              </button>
            )}

            {/* Context-aware Quick Action Buttons */}
            {isPendingValidation ? (
              <button
                disabled={isUpdating}
                onClick={() => onValidatePayment(order._id)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50 animate-pulse"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Validate & Confirm Payment
              </button>
            ) : (order.status === 'Pending' || order.status === 'Processing' || order.status === 'Confirmed') ? (
              <button
                disabled={isUpdating}
                onClick={handleDeliverClick}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark as Delivered
              </button>
            ) : order.status === 'Delivered' ? (
              <span className="px-4 py-2 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                ✓ Delivered & Completed
              </span>
            ) : (
              <span className="px-4 py-2 bg-rose-50 text-rose-700 ring-1 ring-rose-200 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                ✕ Order Cancelled
              </span>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
