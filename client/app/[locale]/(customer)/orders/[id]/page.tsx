// app/%28customer%29/orders/%5Bid%5D/page.tsx
"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getMyOrder } from "@/lib/api/orders";
import { money } from "@/lib/utils/money";
import { ORDER_STATUS_STEPS, PICKUP_STATUS_STEPS } from "@/types/order";
import { ThermalReceipt } from "@/components/print/ThermalReceipt";
import { ReviewModal } from "@/components/review/review-modal";
import { Badge, Button, Card, Icon, RefundNote, Stamp } from "@/components/ui/primitives";

const DONE_STATUSES = ["DELIVERED", "COMPLETED", "CANCELLED"];
const CANCELLABLE_STATUSES = ["PENDING", "ACCEPTED"];

const KNOWN_HEADLINES = ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const OrderMap = dynamic(() => import("@/components/delivery/order-map"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const t = useTranslations("order");
  return <div className="flex h-full w-full items-center justify-center bg-ink/5 text-lg text-ink/60">{t("loadingMap")}</div>;
}

function BackToOrders() {
  const t = useTranslations("order");
  return (
    <Link href="/account?tab=orders" className="flex min-h-11 items-center gap-1 font-bold">
      <Icon name="back" />
      {t("backToOrders")}
    </Link>
  );
}

function Confetti() {
  const colors = ["var(--brand-chili)", "var(--brand-saffron)", "var(--brand-herb)", "var(--brand-blush)"];
  return (
    <>
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="pop absolute rounded-full"
          aria-hidden
          style={{ background: colors[i % 4], width: 10 + (i % 4) * 8, height: 10 + (i % 4) * 8, left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%`, animationDelay: `${i * 40}ms` }}
        />
      ))}
    </>
  );
}

export default function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const t = useTranslations("order");
  const { id } = use(params);
  const sp = use(searchParams);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(sp.placed === "1");

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getMyOrder(id),
    refetchInterval: (query) => (DONE_STATUSES.includes(query.state.data?.status ?? "") ? false : 10000),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-10" aria-busy="true">
        <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-ink/10" />
        <div className="mt-6 h-40 animate-pulse rounded-[28px] bg-ink/10" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-16 text-center" role="alert">
        <h1 className="font-display text-4xl font-extrabold">{t("loadErrorTitle")}</h1>
        <p className="text-lg text-ink/75">{t("loadErrorBody")}</p>
        <BackToOrders />
      </div>
    );
  }

  const status = (order.status ?? "PENDING").toUpperCase();
  const normalized = status === "COMPLETED" ? "DELIVERED" : status;
  const canReview = normalized === "DELIVERED";
  const cancelled = normalized === "CANCELLED";
  const rider = order.delivery?.deliveryPerson;
  const isPickup = order.orderType === "PICKUP" || order.orderType === "DINE_IN";
  const steps: readonly string[] = isPickup ? PICKUP_STATUS_STEPS : ORDER_STATUS_STEPS;
  const current = Math.max(steps.findIndex((s) => s === normalized), 0);
  const msgKey = `statusMsg.${normalized}`;
  const statusMessage = t.has(`${msgKey}.message`) ? (isPickup && t.has(`${msgKey}.pickup`) ? t(`${msgKey}.pickup`) : t(`${msgKey}.message`)) : undefined;
  const restaurantName = order.restaurant?.name ?? t("theRestaurant");
  const hk = KNOWN_HEADLINES.includes(normalized) ? normalized : "PENDING";
  const headHead = t(`headline.${hk}.head`);
  const headAccent = isPickup && t.has(`headline.${hk}.pickup`) ? t(`headline.${hk}.pickup`) : t(`headline.${hk}.accent`);
  const phone = order.restaurant?.phone ?? "none";
  const phoneLink = (chunks: React.ReactNode) => <a className="font-bold underline" href={`tel:${phone}`}>{chunks}</a>;
  const orderNumber = order.orderNumber ?? order.id.slice(0, 8);
  const hasMap = !isPickup && order.deliveryLatitude != null && order.deliveryLongitude != null && !cancelled;
  const payTone = order.paymentStatus === "PAID" ? "herb" : order.paymentStatus === "REFUNDED" ? "saffron" : "soft";
  const payText =
    order.paymentStatus === "PAID"
      ? t("paid", { method: t.has(`payLabel.${order.paymentMethod}`) ? t(`payLabel.${order.paymentMethod}`) : t("online") })
      : order.paymentStatus === "REFUNDED"
        ? t("refunded")
        : order.paymentMethod === "COD"
          ? (isPickup ? t("payAtPickup") : t("payOnDelivery"))
          : t("paymentPending");

  const dismissConfirm = () => {
    setConfirmOpen(false);
    router.replace(`/orders/${id}`);
  };

  if (confirmOpen) {
    return (
      <div className="relative grid min-h-[80vh] place-items-center overflow-hidden px-5 py-10">
        <Confetti />
        <div className="blob absolute h-[520px] w-[520px] bg-saffron md:h-[720px] md:w-[720px]" aria-hidden />
        <div className="relative max-w-lg text-center text-espresso">
          <div className="pop mx-auto grid h-36 w-36 place-items-center rounded-full bg-herb text-parchment shadow-hard"><Icon name="check" className="h-20 w-20" /></div>
          <h1 className="mt-8 font-display text-6xl font-extrabold leading-[0.9] tracking-tight md:text-8xl">{t("orderIn")}</h1>
          <p className="mt-4 text-lg">{t("hasYourOrder", { restaurant: restaurantName })}</p>
          <div className="mt-6 inline-flex flex-wrap justify-center gap-3">
            <span className="rounded-2xl bg-paper px-5 py-3 font-bold text-ink shadow-hard">{t("orderNumber", { number: orderNumber })}</span>
            <span className="rounded-2xl bg-ink px-5 py-3 font-bold text-cream shadow-hard">{t(isPickup ? "pickupTotal" : "deliveryTotal", { total: money(order.total ?? 0) })}</span>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="accent" onClick={dismissConfirm}>{t("trackOrder")}</Button>
            <Link href="/"><Button size="lg" variant="outline" className="border-espresso bg-parchment text-espresso">{t("backHome")}</Button></Link>
          </div>
        </div>
        <Stamp text={t("stamp")} className="absolute bottom-6 right-6 hidden h-32 w-32 bg-chili text-parchment md:grid" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <BackToOrders />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-bold text-ink/70">{t("orderLine", { number: orderNumber, restaurant: restaurantName })}</p>
            <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight md:text-7xl">
              {cancelled ? (
                <>{t("cancelledHead")} <span className="text-chili">{t("cancelledAccent")}</span></>
              ) : (
                <>
                  {headHead} <span className={normalized === "DELIVERED" ? "text-herb" : "text-chili"}>{headAccent}</span>
                </>
              )}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={payTone}><Icon name="check" className="h-4 w-4" />{payText}</Badge>
          </div>
        </div>

        {cancelled ? (
          <Card className="mt-6 flex items-center gap-4 !border-2 border-chili bg-chili/10">
            <Icon name="alert" className="h-8 w-8 shrink-0 text-chili" />
            <p className="text-lg font-bold">{t("cancelledBody")}</p>
          </Card>
        ) : (
          <Card className="mt-6">
            <ol className={`grid gap-4 md:gap-0 ${steps.length >= 6 ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
              {steps.map((s, i) => {
                const done = i < current || (i === current && normalized === "DELIVERED");
                const cur = i === current && !done;
                return (
                  <li key={s} className="relative flex items-center gap-4 md:flex-col md:text-center" aria-current={cur ? "step" : undefined}>
                    {i < steps.length - 1 && (
                      <span className={`absolute left-6 top-12 h-[calc(100%-8px)] w-1.5 rounded-full md:left-[calc(50%+28px)] md:top-6 md:h-1.5 md:w-[calc(100%-56px)] ${i < current ? "bg-herb" : "bg-ink/10"}`} aria-hidden />
                    )}
                    <span className={`relative z-10 grid shrink-0 place-items-center rounded-full font-display font-extrabold transition ${cur ? "h-14 w-14 bg-chili text-parchment ring-8 ring-chili/20" : done ? "h-12 w-12 bg-herb text-parchment" : "h-12 w-12 bg-ink/10 text-ink/50"}`}>
                      {done ? <Icon name="check" /> : i + 1}
                    </span>
                    <div className="md:mt-3">
                      <p className={`font-display text-xl font-extrabold ${cur ? "text-chili" : done ? "" : "text-ink/50"}`}>
                        {s === "DELIVERED" && isPickup ? t("status.PICKED_UP") : t.has(`status.${s}`) ? t(`status.${s}`) : s}
                      </p>
                      {cur && <p className="text-ink/60">{t("now")}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
            {statusMessage && <p className="mt-6 text-center text-lg text-ink/75">{statusMessage}</p>}
          </Card>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            {hasMap && (
              <Card className="relative overflow-hidden !p-0">
                <div className="isolate h-72 md:h-96">
                  <OrderMap
                    restaurant={
                      order.restaurant?.latitude != null && order.restaurant?.longitude != null
                        ? { lat: order.restaurant.latitude, lng: order.restaurant.longitude, name: order.restaurant.name }
                        : null
                    }
                    customer={{ lat: order.deliveryLatitude as number, lng: order.deliveryLongitude as number, address: order.deliveryAddress ?? "" }}
                  />
                </div>
                {rider && normalized === "OUT_FOR_DELIVERY" && (
                  <div className="flex items-center gap-4 p-5">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-saffron font-display text-2xl font-extrabold text-ink ring-4 ring-saffron/40">{(rider.name ?? t("riderFallback")).charAt(0)}</span>
                    <div className="flex-1">
                      <p className="font-display text-xl font-extrabold">{rider.name ?? t("riderFallback")}</p>
                      <p className="text-ink/70">{t("yourRider")}</p>
                    </div>
                    {rider.phone && (
                      <a href={`tel:${rider.phone}`} className="flex min-h-12 items-center gap-2 rounded-full bg-herb px-5 font-bold text-parchment shadow-hard"><Icon name="phone" />{t("call")}</a>
                    )}
                  </div>
                )}
              </Card>
            )}

            {canReview && (
              <Card className="border-4 border-saffron">
                <h2 className="font-display text-3xl font-extrabold">{t("howWasIt")}</h2>
                <p className="mt-2 text-lg text-ink/75">{t("howWasItBody", { restaurant: restaurantName })}</p>
                <Button size="lg" className="mt-4" onClick={() => setShowReviewModal(true)}>{t("rate")}</Button>
              </Card>
            )}

            <Card>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-3xl font-extrabold">{t("yourOrder")}</h2>
                {!cancelled && (
                  <Button variant="outline" onClick={() => window.print()} title={t("receiptTitle")}><Icon name="info" className="h-4 w-4" />{t("receipt")}</Button>
                )}
              </div>
              <ul className="divide-y-2 divide-dashed divide-ink/10">
                {(order.items ?? []).map((item) => (
                  <li key={item.id} className="flex gap-4 py-3">
                    <span className="font-display text-xl font-extrabold text-chili">{item.quantity ?? 1}×</span>
                    <div className="flex-1">
                      <p className="font-bold">{item.menuItem?.name ?? t("itemFallback", { price: item.unitPrice != null ? money(item.unitPrice) : "?" })}</p>
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && <p className="text-ink/65">{item.selectedModifiers.map((m) => m.name).join(" · ")}</p>}
                    </div>
                    <span className="font-bold">{money(item.subtotal ?? item.price ?? 0)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-2 border-t-2 border-ink/10 pt-4">
                {order.subtotal != null && <div className="flex justify-between"><span>{t("subtotal")}</span><b>{money(order.subtotal)}</b></div>}
                {!!order.discountAmount && <div className="flex justify-between text-herb"><span>{t("discount")}</span><b>-{money(order.discountAmount)}</b></div>}
                {!isPickup && order.deliveryFee != null && <div className="flex justify-between"><span>{t("delivery")}</span><b>{order.deliveryFee === 0 ? t("free") : money(order.deliveryFee)}</b></div>}
                <div className="flex items-end justify-between pt-2">
                  <span className="text-lg font-bold">{t("total")}</span>
                  <span className="font-display text-3xl font-extrabold">{money(order.total ?? 0)}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card>
              <h2 className="font-display text-2xl font-extrabold">{t("somethingOff")}</h2>
              {CANCELLABLE_STATUSES.includes(status) ? (
                <p className="mt-3 text-ink/75">{t.rich("cancelText", { restaurant: restaurantName, phone, a: phoneLink })}</p>
              ) : !cancelled && !canReview ? (
                <p className="mt-3 text-ink/75">{t.rich("startedText", { restaurant: restaurantName, phone, a: phoneLink })}</p>
              ) : (
                <p className="mt-3 text-ink/75">{t("contact", { restaurant: restaurantName })}</p>
              )}
              {order.restaurant?.phone && (
                <a href={`tel:${order.restaurant.phone}`} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 font-bold text-cream shadow-soft"><Icon name="phone" />{t("callRestaurant", { restaurant: restaurantName })}</a>
              )}
            </Card>

            {isPickup && !cancelled && order.restaurant?.address && (
              <Card className="!bg-saffron text-espresso">
                <p className="font-display text-2xl font-extrabold">{t("collectFrom")}</p>
                <p className="mt-1 font-bold">{restaurantName}</p>
                <p className="mt-1">{order.restaurant.address}</p>
              </Card>
            )}

            {order.deliveryAddress && (
              <Card className="!bg-saffron text-espresso">
                <p className="font-display text-2xl font-extrabold">{t("deliveringTo")}</p>
                <p className="mt-1">{order.deliveryAddress}</p>
                {order.customer?.phone && <p className="mt-1">{order.customer.phone}</p>}
              </Card>
            )}

            <RefundNote text={order.restaurant?.refundPolicy} />
          </div>
        </div>
      </div>

      <div className="hidden print:block">
        <ThermalReceipt order={order} />
      </div>

      <ReviewModal
        orderId={order.id}
        restaurantId={order.restaurant?.id ?? ""}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          setShowReviewModal(false);
          queryClient.invalidateQueries({ queryKey: ["order", id] });
        }}
      />
    </div>
  );
}
