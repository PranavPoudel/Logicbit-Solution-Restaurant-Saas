"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { createReview, type CreateReviewInput } from "@/lib/api/reviews";

interface ReviewModalProps {
  orderId: string;
  restaurantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ orderId, restaurantId, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateReviewInput = {
        orderId,
        restaurantId,
        rating,
        comment: comment.trim() || undefined,
      };
      
      await createReview(payload);
      onSuccess(); // Close modal and refresh parent UI
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-[#17181C] font-display">Rate your order</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-500">How was your experience?</p>
            
            {/* Star Rating Input */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-[#E3A008] text-[#E3A008]"
                        : "text-neutral-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs font-medium text-[#E3A008]">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent!"}
              </p>
            )}
          </div>

          {/* Comment Input */}
          <div>
            <label className="block text-sm font-medium text-[#17181C] mb-1.5">
              Leave a comment (optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#0F6B5C]/40 focus:border-[#0F6B5C] outline-none resize-none text-sm"
              placeholder="Tell us what you loved (or didn't) about the food and delivery..."
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#17181C] hover:bg-[#2B2D33] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}