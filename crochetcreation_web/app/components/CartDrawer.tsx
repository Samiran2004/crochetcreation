'use client';

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
}, quantity = 1) => {
  if (typeof window === 'undefined') return;
  const items = getCartItems();
  const existingIndex = items.findIndex((item) => item.id === product.id);

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
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    paymentMethod: 'COD',
  });

  // Load and sync cart items
  const syncCart = () => {
    setItems(getCartItems());
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncCart();

    const handleOpen = () => {
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

  const updateQuantity = (id: string, delta: number) => {
    const updated = items
      .map((item) => {
        if (item.id === id) {
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

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
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

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile || !formData.address) {
      alert('Please fill in all details.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const paymentMethodText = formData.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Online Payment)';

      let itemsSummary = '';
      items.forEach((item, index) => {
        const productUrl = `${origin}/product/${item.id}`;
        itemsSummary += `\n📦 *Item ${index + 1}:*\n` +
          `- *Name:* ${item.name}\n` +
          `- *Category:* ${item.category}\n` +
          `- *Price:* ₹${item.price.toFixed(2)}\n` +
          `- *Quantity:* ${item.quantity}\n` +
          `- *Product Link:* ${productUrl}\n` +
          (item.image_url ? `- *Image Link:* ${item.image_url}\n` : '');
      });

      const message = `🧶 *New Bundle Order - Crochet Creation* 🧶\n\n` +
        `Hello! I would like to place a custom order for the following items:\n` +
        itemsSummary + `\n` +
        `💰 *Summary:*\n` +
        `- *Total Items:* ${items.reduce((sum, i) => sum + i.quantity, 0)}\n` +
        `- *Subtotal:* ₹${subtotal.toFixed(2)}\n\n` +
        `👤 *Customer Details:*\n` +
        `- *Name:* ${formData.name}\n` +
        `- *Email:* ${formData.email}\n` +
        `- *Mobile:* ${formData.mobile}\n` +
        `- *Delivery Address:* ${formData.address}\n\n` +
        `💳 *Payment Method:* ${paymentMethodText}\n\n` +
        `Please confirm this order. Thank you!`;

      const formattedPhone = '917551041853';
      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp chat
      window.open(url, '_blank');
      
      setWhatsappUrl(url);
      setCheckoutSuccess(true);
      
      // Clear cart
      localStorage.setItem('crochet_cart', '[]');
      localStorage.setItem('crochet_cart_count', '0');
      setItems([]);
      window.dispatchEvent(new Event('cart-change'));
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to generate WhatsApp order details. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Cart Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen w-full sm:w-[480px] bg-[#FEF9F6] shadow-2xl transition-transform duration-500 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EADBDB] flex items-center justify-between bg-[#6B5656] text-[#FEF9F6]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D9B4B4]" />
            <h3 className="font-bold uppercase tracking-wider text-sm">
              {isCheckoutView ? 'Checkout Information' : 'Shopping Cart'}
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {checkoutSuccess ? (
            <div className="text-center py-10 space-y-5">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-3xl mx-auto shadow animate-pulse">
                💬
              </div>
              <h4 className="text-lg font-bold text-[#6B5656]">Redirecting to WhatsApp...</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                We are opening a WhatsApp chat with the admin to place your order. If it didn't open, please click the button below to send your details.
              </p>
              <div className="pt-2 flex flex-col gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-6 rounded-xl uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-2"
                >
                  Send Message on WhatsApp
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className="border border-[#6B5656] text-[#6B5656] hover:bg-[#6B5656] hover:text-[#FEF9F6] text-xs font-bold py-3 px-6 rounded-xl uppercase tracking-wider transition-all duration-300"
                >
                  Close Cart
                </button>
              </div>
            </div>
          ) : isCheckoutView ? (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="p-4 bg-stone-50 border border-[#EADBDB] rounded-2xl">
                <span className="text-[10px] font-black text-[#D9B4B4] uppercase tracking-widest block mb-2">
                  Order Summary
                </span>
                <div className="text-xs space-y-1.5 text-stone-600">
                  <div className="flex justify-between font-medium">
                    <span>Items Count:</span>
                    <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#6B5656] pt-1.5 border-t border-dashed border-stone-200 text-sm">
                    <span>Total Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B5656] uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Samiran Samanta"
                    className="w-full text-xs px-4 py-3 bg-white border border-[#EADBDB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B5656] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B5656] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="samiran@example.com"
                    className="w-full text-xs px-4 py-3 bg-white border border-[#EADBDB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B5656] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B5656] uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="917551041853"
                    className="w-full text-xs px-4 py-3 bg-white border border-[#EADBDB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B5656] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B5656] uppercase tracking-wider mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full street address, City, Pincode"
                    className="w-full text-xs px-4 py-3 bg-white border border-[#EADBDB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B5656] transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B5656] uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'COD' }))}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        formData.paymentMethod === 'COD'
                          ? 'border-[#6B5656] bg-[#6B5656] text-[#FEF9F6]'
                          : 'border-[#EADBDB] text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'ONLINE' }))}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        formData.paymentMethod === 'ONLINE'
                          ? 'border-[#6B5656] bg-[#6B5656] text-[#FEF9F6]'
                          : 'border-[#EADBDB] text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      UPI / Online Pay
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutView(false)}
                  className="flex-1 border border-[#EADBDB] text-stone-600 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-stone-50 transition-colors"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="flex-1 bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-[#FEF9F6] font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  {checkoutLoading ? 'Redirecting...' : 'Order on WhatsApp'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-stone-50 border border-stone-200 rounded-full flex items-center justify-center text-3xl mx-auto shadow">
                🧶
              </div>
              <h4 className="text-[#6B5656] font-bold">Your Cart is Empty</h4>
              <p className="text-xs text-stone-400 max-w-[250px] mx-auto leading-relaxed">
                Add some of our handcrafted crochet beauties to start your order request!
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-2 bg-[#6B5656] text-white hover:bg-[#D9B4B4] hover:text-[#6B5656] text-[10px] font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-all duration-300"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3.5 bg-white border border-[#EADBDB] rounded-2xl hover:shadow-sm transition-shadow duration-300 relative group"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-stone-50 rounded-xl relative overflow-hidden flex-shrink-0 border border-stone-100">
                    <img
                      src={item.image_url || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow flex flex-col justify-between py-0.5">
                    <div>
                      <span className="text-[9px] font-bold text-[#D9B4B4] uppercase tracking-widest block">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#6B5656] line-clamp-1 pr-6">
                        {item.name}
                      </h4>
                      <p className="text-xs font-bold text-stone-700 mt-1">
                        ₹{item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-[#EADBDB] rounded-lg bg-stone-50">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-[#D9B4B4] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-[#D9B4B4] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-3 right-3 text-stone-400 hover:text-red-500 transition-colors"
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
          <div className="p-5 border-t border-[#EADBDB] bg-white space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-stone-600">Subtotal:</span>
              <span className="font-bold text-lg text-[#6B5656]">₹{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Pre-populate fields if user is logged in
                  const token = localStorage.getItem('crochet_token');
                  if (token) {
                    try {
                      const user = JSON.parse(localStorage.getItem('crochet_user') || '{}');
                      setFormData((prev) => ({
                        ...prev,
                        name: user.name || '',
                        email: user.email || '',
                        mobile: user.mobile || '',
                      }));
                    } catch (e) {}
                  }
                  setIsCheckoutView(true);
                }}
                className="w-full bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-[#FEF9F6] font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-1.5"
              >
                Proceed to Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Secure checkout. Finalized via WhatsApp message.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
