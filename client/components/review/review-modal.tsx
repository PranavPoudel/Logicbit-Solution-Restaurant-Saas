"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { createReview, type CreateReviewInput } from "@/lib/api/reviews";
import { getErrorMessage } from "@/lib/utils/error";
import { Button, Icon, IconButton, inputCls } from "@/components/ui/primitives";

interface ReviewModalProps {
  orderId: string;
  restaurantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ isOpen, ...props }: ReviewModalProps) {
  return isOpen ? <ReviewDialog {...props} /> : null;
}

function ReviewDialog({ orderId, restaurantId, onClose, onSuccess }: Omit<ReviewModalProps, "isOpen">) {
  const t = useTranslations("review");
  const tc = useTranslations("common");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useDialogFocus<HTMLDivElement>();
  useEscapeKey(onClose, !isSubmitting);

  const labels = [t("r1"), t("r2"), t("r3"), t("r4"), t("r5")];
  const shown = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t("errStars"));
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
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, t("errFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/70 p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        onClick={(e) => e.stopPropagation()}
        className="shadow-warm animate-fade-up relative w-full max-w-xl rounded-[36px] bg-cream p-6 text-ink md:p-8"
      >
        <IconButton icon="x" label={tc("close")} onClick={onClose} className="absolute right-4 top-4 bg-paper text-ink shadow-hard" />
        <h2 id="review-title" className="pr-12 font-display text-[28px] font-extrabold leading-tight tracking-tight">{t("title")}</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="text-center">
            <p className="text-lg text-ink/80">{t("ask")}</p>
            <div className="mt-3 flex items-center justify-center gap-1" role="radiogroup" aria-label={t("ask")}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={labels[star - 1]}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="grid h-12 w-12 place-items-center rounded-full outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <Icon name="star" fill className={`h-9 w-9 transition-colors ${star <= shown ? "text-saffron" : "text-ink/15"}`} />
                </button>
              ))}
            </div>
            <p className="mt-1 h-7 font-display text-xl font-extrabold text-[var(--accent,var(--brand-chili))]" aria-live="polite">
              {shown > 0 ? labels[shown - 1] : ""}
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block font-display text-xl font-extrabold">{t("commentLabel")}</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`${inputCls} resize-none py-3`}
              placeholder={t("placeholder")}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-2xl border-2 border-dashed border-chili/50 bg-chili/5 px-4 py-3 font-bold text-chili">{error}</p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="min-h-14 flex-1 px-4">{t("skip")}</Button>
            <Button type="submit" disabled={isSubmitting || rating === 0} className="min-h-14 flex-1 whitespace-nowrap px-4">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
