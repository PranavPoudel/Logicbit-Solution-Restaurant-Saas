"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { useCartStore } from "@/store/cart-store";
import { checkout } from "@/lib/api/orders";
import { AddressPicker } from "@/components/map/address-picker";
import type { PaymentMethod } from "@/components/checkout/payment-modal";
import { checkDeliveryAvailability, getPublicRestaurant } from "@/lib/api/discovery";
import { getErrorMessage } from "@/lib/utils/error";
import { playSound } from "@/lib/utils/sound";
import { useRedirectToLogin } from "@/hooks/use-require-login";
import { CurrencyProvider, useMoney } from "@/hooks/use-money";
import { restaurantAccentStyle } from "@/lib/utils/restaurant-theme";
import { CouponInput } from "@/components/cart/coupon-input";
import { ClosedNotice } from "@/components/restaurant/closed-notice";
import type { OpenStatus } from "@/types/hours";
import { Button, Card, Icon, Progress, SectionTitle } from "@/components/ui/primitives";

const MIN_QUOTE_REFRESH_MS = 5000;

const PAY_INFO: Record<PaymentMethod, { bg: string; mark: string }> = {
  COD: { bg: theme.paymentColors.COD, mark: "" },
  CREDIT_CARD: { bg: theme.paymentColors.CREDIT_CARD, mark: "C" },
  ESEWA: { bg: theme.paymentColors.ESEWA, mark: "e" },
  KHALTI: { bg: theme.paymentColors.KHALTI, mark: "K" },
  IPS: { bg: theme.paymentColors.IPS, mark: "I" },
  PHONEPAY: { bg: theme.paymentColors.PHONEPAY, mark: "P" },
  PAYPAY: { bg: theme.paymentColors.PAYPAY, mark: "P" },
};

const Selectable = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    role="radio"
    aria-checked={on}
    onClick={onClick}
    className={`relative flex min-h-20 w-full items-center gap-4 rounded-[22px] border-2 p-4 text-left transition ${on ? "border-[var(--accent,var(--brand-chili))] bg-[var(--accent,var(--brand-chili))]/10 shadow-hard" : "border-ink/15 bg-paper hover:border-ink/40"}`}
  >
    {children}
    {on && (
      <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]">
        <Icon name="check" className="h-4 w-4" />
      </span>
    )}
  </button>
);

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const router = useRouter();
  const isLoggedIn = useRedirectToLogin();

  const { items, subtotal, activeRestaurantId, clear, coupon } = useCartStore();
  const discount = useCartStore((s) => s.discount());
  const restaurantId = activeRestaurantId();

  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const isPickup = orderType === "PICKUP";
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [payChoice, setPayChoice] = useState<PaymentMethod | null>(null);
  const [agree, setAgree] = useState(true);

  const sub = subtotal();

  const hasLocation = orderType === "DELIVERY" && !!restaurantId && deliveryLatitude != null && deliveryLongitude != null;
  const deliveryQuery = useQuery({
    queryKey: ["delivery-check", restaurantId, deliveryLatitude, deliveryLongitude],
    queryFn: () => checkDeliveryAvailability(restaurantId as string, deliveryLatitude as number, deliveryLongitude as number),
    enabled: hasLocation,
    retry: false,
  });

  const restaurantSettingsQuery = useQuery({
    queryKey: ["public-restaurant-settings", restaurantId],
    queryFn: () => getPublicRestaurant(restaurantId as string),
    enabled: !!restaurantId,
  });
  const restaurant = restaurantSettingsQuery.data as
    | { name?: string; refundPolicy?: string | null; primaryColor?: string; secondaryColor?: string; currencyCode?: string; isOpen?: boolean; openStatus?: OpenStatus; [k: string]: unknown }
    | undefined;
  const closed = restaurant?.isOpen === false;
  const money = useMoney(restaurant?.currencyCode);

  const enabledMethods = useMemo(() => {
    const r = restaurantSettingsQuery.data as Record<string, unknown> | undefined;
    if (!r) return ["COD"] as PaymentMethod[];

    const methods: PaymentMethod[] = [];
    if (r.supportsCod) methods.push("COD");
    if (r.supportsCreditCard) methods.push("CREDIT_CARD");
    if (r.supportsEsewa) methods.push("ESEWA");
    if (r.supportsKhalti) methods.push("KHALTI");
    if (r.supportsIps) methods.push("IPS");
    if (r.supportsPhonePay) methods.push("PHONEPAY");
    if (r.supportsPaypay) methods.push("PAYPAY");

    return methods.length > 0 ? methods : (["COD"] as PaymentMethod[]);
  }, [restaurantSettingsQuery.data]);

  const payMethod = payChoice && enabledMethods.includes(payChoice) ? payChoice : enabledMethods[0];

  type DeliveryCheck = {
    deliverable?: boolean;
    reason?: string;
    deliveryFee?: number;
    distanceKm?: number;
    provider?: string | null;
    quoteId?: string;
    quoteExpiresAt?: string;
  };
  const checkResult = deliveryQuery.data as (DeliveryCheck & { data?: DeliveryCheck }) | undefined;
  const deliveryData: DeliveryCheck | undefined = checkResult?.data ?? checkResult;
  const deliveryCheckLoading = hasLocation && deliveryQuery.isFetching;
  const quote = hasLocation ? deliveryData : undefined;
  const refetchQuote = deliveryQuery.refetch;
  const quoteExpiresAt = quote?.quoteExpiresAt;

  useEffect(() => {
    if (!quoteExpiresAt) return;
    const wait = Math.max(new Date(quoteExpiresAt).getTime() - Date.now(), MIN_QUOTE_REFRESH_MS);
    const timer = setTimeout(() => refetchQuote(), wait);
    return () => clearTimeout(timer);
  }, [quoteExpiresAt, refetchQuote]);

  const notDeliverable = hasLocation && deliveryData?.deliverable === false;
  const distanceKm: number | null = hasLocation && typeof deliveryData?.distanceKm === "number" ? deliveryData.distanceKm : null;
  const deliveryFee: number | null = hasLocation && !notDeliverable && typeof deliveryData?.deliveryFee === "number" ? deliveryData.deliveryFee : null;
  const notDeliverableMessage = deliveryData?.reason ?? t("notDeliverable");
  const feeUnavailable = hasLocation && !notDeliverable && !deliveryCheckLoading && (deliveryQuery.isError || (!!deliveryData && deliveryFee === null));
  
  const effectiveDeliveryFee = deliveryFee ?? 0;
  const total = Math.max(0, sub - discount) + (orderType === "DELIVERY" ? effectiveDeliveryFee : 0);

  const blockedReason = closed
    ? t("closedBlocked")
    : isPickup
    ? ""
    : !deliveryAddress.trim()
      ? t("needAddress")
      : !hasLocation
        ? t("needPin")
        : notDeliverable
          ? notDeliverableMessage
          : deliveryCheckLoading
            ? t("checkingFee")
            : feeUnavailable
              ? t("feeUnavailable")
              : "";

  const mutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      if (!restaurantId) throw new Error(t("errNoRestaurant"));

      const payload = {
        restaurantId,
        orderType,
        paymentMethod,
        ...(orderType === "DELIVERY"
          ? {
              deliveryAddress: deliveryAddress.trim(),
              deliveryLatitude: deliveryLatitude ?? undefined,
              deliveryLongitude: deliveryLongitude ?? undefined,
            }
          : {}),
        ...(quote?.quoteId ? { deliveryQuoteId: quote.quoteId } : {}),
        ...(coupon ? { couponCode: coupon.code } : {}),
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedModifiers:
            item.selectedModifiers?.map((m) => ({
              modifierGroupId: m.modifierGroupId,
              modifierOptionId: m.modifierOptionId,
            })) || [],
          notes: item.notes?.trim() || undefined,
        })),
      };

      return checkout(payload);
    },

    onSuccess: (data) => {
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      clear();
      playSound("placed");
      const orderId = data?.id || data?.orderId;
      router.push(`/orders/${orderId}?placed=1`);
    },

    onError: (err: unknown) => {
      console.error("Checkout failed:", err);
      playSound("error");
      setError(getErrorMessage(err, t("errGeneric"), { includeErrorMessage: true }));
    },
  });

  const place = () => {
    setError("");

    if (items.length === 0) {
      setError(t("errEmptyCart"));
      return;
    }
    if (!restaurantId) {
      setError(t("errNoRestaurant"));
      return;
    }
    if (orderType === "DELIVERY") {
      if (deliveryLatitude == null || deliveryLongitude == null) {
        setError(t("errNoPin"));
        return;
      }
      if (!deliveryAddress.trim()) {
        setError(t("errNoAddress"));
        return;
      }
      if (feeUnavailable) {
        setError(t("errFee"));
        return;
      }
    }

    mutation.mutate(payMethod);
  };

  if (!isLoggedIn) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-4xl font-extrabold">{t("nothingTitle")}</h1>
        <p className="mt-3 text-lg text-ink/75">{t("nothingBody")}</p>
        <Link href="/restaurants"><Button size="lg" className="mt-8">{t("browseRestaurants")}</Button></Link>
      </div>
    );
  }

  const payName = t(`pay.${payMethod}.name`);

  return (
    <CurrencyProvider code={restaurant?.currencyCode}>
      <div style={restaurantAccentStyle(restaurant)} className="pb-16">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <Link href="/cart" className="flex min-h-11 items-center gap-1 font-bold">
            <Icon name="back" />
            {t("backToCart")}
          </Link>
          <div className="mt-2 max-w-md">
            <Progress step={1} />
          </div>
          <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight md:text-7xl">
            {t("almost")} <span className="text-chili">{t("there")}</span>
          </h1>

          {closed && <div className="mt-6"><ClosedNotice restaurant={restaurant} /></div>}

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-6">
              <Card>
                <SectionTitle n={1}>{t("howTitle")}</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label={t("orderType")}>
                  <Selectable on={!isPickup} onClick={() => { setOrderType("DELIVERY"); setError(""); }}>
                    <Icon name="bike" className="h-8 w-8 text-chili" />
                    <span>
                      <b className="block text-lg">{t("delivery")}</b>
                      <span className="text-ink/70">{t("deliveryHint")}</span>
                    </span>
                  </Selectable>
                  <Selectable on={isPickup} onClick={() => { setOrderType("PICKUP"); setError(""); }}>
                    <Icon name="store" className="h-8 w-8 text-herb" />
                    <span>
                      <b className="block text-lg">{t("pickup")}</b>
                      <span className="text-ink/70">{t("pickupHint")}</span>
                    </span>
                  </Selectable>
                </div>
              </Card>

              {!isPickup && (
                <Card>
                  <SectionTitle n={2}>{t("deliverTo")}</SectionTitle>
                  <p className="mb-4 text-ink/70">{t("deliverHint")}</p>
                  <AddressPicker
                    value={{ address: deliveryAddress, lat: deliveryLatitude, lng: deliveryLongitude }}
                    onChange={({ address, lat, lng }) => {
                      setDeliveryAddress(address);
                      setDeliveryLatitude(lat);
                      setDeliveryLongitude(lng);
                      setError("");
                    }}
                    onError={setError}
                    placeholder={t("addressPlaceholder")}
                    mapLabel={t("mapLabel")}
                  />
                  {notDeliverable && (
                    <p role="alert" className="mt-4 flex items-center gap-2 font-bold text-chili">
                      <Icon name="alert" className="h-5 w-5" />
                      {notDeliverableMessage}
                    </p>
                  )}
                  {hasLocation && !notDeliverable && (
                    <p className="mt-4 text-ink/75">
                      {deliveryCheckLoading
                        ? t("checkingPin")
                        : deliveryFee != null
                        ? distanceKm != null
                          ? t("deliveringToPinKm", { km: distanceKm.toFixed(1) })
                          : t("deliveringToPin")
                        : t("pinSelected")}
                    </p>
                  )}
                </Card>
              )}

              <Card>
                <SectionTitle n={isPickup ? 2 : 3}>{t("payWith")}</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label={t("paymentMethod")}>
                  {enabledMethods.map((m) => {
                    const p = PAY_INFO[m];
                    return (
                      <Selectable key={m} on={payMethod === m} onClick={() => { setPayChoice(m); setError(""); }}>
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold text-white"
                          style={{ background: p.bg }}
                        >
                          {m === "COD" ? <Icon name="bag" className="h-6 w-6" /> : p.mark}
                        </span>
                        <span>
                          <b className="block text-lg">{t(`pay.${m}.name`)}</b>
                          <span className="text-ink/70">{t(`pay.${m}.sub`)}</span>
                        </span>
                      </Selectable>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <Card className="space-y-4 !p-6">
                <h2 className="font-display text-2xl font-extrabold">{t("orderSummary")}</h2>
                <ul className="max-h-48 space-y-2 overflow-y-auto">
                  {items.map((item) => (
                    <li key={`${item.menuItemId}::${item.variantKey}`} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        <b>{item.quantity}×</b> {item.name}
                      </span>
                      <span className="shrink-0 font-bold">{money(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <CouponInput id="cp-checkout" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("subtotal")}</span>
                    <span className="font-bold">{money(sub)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-herb">
                      <span>{t("discount")}</span>
                      <span className="font-bold">-{money(discount)}</span>
                    </div>
                  )}
                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between">
                      <span>
                        {distanceKm != null ? t("deliveryFeeKm", { km: distanceKm.toFixed(1) }) : t("deliveryFee")}
                        {quote?.provider && !deliveryCheckLoading && !feeUnavailable && (
                          <span className="block text-sm text-ink/60">{t("deliveredBy", { provider: quote.provider })}</span>
                        )}
                      </span>
                      <span className="font-bold">
                        {deliveryCheckLoading
                          ? "…"
                          : feeUnavailable || !hasLocation
                          ? "—"
                          : effectiveDeliveryFee === 0
                          ? t("free")
                          : money(effectiveDeliveryFee)}
                      </span>
                    </div>
                  )}
                </div>
                {orderType === "DELIVERY" && feeUnavailable && (
                  <div role="alert" className="flex items-center justify-between gap-2 rounded-2xl border-2 border-chili bg-chili/10 p-3 font-medium">
                    <span>{t("feeFailed")}</span>
                    <button
                      type="button"
                      onClick={() => deliveryQuery.refetch()}
                      className="shrink-0 rounded-full border-2 border-chili px-3 py-1 font-bold text-chili hover:bg-chili hover:text-cream"
                    >
                      {tc("retry")}
                    </button>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t-2 border-dashed border-ink/15 pt-4">
                  <span className="text-lg font-bold">{t("total")}</span>
                  <span className="font-display text-[32px] font-extrabold leading-none">{money(total)}</span>
                </div>

                <div className="space-y-3">
                  {error && (
                    <div role="alert" className="flex gap-3 rounded-2xl border-2 border-chili bg-chili/10 p-4">
                      <Icon name="alert" className="h-6 w-6 shrink-0 text-chili" />
                      <div>
                        <p className="font-bold text-chili">{mutation.isError ? t("failedTitle", { method: payName }) : t("checkDetails")}</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  )}
                  <label className="flex cursor-pointer gap-3 rounded-2xl bg-ink/5 p-3">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={() => setAgree(!agree)}
                      className="mt-1 h-5 w-5 shrink-0 accent-chili"
                    />
                    <span>{restaurant?.refundPolicy ? t("refundAgree") : t("refundAgreeShort")}</span>
                  </label>
                  <Button
                    size="lg"
                    full
                    onClick={place}
                    disabled={!agree || mutation.isPending || !!blockedReason}
                    aria-busy={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
                        {t("placing")}
                      </>
                    ) : (
                      t("placeOrder", { total: money(total) })
                    )}
                  </Button>
                  {blockedReason && <p className="text-center text-ink/70">{blockedReason}</p>}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CurrencyProvider>
  );
}