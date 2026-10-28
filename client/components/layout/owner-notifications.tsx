"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Maximize2, X } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { useAutoApprove } from "@/store/auto-rider-store";
import {
  cancelRestaurantOrder,
  getRestaurantOrder,
  listRestaurantOrders,
  rejectRider,
  updateOrderStatus,
} from "@/lib/api/orders";
import type { OwnerOrderSummary } from "@/types/owner-order";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useIsMounted } from "@/hooks/use-is-mounted";

interface Notice {
  key: string;
  kind: "order" | "rider" | "delivered";
  order: OwnerOrderSummary;
  at: number;
}

type NoticeAction = "accept" | "reject" | "approveRider" | "rejectRider" | "complete";

const UPDATE_FAILED = "Couldn't update the order. Please try again.";
const MAX_SHOWN = 8;
const MAX_TOASTS = 3;
const TOAST_MS = 6000;

const seenKey = (restaurantId: string) => `owner-orders-seen:${restaurantId}`;
const createdAt = (order: OwnerOrderSummary) => new Date(order.createdAt ?? 0).getTime();
const orderHref = (orderId: string) => `/owner/orders/${orderId}`;
const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

function playChime() {
  try {
    const audio = new AudioContext();
    [660, 880].forEach((frequency, i) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const start = audio.currentTime + i * 0.15;
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0.15, start);
      volume.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      tone.connect(volume).connect(audio.destination);
      tone.start(start);
      tone.stop(start + 0.3);
    });
  } catch {}
}

function readSeen(restaurantId: string) {
  try {
    return Number(localStorage.getItem(seenKey(restaurantId))) || 0;
  } catch {
    return 0;
  }
}

function itemsSummary(order: OwnerOrderSummary) {
  const items = order.items ?? [];
  const shown = items
    .slice(0, 2)
    .map((item) => `${item.quantity ?? 1}× ${item.menuItem?.name ?? "item"}`)
    .join(", ");
  return items.length > 2 ? `${shown} +${items.length - 2} more` : shown;
}

function NoticeText({ notice }: { notice: Notice }) {
  const { order } = notice;
  const rider = order.delivery?.deliveryPerson;

  return (
    <span className="min-w-0">
      <span className="block text-sm text-neutral-700">
        {notice.kind !== "order" ? (
          <>
            <span className="font-medium text-neutral-900">{rider?.name ?? "A rider"}</span>{" "}
            {notice.kind === "rider" ? "accepted" : "delivered"} order #{order.orderNumber ?? order.id.slice(0, 8)}
          </>
        ) : (
          <>
            <span className="font-medium text-neutral-900">{order.customer?.name ?? "A customer"}</span> ordered{" "}
            {itemsSummary(order)}
          </>
        )}
      </span>
      <span className="block mt-0.5 text-xs text-neutral-400">
        {notice.kind !== "order" ? `${rider?.phone ?? "No phone"} · ` : ""}Rs {order.total ?? 0} · {timeOf(order.createdAt)}
      </span>
    </span>
  );
}

export function OrderActions({
  onAccept,
  onReject,
  acceptLabel = "Accept",
  disabled,
  large = false,
}: {
  onAccept: () => void;
  onReject?: () => void;
  acceptLabel?: string;
  disabled: boolean;
  large?: boolean;
}) {
  const size = large ? "px-6 py-2.5 text-sm" : "px-3.5 py-1.5 text-xs";
  const base = `${size} rounded-lg border border-neutral-900 font-medium transition-colors disabled:opacity-50`;

  return (
    <div className="flex gap-2">
      {onReject && (
        <button
          onClick={onReject}
          disabled={disabled}
          className={`${base} bg-white text-neutral-900 hover:bg-neutral-100`}
        >
          Reject
        </button>
      )}
      <button onClick={onAccept} disabled={disabled} className={`${base} bg-neutral-900 text-white hover:bg-neutral-700`}>
        {acceptLabel}
      </button>
    </div>
  );
}

function NoticeActions({
  notice,
  onRespond,
  disabled,
  large,
}: {
  notice: Notice;
  onRespond: (orderId: string, action: NoticeAction) => void;
  disabled: boolean;
  large?: boolean;
}) {
  const { id } = notice.order;

  if (notice.kind === "delivered") {
    return <OrderActions large={large} disabled={disabled} acceptLabel="Confirm complete" onAccept={() => onRespond(id, "complete")} />;
  }

  return notice.kind === "rider" ? (
    <OrderActions
      large={large}
      disabled={disabled}
      acceptLabel="Approve & send out"
      onAccept={() => onRespond(id, "approveRider")}
      onReject={() => onRespond(id, "rejectRider")}
    />
  ) : (
    <OrderActions
      large={large}
      disabled={disabled}
      onAccept={() => onRespond(id, "accept")}
      onReject={() => onRespond(id, "reject")}
    />
  );
}

export function RiderCard({ order }: { order: OwnerOrderSummary }) {
  const rider = order.delivery?.deliveryPerson;
  const delivered = order.delivery?.status === "DELIVERED";

  return (
    <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
      <p className="text-xs uppercase tracking-wide text-neutral-400">Delivery rider</p>
      <p className="font-semibold text-neutral-900">{rider?.name ?? "Rider"}</p>
      {rider?.phone && (
        <a href={`tel:${rider.phone}`} className="text-neutral-600 hover:underline">
          {rider.phone}
        </a>
      )}
      <p className="text-xs text-neutral-400">
        {delivered ? "Delivered" : "Accepted"} at {timeOf(delivered ? order.delivery?.deliveredAt : order.delivery?.assignedAt)}
      </p>
    </div>
  );
}

function OrderDetails({ order, onOpen }: { order: OwnerOrderSummary; onOpen: () => void }) {
  const discount = order.discountAmount ?? 0;

  return (
    <div className="space-y-4 text-sm text-neutral-600">
      <div>
        <p className="text-base font-semibold text-neutral-900">
          #{order.orderNumber ?? order.id.slice(0, 8)}
          {order.customer?.name ? ` — ${order.customer.name}` : ""}
        </p>
        <p className="text-xs text-neutral-400">
          {order.orderType === "DELIVERY" ? "Delivery" : "Pickup"} · {order.paymentMethod ?? "COD"}
          {order.createdAt ? ` · ${new Date(order.createdAt).toLocaleString()}` : ""}
        </p>
      </div>

      <ul className="space-y-1.5">
        {(order.items ?? []).map((item, i) => {
          const options = (item.selectedModifiers ?? []).map((m) => m.name).join(", ");
          return (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {item.quantity ?? 1}× {item.menuItem?.name ?? "item"}
                {options && <span className="block text-xs text-neutral-400">{options}</span>}
              </span>
              <span className="font-mono shrink-0">Rs {item.subtotal ?? 0}</span>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-neutral-100 pt-3 space-y-1">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-mono">Rs {order.subtotal ?? order.total ?? 0}</span>
        </p>
        {discount > 0 && (
          <p className="flex justify-between">
            <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
            <span className="font-mono">- Rs {discount}</span>
          </p>
        )}
        {order.orderType === "DELIVERY" && (
          <p className="flex justify-between">
            <span>Delivery fee</span>
            <span className="font-mono">Rs {order.deliveryFee ?? 0}</span>
          </p>
        )}
        <p className="flex justify-between font-semibold text-neutral-900">
          <span>Total</span>
          <span className="font-mono">Rs {order.total ?? 0}</span>
        </p>
      </div>

      {(order.customer?.phone || order.deliveryAddress) && (
        <div className="border-t border-neutral-100 pt-3 space-y-1">
          {order.customer?.phone && <p>Phone: {order.customer.phone}</p>}
          {order.orderType === "DELIVERY" && order.deliveryAddress && <p>Deliver to: {order.deliveryAddress}</p>}
        </div>
      )}

      <Link
        href={orderHref(order.id)}
        onClick={onOpen}
        className="inline-block font-medium text-[#1B2333] hover:underline"
      >
        Open in Orders
      </Link>
    </div>
  );
}

function NoticeToast({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  return (
    <div className="pointer-events-auto flex items-start gap-2 w-80 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg transition duration-200 ease-out starting:opacity-0 starting:translate-x-4">
      <Link href={orderHref(notice.order.id)} onClick={onClose} className="flex-1 min-w-0">
        <NoticeText notice={notice} />
      </Link>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="p-1 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function NotificationsFullScreen({
  notices,
  selectedKey,
  onSelect,
  onClose,
  onRespond,
  busy,
  failed,
}: {
  notices: Notice[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
  onRespond: (orderId: string, action: NoticeAction) => void;
  busy: boolean;
  failed: boolean;
}) {
  const selected = notices.find((n) => n.key === selectedKey) ?? notices[0];
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  function close() {
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 200);
  }

  useEscapeKey(close);

  const dialogRef = useDialogFocus<HTMLDivElement>();

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className={`fixed inset-0 z-50 flex flex-col bg-neutral-50 transition-opacity duration-200 ease-out starting:opacity-0 motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <header className="h-16 shrink-0 border-b border-neutral-200 bg-white flex items-center justify-between px-6">
        <h2 className="text-base font-semibold text-neutral-900">
          Notifications <span className="ml-1 text-sm font-normal text-neutral-400">({notices.length})</span>
        </h2>
        <button
          onClick={close}
          aria-label="Close"
          className="p-2 rounded-md hover:bg-neutral-100 text-neutral-600 transition-colors"
        >
          <X size={19} />
        </button>
      </header>

      {notices.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-sm text-neutral-500">No new notifications</p>
      ) : (
        <div className="flex-1 min-h-0 grid md:grid-cols-[22rem_1fr]">
          <ul className="overflow-y-auto border-r border-neutral-200 bg-white divide-y divide-neutral-100">
            {notices.map((notice) => (
              <li key={notice.key}>
                <button
                  onClick={() => onSelect(notice.key)}
                  aria-current={notice.key === selected.key}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    notice.key === selected.key ? "bg-[#E3A008]/10" : "hover:bg-neutral-50"
                  }`}
                >
                  <NoticeText notice={notice} />
                </button>
              </li>
            ))}
          </ul>

          <div className="overflow-y-auto p-6">
            <div className="max-w-xl bg-white border border-neutral-200 rounded-xl p-5">
              {selected.kind !== "order" && <RiderCard order={selected.order} />}
              <OrderDetails order={selected.order} onOpen={close} />
              <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2">
                <NoticeActions large notice={selected} disabled={busy} onRespond={onRespond} />
                {failed && <p className="text-xs text-red-600">{UPDATE_FAILED}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export function OwnerNotifications() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const mounted = useIsMounted();
  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const ordersQuery = useQuery({
    queryKey: ["owner-orders", restaurantId, "all"],
    queryFn: () => listRestaurantOrders(restaurantId as string) as Promise<OwnerOrderSummary[]>,
    enabled: !!restaurantId,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });
  const orders = ordersQuery.data ?? [];

  const riderQueries = useQueries({
    queries: orders
      .filter(
        (o) =>
          ["READY", "OUT_FOR_DELIVERY"].includes((o.status ?? "").toUpperCase()) &&
          o.orderType === "DELIVERY" &&
          o.deliveryHandledBy === "THIRD_PARTY"
      )
      .map((o) => ({
        queryKey: ["owner-orders", restaurantId, "delivery", o.id],
        queryFn: () => getRestaurantOrder(restaurantId as string, o.id) as Promise<OwnerOrderSummary>,
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
      })),
  });

  const queryClient = useQueryClient();
  const respondMutation = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: NoticeAction }) => {
      const id = restaurantId as string;
      if (action === "accept") return updateOrderStatus(id, orderId, "ACCEPTED");
      if (action === "approveRider") return updateOrderStatus(id, orderId, "OUT_FOR_DELIVERY");
      if (action === "rejectRider") return rejectRider(id, orderId);
      if (action === "complete") return updateOrderStatus(id, orderId, "DELIVERED");
      return cancelRestaurantOrder(id, orderId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-orders", restaurantId] }),
  });
  const respond = (orderId: string, action: NoticeAction) => respondMutation.mutate({ orderId, action });

  const notices: Notice[] = [
    ...orders
      .filter((o) => (o.status ?? "").toUpperCase() === "PENDING")
      .map((o) => ({ key: o.id, kind: "order" as const, order: o, at: createdAt(o) })),
    ...riderQueries.flatMap(({ data }): Notice[] => {
      if (data?.status === "READY" && data.delivery?.status === "ASSIGNED") {
        return [{ key: `rider-${data.id}`, kind: "rider", order: data, at: new Date(data.delivery.assignedAt ?? 0).getTime() }];
      }
      if (data?.status === "OUT_FOR_DELIVERY" && data.delivery?.status === "DELIVERED") {
        return [
          { key: `delivered-${data.id}`, kind: "delivered", order: data, at: new Date(data.delivery.deliveredAt ?? 0).getTime() },
        ];
      }
      return [];
    }),
  ].sort((a, b) => b.at - a.at);

  const [toasts, setToasts] = useState<Notice[]>([]);
  const known = useRef<Set<string> | null>(null);
  const dismissToast = (key: string) => setToasts((current) => current.filter((t) => t.key !== key));
  const ready = ordersQuery.isSuccess && riderQueries.every((q) => !q.isLoading);

  useEffect(() => {
    if (!ready) return;
    const fresh = known.current ? notices.filter((n) => !known.current?.has(n.key)) : [];
    known.current = new Set(notices.map((n) => n.key));
    if (fresh.length) {
      setToasts((current) => [...current, ...fresh].slice(-MAX_TOASTS));
      fresh.forEach((n) => setTimeout(() => dismissToast(n.key), TOAST_MS));
      playChime();
    }
  }, [ready, notices]);

  const autoApprove = useAutoApprove(restaurantId);
  const autoApproved = useRef(new Set<string>());

  useEffect(() => {
    if (!autoApprove) return;
    notices
      .filter((n) => n.kind === "rider" && !autoApproved.current.has(n.order.id))
      .forEach((n) => {
        autoApproved.current.add(n.order.id);
        respond(n.order.id, "approveRider");
      });
  });

  const seen = seenAt ?? (mounted && restaurantId ? readSeen(restaurantId) : Infinity);
  const unread = notices.filter((n) => n.at > seen).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEscapeKey(() => setOpen(false), open);

  function markSeen() {
    if (!restaurantId || notices.length === 0) return;
    const newest = notices[0].at;
    setSeenAt(newest);
    try {
      localStorage.setItem(seenKey(restaurantId), String(newest));
    } catch {}
  }

  function toggle() {
    if (!open) markSeen();
    setOpen((v) => !v);
  }

  function openFullScreen() {
    markSeen();
    setSelectedKey(null);
    setOpen(false);
    setFullScreen(true);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        className="relative p-2 rounded-md hover:bg-neutral-100 text-neutral-600 transition-colors"
      >
        <Bell size={19} />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E3A008]" />}
      </button>

      <div
        aria-hidden={!open}
        inert={!open}
        className={`absolute right-0 mt-1 w-80 origin-top-right bg-white border border-neutral-200 rounded-lg shadow-lg z-20 transition duration-200 ease-out motion-reduce:transition-none ${
          open ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 -translate-y-1 scale-95"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
          <p className="text-sm font-medium text-neutral-800">Notifications</p>
          <button
            onClick={openFullScreen}
            aria-label="Open full screen"
            className="p-1 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {notices.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-neutral-500">No new notifications</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto divide-y divide-neutral-100">
            {notices.slice(0, MAX_SHOWN).map((notice) => (
              <li key={notice.key} className="px-3 py-2.5 hover:bg-neutral-50 transition-colors">
                <Link href={orderHref(notice.order.id)} onClick={() => setOpen(false)} className="block">
                  <NoticeText notice={notice} />
                </Link>
                <div className="mt-2">
                  <NoticeActions notice={notice} disabled={respondMutation.isPending} onRespond={respond} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {respondMutation.isError && (
          <p className="px-3 py-2 text-xs text-red-600 border-t border-neutral-100">{UPDATE_FAILED}</p>
        )}

        {notices.length > MAX_SHOWN && (
          <button
            onClick={openFullScreen}
            className="w-full px-3 py-2 text-center text-xs font-medium text-[#1B2333] border-t border-neutral-100 hover:bg-neutral-50"
          >
            View all {notices.length} notifications
          </button>
        )}
      </div>

      {toasts.length > 0 &&
        createPortal(
          <div className="pointer-events-none fixed top-20 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
              <NoticeToast
                key={toast.key}
                notice={toast}
                onClose={() => dismissToast(toast.key)}
              />
            ))}
          </div>,
          document.body
        )}

      {fullScreen && (
        <NotificationsFullScreen
          notices={notices}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onClose={() => setFullScreen(false)}
          onRespond={respond}
          busy={respondMutation.isPending}
          failed={respondMutation.isError}
        />
      )}
    </div>
  );
}
