'use client';
import { apiFetch, getApiUrl, clearSession } from '../utils/apiFetch';
import {
  PAYMENT_METHOD,
  useStoreSettings,
  formatOrderRef,
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
} from '../utils/checkout';
import { PrepaidNotice, PaymentInstructions } from './PaymentNotice';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Lock } from 'lucide-react';
import Image from 'next/image';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  quantity: number;
  size?: string;
}

// Global helpers to interact with cart from any page
export const getCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  const savedCart = localStorage.getItem('crochet_cart');
  return savedCart ? JSON.parse(savedCart) : [];
};

export const addToCart = (product: {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  size?: string;
}, quantity = 1) => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  if (!token) {
    window.dispatchEvent(new Event('open-auth-modal'));
    return;
  }

  const items = getCartItems();
  const existingIndex = items.findIndex((item) => item.id === product.id && item.size === product.size);

  if (existingIndex > -1) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      quantity: quantity,
      size: product.size,
    });
  }

  localStorage.setItem('crochet_cart', JSON.stringify(items));
  
  // Update both the count in localStorage and notify listeners
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  localStorage.setItem('crochet_cart_count', totalCount.toString());
  
  window.dispatchEvent(new Event('cart-change'));
  window.dispatchEvent(new Event('open-cart'));
};

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
  });

  // Amount and order reference are held so the post-order screen can show the
  // buyer exactly what to pay after the cart has been emptied.
  const [placedOrder, setPlacedOrder] = useState<{ ref: string; amount: number }>({
    ref: '',
    amount: 0,
  });
  const storeSettings = useStoreSettings();

  // Load and sync cart items
  const syncCart = () => {
    setItems(getCartItems());
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncCart();

    const handleOpen = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // The sign-in sheet only lives on the home page. Ask for it first, and
        // if nothing picks the request up (every other route), send the visitor
        // to the home page with a redirect back — otherwise tapping the basket
        // while signed out did nothing at all.
        let handled = false;
        const markHandled = () => { handled = true; };
        window.addEventListener('auth-modal-opened', markHandled);
        window.dispatchEvent(new Event('open-auth-modal'));
        window.setTimeout(() => {
          window.removeEventListener('auth-modal-opened', markHandled);
          if (!handled) {
            const back = window.location.pathname + window.location.search;
            window.location.href = `/?login=true&redirect=${encodeURIComponent(back)}`;
          }
        }, 0);
        return;
      }
      syncCart();
      setIsOpen(true);
      setIsCheckoutView(false);
      setCheckoutSuccess(false);
    };

    window.addEventListener('cart-change', syncCart);
    window.addEventListener('open-cart', handleOpen);

    return () => {
      window.removeEventListener('cart-change', syncCart);
      window.removeEventListener('open-cart', handleOpen);
    };
  }, []);

  const updateQuantity = (id: string, delta: number, size?: string) => {
    const updated = items
      .map((item) => {
        if (item.id === id && item.size === size) {
          const nextQty = item.quantity + delta;
          return { ...item, quantity: nextQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    localStorage.setItem('crochet_cart', JSON.stringify(updated));
    const totalCount = updated.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem('crochet_cart_count', totalCount.toString());
    
    setItems(updated);
    window.dispatchEvent(new Event('cart-change'));
  };

  const removeItem = (id: string, size?: string) => {
    const updated = items.filter((item) => !(item.id === id && item.size === size));
    localStorage.setItem('crochet_cart', JSON.stringify(updated));
    const totalCount = updated.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem('crochet_cart_count', totalCount.toString());
    
    setItems(updated);
    window.dispatchEvent(new Event('cart-change'));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile || !formData.address) {
      showToast('Please fill in all details.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      // Post the order to the backend first
      const API_URL = getApiUrl();

      const payload = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_mobile: formData.mobile,
        items: items.map(item => ({
          product_id: item.id,
          title: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        payment_method: PAYMENT_METHOD,
        shipping_address: formData.address
      };

      const res = await apiFetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          typeof errorData.detail === 'string'
            ? errorData.detail
            : "We couldn't place your order. Please try again."
        );
      }

      const orderData = await res.json();
      const orderId = orderData.id || orderData._id || '';
      const displayOrderId = formatOrderRef(orderId);
      // The server re-prices the order, so the amount to pay is the server's
      // total — never the one the browser worked out.
      const payableTotal = Number(orderData.total_amount ?? subtotal);

      const message = buildWhatsAppOrderMessage({
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          size: item.size,
        })),
        subtotal: payableTotal,
        customer: {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          address: formData.address,
        },
        orderRef: displayOrderId,
        upiId: storeSettings.upiId,
        origin,
      });

      const url = buildWhatsAppUrl(message);

      setPlacedOrder({ ref: displayOrderId, amount: payableTotal });
      setWhatsappUrl(url);
      setCheckoutSuccess(true);

      // Clear cart
      localStorage.setItem('crochet_cart', '[]');
      localStorage.setItem('crochet_cart_count', '0');
      setItems([]);
      window.dispatchEvent(new Event('cart-change'));
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Failed to generate WhatsApp order details. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[999] bg-white border-l-4 border-teal shadow-2xl p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-parchment-card flex items-center justify-center text-sm shadow-inner">
            🧶
          </div>
          <div>
            <p className="text-xs font-bold text-teal uppercase tracking-wider">Cart Notice</p>
            <p className="text-xs text-bodytext mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Cart Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-[85vh] sm:top-0 sm:right-0 sm:left-auto sm:h-screen w-full sm:w-[480px] bg-parchment sm:rounded-none rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out flex flex-col z-50 ${
          isOpen 
            ? 'translate-y-0 sm:translate-y-0 sm:translate-x-0' 
            : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 pt-3 sm:pt-5 border-b border-line flex flex-col justify-between bg-teal text-parchment rounded-t-3xl sm:rounded-none shrink-0">
          {/* Drag handle for mobile */}
          <div className="sm:hidden flex justify-center pb-3">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-terracotta" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                {isCheckoutView ? 'Checkout Information' : 'Shopping Cart'}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close cart"
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div data-lenis-prevent className="flex-grow overflow-y-auto p-5 space-y-4">
          {checkoutSuccess ? (
            <PaymentInstructions
              amount={placedOrder.amount}
              upiId={storeSettings.upiId}
              orderRef={placedOrder.ref}
              whatsappUrl={whatsappUrl}
              onClose={() => setIsOpen(false)}
              closeLabel="Close cart"
            />
          ) : isCheckoutView ? (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="p-4 bg-parchment-deep border border-line rounded-2xl">
                <span className="text-[10px] font-black text-terracotta uppercase tracking-widest block mb-2">
                  Order Summary
                </span>
                <div className="text-xs space-y-1.5 text-bodytext">
                  <div className="flex justify-between font-medium">
                    <span>Items Count:</span>
                    <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-teal pt-1.5 border-t border-dashed border-line text-sm">
                    <span>Total Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="cart-name" className="block text-[10px] font-bold text-teal uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="cart-name"
                    name="name"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Samiran Samanta"
                    className="w-full text-xs px-4 py-3 bg-white border border-line rounded-xl focus:outline-none focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="cart-email" className="block text-[10px] font-bold text-teal uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="cart-email"
                    name="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="samiran@example.com"
                    className="w-full text-xs px-4 py-3 bg-white border border-line rounded-xl focus:outline-none focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="cart-mobile" className="block text-[10px] font-bold text-teal uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="cart-mobile"
                    name="mobile"
                    autoComplete="tel"
                    required
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="917551041853"
                    className="w-full text-xs px-4 py-3 bg-white border border-line rounded-xl focus:outline-none focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="cart-address" className="block text-[10px] font-bold text-teal uppercase tracking-wider mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    id="cart-address"
                    name="address"
                    autoComplete="street-address"
                    required
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full street address, City, Pincode"
                    className="w-full text-xs px-4 py-3 bg-white border border-line rounded-xl focus:outline-none focus:ring-1 focus:ring-teal transition-all resize-none"
                  />
                </div>

                <PrepaidNotice amount={subtotal} upiId={storeSettings.upiId} />
              </div>

              <div className="pt-4 flex gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsCheckoutView(false)}
                  className="flex-1 border border-line text-bodytext font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-parchment-deep transition-all duration-100 active:scale-95 min-h-[44px] flex items-center justify-center"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="flex-1 btn-pill btn-teal !rounded-xl"
                >
                  {checkoutLoading ? 'Redirecting...' : 'Order on WhatsApp'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-parchment-deep border border-line rounded-full flex items-center justify-center text-3xl mx-auto shadow">
                🧶
              </div>
              <h4 className="text-teal font-bold">Your Cart is Empty</h4>
              <p className="text-xs text-muted max-w-[250px] mx-auto leading-relaxed">
                Add some of our handcrafted crochet beauties to start your order request!
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-2 btn-pill btn-teal !rounded-xl !px-6 !py-2.5 !text-[10px]"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3.5 bg-white border border-line rounded-2xl hover:shadow-sm transition-shadow duration-300 relative group"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-parchment-deep rounded-xl relative overflow-hidden flex-shrink-0 border border-line-soft">
                    <img
                      src={item.image_url || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-terracotta uppercase tracking-widest block">
                          {item.category}
                        </span>
                        {item.size && (
                          <span className="text-[9px] bg-line-soft text-bodytext px-1.5 py-0.5 rounded font-bold border border-line">
                            SIZE: {item.size}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-teal line-clamp-1 pr-6">
                        {item.name}
                      </h4>
                      <p className="text-xs font-bold text-bodytext mt-1">
                        ₹{item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-line rounded-lg bg-parchment-deep">
                        <button
                          onClick={() => updateQuantity(item.id, -1, item.size)}
                          className="p-1 hover:text-terracotta transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-bodytext">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1, item.size)}
                          className="p-1 hover:text-terracotta transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id, item.size)}
                    className="absolute top-3 right-3 text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCheckoutView && items.length > 0 && !checkoutSuccess && (
          <div className="p-5 border-t border-line bg-white space-y-4 pb-safe-bottom sm:pb-5 select-none">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-bodytext">Subtotal:</span>
              <span className="font-bold text-lg text-teal">₹{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Pre-populate fields if user is logged in
                  const token = localStorage.getItem('token');
                  if (token) {
                    try {
                      const user = JSON.parse(localStorage.getItem('user') || '{}');
                      setFormData((prev) => ({
                        ...prev,
                        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || '',
                        email: user.email || '',
                        mobile: user.phone || user.mobile || '',
                      }));
                    } catch (e) {}
                  }
                  setIsCheckoutView(true);
                }}
                className="w-full btn-pill btn-teal !rounded-xl"
              >
                Proceed to Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Secure checkout. Finalized via WhatsApp message.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
