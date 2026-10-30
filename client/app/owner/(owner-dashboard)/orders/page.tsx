// app/owner/(owner-dashboard)/orders/page.tsx
"use client";

import { useRef, useState, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryError } from "@/components/ui/query-error";
import { getErrorMessage } from "@/lib/utils/error";
import { AlertCircle, ArrowLeft, ClipboardList, Inbox, Loader2, MousePointerClick, WifiOff } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { useAutoApprove, useAutoRiderStore } from "@/store/auto-rider-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useNow } from "@/hooks/use-now";
import { useElementWidth } from "@/hooks/use-element-width";
import { listRestaurantOrders, updateOrderStatus, cancelRestaurantOrder } from "@/lib/api/orders";
import { shortNumber, stageLabel } from "@/lib/utils/order-flow";
import { OrderTabs, ORDERS_PANEL_ID } from "@/components/owner-orders/order-tabs";
import { OrderList, type OrderGroup } from "@/components/owner-orders/order-list";
import { OrderDetail, DETAIL_TITLE_ID, PRIMARY_ACTION_ID } from "@/components/owner-orders/order-detail";
import type { OwnerOrderSummary } from "@/types/order";

const ACTIVE_KEY = "ACTIVE";
const SPLIT_MIN_WIDTH = 760;

const ACTIVE_GROUPS = [
  { key: "PENDING", label: "New", statuses: ["PENDING"] },
  { key: "ACCEPTED", label: "Accepted", statuses: ["ACCEPTED"] },
  { key: "PREPARING", label: "Preparing", statuses: ["PREPARING", "READY"] },
  { key: "OUT_FOR_DELIVERY", label: "On the way", statuses: ["OUT_FOR_DELIVERY"] },
];
const HISTORY_GROUPS = [
  { key: "DELIVERED", label: "Completed", statuses: ["DELIVERED", "COMPLETED"] },
  { key: "CANCELLED", label: "Cancelled", statuses: ["CANCELLED"] },
];

const EMPTY: Record<string, string> = {
  [ACTIVE_KEY]: "No active orders. New orders appear here the moment a customer places one.",
  DELIVERED: "No completed orders yet.",
  CANCELLED: "No cancelled orders.",
};

const statusOf = (o: OwnerOrderSummary) => (o.status ?? "PENDING").toUpperCase();
const placedAt = (o: OwnerOrderSummary) => new Date(o.createdAt ?? 0).getTime();

function OrdersPageContent() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const mounted = useIsMounted();
  const autoApprove = useAutoApprove(restaurantId);
  const setAutoApprove = useAutoRiderStore((s) => s.setAutoApprove);
  const on = mounted && autoApprove;
  const now = useNow(30000);
  const [paneRef, width] = useElementWidth();
  const split = width >= SPLIT_MIN_WIDTH;

  const [tab, setTab] = useState(ACTIVE_KEY);
  const [selectedId, setSelectedId] = useState<string>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const announceTimer = useRef<number>(undefined);

  const ordersQuery = useQuery({
    queryKey: ["owner-orders", restaurantId, "all"],
    queryFn: () => listRestaurantOrders(restaurantId as string) as Promise<OwnerOrderSummary[]>,
    enabled: !!restaurantId,
    refetchInterval: 15000,
  });

  const orders = ordersQuery.data;
  const cachedOrder = (id: string) => queryClient.getQueryData<OwnerOrderSummary[]>(["owner-orders", restaurantId, "all"])?.find((o) => o.id === id);

  const settle = async (orderId: string, message: (before?: OwnerOrderSummary, after?: OwnerOrderSummary) => string) => {
    const before = cachedOrder(orderId);
    await queryClient.invalidateQueries({ queryKey: ["owner-orders", restaurantId] });
    setAnnouncement(message(before, cachedOrder(orderId)));
    window.clearTimeout(announceTimer.current);
    announceTimer.current = window.setTimeout(() => setAnnouncement(""), 5000);
    requestAnimationFrame(() => {
      const stillShown = document.querySelector<HTMLElement>("article[data-order-id]")?.dataset.orderId === orderId;
      ((stillShown && document.getElementById(PRIMARY_ACTION_ID)) || document.getElementById(DETAIL_TITLE_ID) || document.getElementById(ORDERS_PANEL_ID))?.focus();
    });
  };

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => updateOrderStatus(restaurantId as string, orderId, status),
    onSuccess: (_data, { orderId }) => settle(orderId, (before, after) => `Order ${before ? shortNumber(before) : ""} is now ${after ? stageLabel(statusOf(after), after.orderType) : "updated"}`),
  });
  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => cancelRestaurantOrder(restaurantId as string, orderId),
    onSuccess: (_data, orderId) => settle(orderId, (before) => `Order ${before ? shortNumber(before) : ""} cancelled`),
  });

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">No restaurant selected. Use the restaurant switcher in the top bar.</p>
      </div>
    );
  }

  const inGroup = (statuses: string[]) => (orders ?? []).filter((o) => statuses.includes(statusOf(o)));
  const oldestFirst = (list: OwnerOrderSummary[]) => [...list].sort((a, b) => placedAt(a) - placedAt(b));

  const activeCount = ACTIVE_GROUPS.reduce((sum, g) => sum + inGroup(g.statuses).length, 0);
  const newCount = inGroup(["PENDING"]).length;
  const closed = tab !== ACTIVE_KEY;

  const groups: OrderGroup[] = (closed ? HISTORY_GROUPS.filter((g) => g.key === tab) : ACTIVE_GROUPS)
    .map((g) => ({ key: g.key, label: g.label, orders: closed ? inGroup(g.statuses).sort((a, b) => placedAt(b) - placedAt(a)) : oldestFirst(inGroup(g.statuses)) }))
    .filter((g) => g.orders.length > 0);
  const flat = groups.flatMap((g) => g.orders);
  const selected = flat.find((o) => o.id === selectedId) ?? (split ? flat[0] : undefined);

  const tabs = [
    { key: ACTIVE_KEY, label: "Active", count: activeCount, highlight: newCount > 0, history: false },
    ...HISTORY_GROUPS.map((g) => ({ key: g.key, label: g.label, count: 0, highlight: false, history: true })),
  ];

  const busy = statusMutation.isPending || cancelMutation.isPending;
  const pendingId = statusMutation.isPending ? statusMutation.variables?.orderId : cancelMutation.isPending ? cancelMutation.variables : undefined;
  const actionError = statusMutation.error ?? cancelMutation.error;
  const offline = ordersQuery.isError && !!orders;
  const showDetail = split || (detailOpen && !!selected);

  const select = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div ref={paneRef} className="max-w-[1600px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-neutral-900">Orders</h1>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500" aria-live="off">
            {offline ? (
              <>
                <WifiOff size={12} aria-hidden="true" className="text-amber-600" />
                <span className="text-amber-700">Connection lost, retrying</span>
              </>
            ) : ordersQuery.isFetching ? (
              <>
                <Loader2 size={12} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                Updating
              </>
            ) : (
              <>
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live, updated {new Date(ordersQuery.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-describedby="auto-approve-hint"
          onClick={() => setAutoApprove(restaurantId, !autoApprove)}
          className="flex min-h-11 items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2"
        >
          <span>
            <span className="block text-sm font-medium text-neutral-800">Auto-approve riders</span>
            <span id="auto-approve-hint" className="block text-xs text-neutral-500">Accept rider requests automatically</span>
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors motion-reduce:transition-none ${on ? "bg-neutral-900" : "bg-neutral-300"}`}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${on ? "translate-x-5" : ""}`} />
          </span>
        </button>
      </div>

      <p role="status" className="sr-only">
        {announcement || (newCount > 0 ? `${newCount} new ${newCount === 1 ? "order" : "orders"} waiting` : "No new orders")}
      </p>

      {actionError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" />
          <p className="flex-1 text-sm text-red-800">{getErrorMessage(actionError, "Couldn't update the order. Please try again.")}</p>
          <button
            type="button"
            onClick={() => {
              statusMutation.reset();
              cancelMutation.reset();
            }}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-800 hover:bg-red-100 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Dismiss
          </button>
        </div>
      )}

      <div>
        <OrderTabs
          tabs={tabs}
          activeKey={tab}
          onSelect={(key) => {
            setTab(key);
            setDetailOpen(false);
          }}
        />

        <div role="tabpanel" tabIndex={-1} id={ORDERS_PANEL_ID} aria-labelledby={`orders-tab-${tab}`} className="mt-5 outline-none">
          {ordersQuery.isLoading ? (
            <div className="space-y-px overflow-hidden rounded-2xl border border-neutral-200" aria-label="Loading orders">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[4.5rem] animate-pulse bg-neutral-100 motion-reduce:animate-none" />
              ))}
            </div>
          ) : ordersQuery.isError && !orders ? (
            <QueryError what="orders" error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />
          ) : flat.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
              {closed ? <ClipboardList size={26} aria-hidden="true" className="text-neutral-300" /> : <Inbox size={26} aria-hidden="true" className="text-neutral-300" />}
              <p className="max-w-xs text-sm text-neutral-500">{EMPTY[tab]}</p>
            </div>
          ) : (
            <div className={`overflow-clip rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04),0_12px_28px_-16px_rgba(17,24,39,0.18)] ${split ? "grid min-h-[32rem] [grid-template-columns:20rem_minmax(0,1fr)]" : ""}`}>
              {(split || !showDetail) && (
                <div className={`bg-neutral-50 ${split ? "border-r border-neutral-200" : ""}`}>
                  <div className={split ? "max-h-[70dvh] overflow-y-auto" : ""}>
                    <OrderList groups={groups} selectedId={selected?.id} now={now} closed={closed} onSelect={select} />
                  </div>
                </div>
              )}

              {showDetail && (
                <div className="flex min-w-0 flex-col">
                  {!split && (
                    <button
                      type="button"
                      onClick={() => setDetailOpen(false)}
                      className="flex min-h-12 items-center gap-2 border-b border-neutral-200 px-4 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E3A008]"
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                      All orders
                    </button>
                  )}
                  {selected ? (
                    <OrderDetail
                      key={selected.id}
                      order={selected}
                      now={now}
                      disabled={busy}
                      pending={pendingId === selected.id}
                      onAdvance={(status) => {
                        setSelectedId(selected.id);
                        statusMutation.mutate({ orderId: selected.id, status });
                      }}
                      onCancel={() => {
                        setSelectedId(selected.id);
                        cancelMutation.mutate(selected.id);
                      }}
                    />
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
                      <MousePointerClick size={26} aria-hidden="true" className="text-neutral-300" />
                      <p className="text-sm text-neutral-500">Choose an order to see its details.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-center py-12 text-neutral-500">Loading orders…</p>}>
      <OrdersPageContent />
    </Suspense>
  );
}
