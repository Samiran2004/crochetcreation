'use client';

import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, MessageCircle, Smartphone } from 'lucide-react';

/**
 * Payment happens before the order is confirmed, so the buyer has to
 * understand that *before* they press the order button — not after. These two
 * pieces are shared by all three checkout paths (cart drawer, shop modal,
 * product page) so the promise made in one place is the promise kept in the
 * others.
 */

interface PrepaidNoticeProps {
  amount: number;
  upiId: string;
}

/** Shown inside the checkout form, above the submit button. */
export const PrepaidNotice: React.FC<PrepaidNoticeProps> = ({ amount, upiId }) => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
    <div className="flex items-center gap-2">
      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
      <p className="text-[11px] font-black uppercase tracking-widest text-amber-800">
        Advance payment required
      </p>
    </div>
    <p className="text-xs text-amber-900 leading-relaxed">
      This is a <strong>prepaid</strong> order — there is no Cash on Delivery. After you
      place it, pay <strong>₹{amount.toFixed(2)}</strong> by UPI to{' '}
      <strong className="break-all">{upiId}</strong> and send the payment screenshot on
      WhatsApp. We confirm your order once the payment is verified.
    </p>
  </div>
);

interface PaymentInstructionsProps {
  amount: number;
  upiId: string;
  orderRef: string;
  whatsappUrl: string;
  onClose?: () => void;
  closeLabel?: string;
}

/**
 * Shown after the order is created, in place of the old "Redirecting to
 * WhatsApp…" message — which told the buyer nothing about having to pay.
 */
export const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({
  amount,
  upiId,
  orderRef,
  whatsappUrl,
  onClose,
  closeLabel = 'Return to home',
}) => {
  const [copied, setCopied] = useState(false);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some browsers; the id is on screen to copy by hand.
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
        <Smartphone className="w-6 h-6 text-amber-700" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-teal">Almost there — pay to confirm</h3>
        <p className="text-xs text-muted">
          Order <span className="font-bold text-bodytext">{orderRef}</span> is reserved and
          waiting for your payment.
        </p>
      </div>

      {/* Amount + UPI id: the two things the buyer needs to act on. */}
      <div className="w-full rounded-2xl border border-line bg-parchment-card p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">
            Amount to pay
          </span>
          <span className="text-[22px] font-sans font-extrabold text-ink tabular-nums">
            ₹{amount.toFixed(2)}
          </span>
        </div>
        <div className="border-t border-line pt-3 space-y-1.5 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">
            Pay to this UPI ID
          </span>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-bold text-ink break-all">{upiId}</code>
            <button
              type="button"
              onClick={copyUpiId}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-white text-[10px] font-bold uppercase tracking-wider text-bodytext hover:border-teal hover:text-teal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              {copied ? (
                <><Check className="w-3 h-3 text-emerald-600" aria-hidden="true" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" aria-hidden="true" /> Copy</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* The three steps, in order, so nothing is ambiguous. */}
      <ol className="w-full text-left space-y-2.5">
        {[
          'Pay the amount above using any UPI app (GPay, PhonePe, Paytm).',
          'Send the payment screenshot to us on WhatsApp.',
          'We verify it and confirm your order — you get an email with the invoice.',
        ].map((step, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 w-5 h-5 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-xs text-bodytext leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <div className="w-full space-y-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1FBA57] text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FBA57] focus-visible:ring-offset-2"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          Send order &amp; screenshot on WhatsApp
        </a>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-line text-teal font-bold text-xs uppercase tracking-widest hover:bg-parchment-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {closeLabel}
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted leading-relaxed">
        Your order stays in <strong>Awaiting payment</strong> until we verify the screenshot.
        You can track it any time from your dashboard.
      </p>
    </div>
  );
};
