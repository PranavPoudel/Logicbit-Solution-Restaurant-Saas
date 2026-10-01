"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeliveryAuthStore } from "@/store/delivery-auth-store";
import {
  updateDeliveryLocation,
  updateAvailability,
  getAvailableOrders,
  getMyDeliveries,
  acceptOrder,
} from "@/lib/api/delivery";
import { OrderMapModal, type RiderOrder } from "@/components/delivery/order-map-modal";

// Delivery row statuses from the backend (uppercase)
const ACTIVE_STATUSES = ["ASSIGNED", "PICKED_UP", "ON_THE_WAY"];

function toList(data: any): any[] {
  if (Array.isArray(data)) return data;
  return data?.deliveries ?? data?.orders ?? [];
}

// /delivery/my-deliveries returns Delivery rows with the order nested inside
function fromDelivery(d: any): RiderOrder {
  return { ...d.order, deliveryStatus: d.status };
}

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const accessToken = useDeliveryAuthStore((s) => s.accessToken);
  const deliveryPerson = useDeliveryAuthStore((s) => s.deliveryPerson);
  const logout = useDeliveryAuthStore((s) => s.logout);

  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [selected, setSelected] = useState<RiderOrder | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!accessToken) router.push("/delivery/login");
  }, [accessToken, router]);

  function startWatch() {
    if (!navigator.geolocation) {
      setError("Location not supported on this device/browser.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setRiderLocation(loc);
        updateDeliveryLocation(loc).catch(() => {});
      },
      (err) => setError("Location error: " + err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }

  function stopWatch() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  useEffect(() => stopWatch, []);

  // Restore active delivery + resume GPS on refresh
  useEffect(() => {
    if (!accessToken) return;
    getMyDeliveries()
      .then((data) => {
        const active = toList(data).find(
          (d: any) => d.order && ACTIVE_STATUSES.includes(String(d.status).toUpperCase())
        );
        if (active) {
          setActiveOrder(fromDelivery(active));
          setIsOnline(true);
          startWatch();
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Poll available deliveries while online and idle
  useEffect(() => {
    if (!isOnline || activeOrder) return;
    let cancelled = false;

    async function poll() {
      try {
        const data = await getAvailableOrders();
        if (!cancelled) setOrders(toList(data));
      } catch {
        /* ignore transient poll errors */
      }
    }

    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOnline, activeOrder]);

  async function toggleOnline() {
    setToggling(true);
    setError("");
    try {
      const next = !isOnline;
      await updateAvailability(next);
      setIsOnline(next);
      if (next) {
        startWatch();
      } else {
        stopWatch();
        setRiderLocation(null);
        setOrders([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not update availability.");
    } finally {
      setToggling(false);
    }
  }

  async function handleAccept(order: RiderOrder) {
    setAccepting(order.id);
    setError("");
    try {
      await acceptOrder(order.id);
      setActiveOrder({ ...order, deliveryStatus: "ASSIGNED" });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (watchIdRef.current === null) startWatch();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not accept this delivery.");
    } finally {
      setAccepting(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {deliveryPerson?.name ? `Hi, ${deliveryPerson.name}` : "Rider Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">{isOnline ? "You're online" : "You're offline"}</p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className={`rounded-full px-5 py-2 font-medium text-white transition disabled:opacity-60 ${
              isOnline ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {toggling ? "..." : isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        {activeOrder ? (
          <div className="space-y-3 rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Active Delivery</h2>
            <div className="text-sm text-gray-600">
              <p>Order: {activeOrder.orderNumber || activeOrder.id}</p>
              {activeOrder.restaurant?.name && <p>Pickup: {activeOrder.restaurant.name}</p>}
              {activeOrder.deliveryAddress && <p>Deliver to: {activeOrder.deliveryAddress}</p>}
              {activeOrder.deliveryStatus && <p>Status: {activeOrder.deliveryStatus.replace("_", " ")}</p>}
            </div>
            <button
              onClick={() => setSelected(activeOrder)}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              View on map
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Available Deliveries</h2>
            {!isOnline ? (
              <p className="text-sm text-gray-500">Go online to see available deliveries.</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-500">No deliveries available right now.</p>
            ) : (
              <ul className="space-y-3">
                {orders.map((order) => {
                  const ready = order.status === "READY";
                  return (
                    <li
                      key={order.id}
                      onClick={() => setSelected(order)}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:border-gray-400"
                    >
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{order.orderNumber || order.id}</p>
                        {order.restaurant?.name && <p className="text-gray-500">{order.restaurant.name}</p>}
                        {order.deliveryAddress && <p className="text-gray-500">{order.deliveryAddress}</p>}
                        <p className="mt-1 text-xs text-gray-400">
                          {ready
                            ? "Ready for pickup"
                            : order.status === "PENDING"
                              ? "Waiting for restaurant to accept"
                              : "Restaurant is preparing"}{" "}
                          · tap to view map
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(order);
                        }}
                        disabled={!ready || accepting === order.id}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                      >
                        {accepting === order.id ? "..." : ready ? "Accept" : "Not ready"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <button onClick={logout} className="text-sm text-gray-400 hover:underline">
          Log out
        </button>
      </div>

      {selected && (
        <OrderMapModal order={selected} rider={riderLocation} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}