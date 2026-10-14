import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useCartStore } from "@/store/cart-store";
import { validateCoupon } from "@/lib/api/orders";
import { getErrorMessage } from "@/lib/utils/error";

export function useCoupon() {
  const { subtotal, activeRestaurantId, coupon, setCoupon } = useCartStore();
  const restaurantId = activeRestaurantId();
  const sub = subtotal();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apply = async () => {
    const trimmed = code.trim();
    setError("");
    if (!trimmed) {
      setError("Please enter a coupon code first.");
      return;
    }
    if (!restaurantId) {
      setError("This cart has no restaurant attached. Clear the cart and add your items again.");
      return;
    }
    setLoading(true);
    try {
      setCoupon(await validateCoupon(restaurantId, trimmed.toUpperCase(), sub));
    } catch (err) {
      setCoupon(null);
      const response = isAxiosError(err) ? err.response : undefined;
      setError(
        response?.status === 401
          ? "Please log in to apply a coupon."
          : !response
            ? "Could not reach the server. Check your connection."
            : getErrorMessage(err, "This coupon could not be applied.")
      );
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    setCoupon(null);
    setCode("");
    setError("");
  };

  const appliedCode = coupon?.code;
  useEffect(() => {
    if (!appliedCode || !restaurantId) return;
    let cancelled = false;
    validateCoupon(restaurantId, appliedCode, sub)
      .then((preview) => {
        if (!cancelled) setCoupon(preview);
      })
      .catch(() => {
        if (cancelled) return;
        setCoupon(null);
        setError("Your coupon is no longer valid for this cart.");
      });
    return () => {
      cancelled = true;
    };
  }, [sub, appliedCode, restaurantId, setCoupon]);

  return { coupon, code, setCode, loading, error, apply, remove };
}
