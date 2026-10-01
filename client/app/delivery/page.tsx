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

import {
  OrderMapModal,
  type RiderOrder,
} from "@/components/delivery/order-map-modal";

const ACTIVE_STATUSES = [
  "ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
];

function toList(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.deliveries)) {
    return data.deliveries;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function fromDelivery(d: any): RiderOrder {
  return {
    ...(d?.order ?? d),
    deliveryStatus: d?.status,
  };
}

function hasCoordinates(order: RiderOrder) {
  return (
    typeof order.deliveryLatitude === "number" &&
    Number.isFinite(order.deliveryLatitude) &&
    typeof order.deliveryLongitude === "number" &&
    Number.isFinite(order.deliveryLongitude)
  );
}

export default function DeliveryDashboardPage() {
  const router = useRouter();

  const accessToken = useDeliveryAuthStore(
    (state) => state.accessToken
  );

  const deliveryPerson = useDeliveryAuthStore(
    (state) => state.deliveryPerson
  );

  const logout = useDeliveryAuthStore(
    (state) => state.logout
  );

  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [orders, setOrders] = useState<RiderOrder[]>([]);

  const [activeOrder, setActiveOrder] =
    useState<RiderOrder | null>(null);

  const [selected, setSelected] =
    useState<RiderOrder | null>(null);

  const [riderLocation, setRiderLocation] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [accepting, setAccepting] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const watchIdRef = useRef<number | null>(null);

  /*
   * Redirect rider to login if there is no delivery token.
   */
  useEffect(() => {
    if (!accessToken) {
      router.push("/delivery/login");
    }
  }, [accessToken, router]);

  /*
   * Start rider GPS tracking.
   */
  function startWatch() {
    if (!navigator.geolocation) {
      setError(
        "Location is not supported on this device/browser."
      );
      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setRiderLocation(location);

          updateDeliveryLocation(location).catch(() => {
            /*
             * GPS reporting failure should not stop
             * the rider dashboard.
             */
          });
        },
        (err) => {
          setError(
            "Location error: " + err.message
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 15000,
        }
      );
  }

  /*
   * Stop rider GPS tracking.
   */
  function stopWatch() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }
  }

  /*
   * Stop GPS when page is destroyed.
   */
  useEffect(() => {
    return () => {
      stopWatch();
    };
  }, []);

  /*
   * Restore active delivery after refresh.
   */
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    getMyDeliveries()
      .then((data) => {
        const deliveries = toList(data);

        const activeDelivery = deliveries.find(
          (delivery: any) =>
            delivery?.order &&
            ACTIVE_STATUSES.includes(
              String(delivery.status).toUpperCase()
            )
        );

        if (activeDelivery) {
          const order =
            fromDelivery(activeDelivery);

          setActiveOrder(order);
          setIsOnline(true);
          startWatch();
        }
      })
      .catch(() => {
        /*
         * Ignore restore errors.
         */
      });

    // startWatch is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  /*
   * Poll available orders while rider is online
   * and does not currently have an active delivery.
   */
  useEffect(() => {
    if (!isOnline || activeOrder) {
      return;
    }

    let cancelled = false;

    async function pollAvailableOrders() {
      try {
        const data = await getAvailableOrders();

        const list = toList(data);

        if (!cancelled) {
          setOrders(list);
        }
      } catch {
        /*
         * Ignore temporary polling failures.
         */
      }
    }

    pollAvailableOrders();

    const interval = window.setInterval(
      pollAvailableOrders,
      8000
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isOnline, activeOrder]);

  /*
   * Online / offline button.
   */
  async function toggleOnline() {
    setToggling(true);
    setError("");

    try {
      const nextStatus = !isOnline;

      await updateAvailability(nextStatus);

      setIsOnline(nextStatus);

      if (nextStatus) {
        startWatch();
      } else {
        stopWatch();

        setRiderLocation(null);
        setOrders([]);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not update availability."
      );
    } finally {
      setToggling(false);
    }
  }

  /*
   * Accept delivery.
   */
  async function handleAccept(order: RiderOrder) {
    setAccepting(order.id);
    setError("");

    try {
      await acceptOrder(order.id);

      const acceptedOrder: RiderOrder = {
        ...order,
        deliveryStatus: "ASSIGNED",
      };

      setActiveOrder(acceptedOrder);

      setOrders((previous) =>
        previous.filter(
          (item) => item.id !== order.id
        )
      );

      if (watchIdRef.current === null) {
        startWatch();
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not accept this delivery."
      );
    } finally {
      setAccepting(null);
    }
  }

  /*
   * Open map for an order.
   */
  function handleOpenMap(order: RiderOrder) {
    setSelected(order);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Rider header */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {deliveryPerson?.name
                ? `Hi, ${deliveryPerson.name}`
                : "Rider Dashboard"}
            </h1>

            <p className="text-sm text-gray-500">
              {isOnline
                ? "You're online"
                : "You're offline"}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleOnline}
            disabled={toggling}
            className={`rounded-full px-5 py-2 font-medium text-white transition disabled:opacity-60 ${
              isOnline
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {toggling
              ? "..."
              : isOnline
              ? "Go Offline"
              : "Go Online"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Active delivery */}
        {activeOrder ? (
          <div className="space-y-3 rounded-2xl bg-white p-5 shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Active Delivery
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Order:{" "}
                  {activeOrder.orderNumber ||
                    activeOrder.id}
                </p>

                {activeOrder.restaurant?.name && (
                  <p className="text-sm text-gray-600">
                    Pickup:{" "}
                    {activeOrder.restaurant.name}
                  </p>
                )}

                {activeOrder.deliveryAddress && (
                  <p className="text-sm text-gray-600">
                    Deliver to:{" "}
                    {activeOrder.deliveryAddress}
                  </p>
                )}

                {activeOrder.deliveryStatus && (
                  <p className="text-sm text-gray-600">
                    Status:{" "}
                    {activeOrder.deliveryStatus.replace(
                      /_/g,
                      " "
                    )}
                  </p>
                )}
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Assigned
              </span>
            </div>

            {hasCoordinates(activeOrder) && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                Delivery location:
                <br />
                {activeOrder.deliveryLatitude!.toFixed(
                  6
                )}
                ,{" "}
                {activeOrder.deliveryLongitude!.toFixed(
                  6
                )}
              </div>
            )}

            {!hasCoordinates(activeOrder) && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                This order does not contain delivery
                coordinates.
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                handleOpenMap(activeOrder)
              }
              className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              View Delivery on Map
            </button>
          </div>
        ) : (
          /* Available deliveries */
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Available Deliveries
            </h2>

            {!isOnline ? (
              <p className="text-sm text-gray-500">
                Go online to see available deliveries.
              </p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-500">
                No deliveries available right now.
              </p>
            ) : (
              <ul className="space-y-3">
                {orders.map((order) => {
                  const ready =
                    String(order.status).toUpperCase() ===
                    "READY";

                  const coordinatesAvailable =
                    hasCoordinates(order);

                  return (
                    <li
                      key={order.id}
                      className="rounded-lg border border-gray-200 p-3 hover:border-gray-400"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenMap(order)
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="font-medium text-gray-900">
                            {order.orderNumber ||
                              order.id}
                          </p>

                          {order.restaurant?.name && (
                            <p className="text-sm text-gray-500">
                              {order.restaurant.name}
                            </p>
                          )}

                          {order.deliveryAddress && (
                            <p className="text-sm text-gray-500">
                              {order.deliveryAddress}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-gray-400">
                            {ready
                              ? "Ready for pickup"
                              : String(
                                  order.status
                                ).toUpperCase() ===
                                "PENDING"
                              ? "Waiting for restaurant to accept"
                              : "Restaurant is preparing"}
                          </p>

                          <p className="mt-1 text-xs font-medium text-blue-600">
                            Tap order to view map
                          </p>

                          {coordinatesAvailable && (
                            <p className="mt-1 text-[11px] text-green-600">
                              Delivery pin available
                            </p>
                          )}

                          {!coordinatesAvailable && (
                            <p className="mt-1 text-[11px] text-amber-600">
                              Delivery coordinates unavailable
                            </p>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleAccept(order)
                          }
                          disabled={
                            !ready ||
                            accepting === order.id
                          }
                          className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                        >
                          {accepting === order.id
                            ? "..."
                            : ready
                            ? "Accept"
                            : "Not ready"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="text-sm text-gray-400 hover:underline"
        >
          Log out
        </button>
      </div>

      {/* Map modal */}
      {selected && (
        <OrderMapModal
          order={selected}
          rider={riderLocation}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}
