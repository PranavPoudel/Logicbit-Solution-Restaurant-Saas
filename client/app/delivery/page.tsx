"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useDeliveryAuthStore } from "@/store/delivery-auth-store";
import {
  updateDeliveryLocation,
  updateAvailability,
  getAvailableOrders,
  getMyDeliveries,
  acceptOrder,
} from "@/lib/api/delivery";

const DeliveryMap = dynamic(() => import("@/components/delivery/DeliveryMap"), {
  ssr: false,
});

const ACTIVE_STATUSES = ["accepted", "picked_up", "in_transit", "on_the_way"];

function extractLatLng(obj: any): { latitude: number; longitude: number } | null {
  if (!obj) return null;
  const lat =
    obj.latitude ?? obj.lat ?? obj?.restaurant?.latitude ?? obj?.restaurantLatitude;
  const lng =
    obj.longitude ?? obj.lng ?? obj?.restaurant?.longitude ?? obj?.restaurantLongitude;
  if (typeof lat === "number" && typeof lng === "number") {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const accessToken = useDeliveryAuthStore((s) => s.accessToken);
  const deliveryPerson = useDeliveryAuthStore((s) => s.deliveryPerson);
  const logout = useDeliveryAuthStore((s) => s.logout);

  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
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
        const list = Array.isArray(data) ? data : data?.orders ?? [];
        const active = list.find((o: any) =>
          ACTIVE_STATUSES.includes((o.status || "").toLowerCase())
        );
        if (active) {
          setActiveOrder(active);
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
        const list = Array.isArray(data) ? data : data?.orders ?? [];
        if (!cancelled) setOrders(list);
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

  async function handleAccept(orderId: string) {
    setAccepting(orderId);
    setError("");
    try {
      const updated = await acceptOrder(orderId);
      setActiveOrder(updated);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (watchIdRef.current === null) startWatch();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not accept this delivery.");
    } finally {
      setAccepting(null);
    }
  }

  const restaurantLocation = extractLatLng(activeOrder?.restaurant ?? activeOrder);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {deliveryPerson?.name ? `Hi, ${deliveryPerson.name}` : "Rider Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">
              {isOnline ? "You're online" : "You're offline"}
            </p>
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

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {activeOrder ? (
          <div className="space-y-4 rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Active Delivery</h2>
            <div className="text-sm text-gray-600">
              <p>Order: {activeOrder.orderNumber || activeOrder.id}</p>
              {activeOrder.restaurant?.name && <p>Pickup: {activeOrder.restaurant.name}</p>}
              {activeOrder.deliveryAddress && <p>Deliver to: {activeOrder.deliveryAddress}</p>}
            </div>
            <DeliveryMap riderLocation={riderLocation} restaurantLocation={restaurantLocation} />
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
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {order.orderNumber || order.id}
                      </p>
                      {order.restaurant?.name && (
                        <p className="text-gray-500">{order.restaurant.name}</p>
                      )}
                      {order.deliveryAddress && (
                        <p className="text-gray-500">{order.deliveryAddress}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={accepting === order.id}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                      {accepting === order.id ? "..." : "Accept"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button onClick={logout} className="text-sm text-gray-400 hover:underline">
          Log out
        </button>
      </div>
    </main>
  );
}