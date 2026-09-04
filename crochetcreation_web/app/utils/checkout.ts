'use client';

import { useEffect, useState } from 'react';
import { apiFetch, getApiUrl } from './apiFetch';

/**
 * Every order on the storefront is prepaid by UPI: the buyer pays, sends the
 * payment screenshot on WhatsApp, and an admin confirms the order once the
 * payment is verified. There is no Cash on Delivery and no card gateway, so
 * nothing here offers the buyer a choice of payment method.
 */
export const PAYMENT_METHOD = 'UPI';

/** WhatsApp number orders are sent to. */
export const WHATSAPP_NUMBER = '917551041853';

/** Fallback UPI address, used until the admin's configured one loads. */
const FALLBACK_UPI_ID = 'samiran.samanta@upi';

export interface StoreSettings {
  upiId: string;
  supportPhone: string;
  storeName: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  upiId: FALLBACK_UPI_ID,
  supportPhone: '+91 86375 10045',
  storeName: 'Crochet Creation',
};

/**
 * Reads the store's UPI address from admin settings so the buyer is shown the
 * real one to pay into, and it can be changed without a redeploy.
 */
export const useStoreSettings = (): StoreSettings => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/settings/`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setSettings({
          upiId: data.upi_id || FALLBACK_UPI_ID,
          supportPhone: data.support_phone || DEFAULT_SETTINGS.supportPhone,
          storeName: data.store_name || DEFAULT_SETTINGS.storeName,
        });
      } catch {
        /* keep the defaults — checkout must never block on settings */
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return settings;
};

/** Short, human order reference shown to the buyer and quoted on WhatsApp. */
export const formatOrderRef = (orderId: string): string =>
  orderId ? `ORD-${orderId.slice(-6).toUpperCase()}` : 'PENDING';

interface WhatsAppMessageInput {
  items: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    size?: string;
    image_url?: string;
  }>;
  subtotal: number;
  customer: { name: string; email: string; mobile: string; address: string };
  orderRef: string;
  upiId: string;
  origin: string;
}

/**
 * Builds the WhatsApp order message. It leads with the payment instruction so
 * the amount and the UPI address are the first things the buyer sees when the
 * chat opens, rather than being buried under the item list.
 */
export const buildWhatsAppOrderMessage = ({
  items,
  subtotal,
  customer,
  orderRef,
  upiId,
  origin,
}: WhatsAppMessageInput): string => {
  const itemLines = items
    .map((item, index) => {
      const productUrl = item.id ? `${origin}/product/${item.id}` : '';
      return (
        `\n📦 *Item ${index + 1}:*\n` +
        `- *Name:* ${item.name}\n` +
        (item.size ? `- *Size:* ${item.size}\n` : '') +
        (item.category ? `- *Category:* ${item.category}\n` : '') +
        `- *Price:* ₹${item.price.toFixed(2)}\n` +
        `- *Quantity:* ${item.quantity}\n` +
        (productUrl ? `- *Product Link:* ${productUrl}\n` : '')
      );
    })
    .join('');

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    `🧶 *New Order — Crochet Creation* 🧶\n\n` +
    `🆔 *Order Reference:* ${orderRef}\n\n` +
    `💳 *PAYMENT REQUIRED TO CONFIRM*\n` +
    `- *Amount to pay:* ₹${subtotal.toFixed(2)}\n` +
    `- *Pay to UPI ID:* ${upiId}\n` +
    `- *Then send the payment screenshot in this chat.*\n` +
    `Your order is confirmed once we verify the payment.\n\n` +
    `🛍️ *Order Details:*${itemLines}\n` +
    `💰 *Summary:*\n` +
    `- *Total Items:* ${totalItems}\n` +
    `- *Total Payable:* ₹${subtotal.toFixed(2)}\n\n` +
    `👤 *Customer Details:*\n` +
    `- *Name:* ${customer.name}\n` +
    `- *Email:* ${customer.email}\n` +
    `- *Mobile:* ${customer.mobile}\n` +
    `- *Delivery Address:* ${customer.address}\n\n` +
    `I have placed this order on the website. Sending the payment screenshot next. Thank you!`
  );
};

export const buildWhatsAppUrl = (message: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
