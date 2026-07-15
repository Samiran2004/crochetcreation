'use client';
import { apiFetch } from '../utils/apiFetch';

import React, { useState, useEffect } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productTitle: string;
  token: string | null;
  onSuccess: (productId: string) => void;
}

export default function ReviewDrawer({
  isOpen,
  onClose,
  productId,
  productTitle,
  token,
  onSuccess
}: ReviewDrawerProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state on drawer open/close
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    if (rating === 0) {
      setErrorMessage('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (comment.trim().length < 2) {
      setErrorMessage('Please write a review comment (minimum 2 characters).');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await apiFetch(`${API_URL}/api/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          rating,
          comment
        })
      });

      if (response.ok) {
        onSuccess(productId);
        onClose();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || 'Failed to submit review.');
      }
    } catch (err) {
      setErrorMessage('Network error submitting your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Drawer / Modal Shell */}
          <motion.div
            initial={{ y: '100%', opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-md bg-white border border-[#EADBDB] md:rounded-3xl rounded-t-3xl shadow-2xl z-50 flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 shrink-0">
              <div>
                <span className="text-[9px] font-black tracking-widest text-[#D9B4B4] uppercase block">
                  Write a Review
                </span>
                <h3 className="text-sm font-bold text-[#6B5656] line-clamp-1 pr-6 mt-0.5">
                  {productTitle}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-50 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all select-none active:scale-95 duration-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200/50 text-rose-700 text-xs font-semibold px-4 py-3 rounded-2xl">
                  {errorMessage}
                </div>
              )}

              {/* Rating row (Fat-finger friendly touch targets) */}
              <div className="space-y-2 text-center">
                <span className="block text-[10px] font-black tracking-widest text-stone-400 uppercase">
                  Your Rating
                </span>
                <div className="flex justify-center items-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const filled = starValue <= (hoverRating || rating);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="w-12 h-12 flex items-center justify-center text-stone-300 hover:text-amber-400 transition-colors select-none active:scale-90 duration-75"
                      >
                        <Star
                          className={`w-8 h-8 transition-transform ${
                            filled ? 'fill-amber-400 text-amber-400 scale-110' : 'text-stone-300 scale-100'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment text area */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-stone-400 uppercase">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you loved about this creation..."
                  rows={4}
                  className="w-full border border-stone-200 focus:border-[#6B5656] focus:ring-1 focus:ring-[#6B5656] rounded-2xl p-4 text-xs font-medium text-stone-800 placeholder-stone-400 bg-stone-50/50 focus:bg-white outline-none resize-none transition-colors"
                />
              </div>

              {/* Submit button (fat-finger touch-friendly height 48px) */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] bg-[#6B5656] text-white hover:bg-[#4A3E3E] disabled:bg-[#8D7F7F] disabled:cursor-not-allowed text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all select-none active:scale-95 duration-100 shadow-md shadow-[#6B5656]/10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
