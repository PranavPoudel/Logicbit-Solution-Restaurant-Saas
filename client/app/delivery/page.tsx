"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeliveryAuthStore } from "@/store/delivery-auth-store";
import {
  toggleAvailability,
  getAvailableDeliveries,
  acceptDeliveryOrder,
  updateMyLocation,
} from "@/lib/api/delivery";
interface DeliveryOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount?: number;
  createdAt?: string;
  restaurant?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

export default function DeliveryDashboardPage() {
  const router = useRouter();

  const deliveryPerson = useDeliveryAuthStore(
    (state) => state.deliveryPerson
  );

  const isAvailable = useDeliveryAuthStore(
    (state) => state.isAvailable
  );

  const setAvailable = useDeliveryAuthStore(
    (state) => state.setAvailable
  );

  const logout = useDeliveryAuthStore(
    (state) => state.logout
  );

  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadAvailableDeliveries() {
    try {
      setLoadingDeliveries(true);
      setError("");

      const response = await getAvailableDeliveries();

      const data = response?.data ?? response;

      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load available deliveries:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load available deliveries."
      );
    } finally {
      setLoadingDeliveries(false);
    }
  }

  useEffect(() => {
    if (isAvailable) {
      loadAvailableDeliveries();
    } else {
      setDeliveries([]);
    }
  }, [isAvailable]);

  async function updateRiderLocation() {
  if (!navigator.geolocation) {
    setError("Location is not supported by this browser.");
    return false;
  }

  return new Promise<boolean>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updateMyLocation(
            position.coords.latitude,
            position.coords.longitude
          );

          resolve(true);
        } catch (err: any) {
          console.error("Failed to update rider location:", err);

          setError(
            err?.response?.data?.message ||
              "Failed to update your location."
          );

          resolve(false);
        }
      },
      (error) => {
        console.error("Location error:", error);

        setError(
          "Please allow location access to receive nearby deliveries."
        );

        resolve(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}
  async function handleToggleAvailability() {
  const next = !isAvailable;

  try {
    setError("");

    if (next) {
      const locationUpdated = await updateRiderLocation();

      if (!locationUpdated) {
        return;
      }
    }

    await toggleAvailability(next);
    setAvailable(next);

    if (next) {
      await loadAvailableDeliveries();
    } else {
      setDeliveries([]);
    }
  } catch (err: any) {
    console.error("Failed to update availability:", err);

    setError(
      err?.response?.data?.message ||
        "Failed to update availability."
    );
  }
}

  async function handleAcceptDelivery(orderId: string) {
    try {
      setAcceptingOrderId(orderId);
      setError("");

      await acceptDeliveryOrder(orderId);

      // Remove the accepted order from the available list
      setDeliveries((current) =>
        current.filter((delivery) => delivery.id !== orderId)
      );

      alert("Delivery accepted successfully!");
    } catch (err: any) {
      console.error("Failed to accept delivery:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to accept delivery."
      );
    } finally {
      setAcceptingOrderId(null);
    }
  }

  function handleLogout() {
    logout();
    router.push("/delivery/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Rider Dashboard
            </h1>

            <p className="mt-1 text-gray-500">
              Welcome, {deliveryPerson?.name || "Rider"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>

        {/* Availability */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Availability
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Turn this on when you are ready to receive deliveries.
              </p>
            </div>

            <button
              onClick={handleToggleAvailability}
              className={`rounded-full px-5 py-2 font-medium ${
                isAvailable
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {isAvailable ? "Online" : "Offline"}
            </button>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Available Deliveries */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Available Deliveries
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isAvailable
                  ? "Orders available for you to accept."
                  : "Go online to see available deliveries."}
              </p>
            </div>

            {isAvailable && (
              <button
                onClick={loadAvailableDeliveries}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Refresh
              </button>
            )}
          </div>

          {!isAvailable ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
              You are currently offline.
              <br />
              Turn your availability to <strong>Online</strong> to receive
              deliveries.
            </div>
          ) : loadingDeliveries ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading available deliveries...
            </div>
          ) : deliveries.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
              No available deliveries right now.
            </div>
          ) : (
            <div className="space-y-4">

              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="rounded-xl border border-gray-200 p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {delivery.orderNumber
                          ? `Order #${delivery.orderNumber}`
                          : `Order ${delivery.id.slice(0, 8)}`}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Status: {delivery.status}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        handleAcceptDelivery(delivery.id)
                      }
                      disabled={acceptingOrderId === delivery.id}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {acceptingOrderId === delivery.id
                        ? "Accepting..."
                        : "Accept"}
                    </button>

                  </div>

                  {delivery.restaurant && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">

                      <p className="font-medium text-gray-900">
                        {delivery.restaurant.name || "Restaurant"}
                      </p>

                      {delivery.restaurant.address && (
                        <p className="mt-1 text-sm text-gray-500">
                          📍 {delivery.restaurant.address}
                        </p>
                      )}

                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

        </div>

        {/* Active Delivery */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Active Delivery
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Your accepted delivery and map will appear here.
          </p>

        </div>

      </div>
    </main>
  );
}