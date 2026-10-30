import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cart-store";
import { validateCoupon } from "@/lib/api/orders";
import { getErrorMessage } from "@/lib/utils/error";

export function useCoupon() {
  const t = useTranslations("coupon");
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
      setError(t("emptyCode"));
      return;
    }
    if (!restaurantId) {
      setError(t("noRestaurant"));
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
          ? t("loginRequired")
          : !response
            ? t("noServer")
            : getErrorMessage(err, t("fallback"))
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
        setError(t("noLongerValid"));
      });
    return () => {
      cancelled = true;
    };
  }, [sub, appliedCode, restaurantId, setCoupon, t]);

  return { coupon, code, setCode, loading, error, apply, remove };
}
