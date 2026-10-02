
"use client";

import dynamic from "next/dynamic";

const OrderMap = dynamic(
  () => import("@/components/delivery/order-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
        Loading map...
      </div>
    ),
  }
);

export interface RiderOrder {
  id: string;

  orderNumber?: string;
  status?: string;
  deliveryStatus?: string;

  deliveryFee?: number;

  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;

  restaurant?: {
    id?: string;
    name?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  customer?: {
    name?: string;
    phone?: string | null;
  };

  items?: Array<{
    id?: string;
    quantity: number;
    menuItem?: {
      name?: string;
    };
  }>;
}

interface Props {
  order: RiderOrder;
  rider: {
    latitude: number;
    longitude: number;
  } | null;
  onClose: () => void;
}

export function OrderMapModal({
  order,
  rider,
  onClose,
}: Props) {
  const restaurant = order.restaurant;

  const hasCustomerCoordinates =
    typeof order.deliveryLatitude === "number" &&
    Number.isFinite(order.deliveryLatitude) &&
    typeof order.deliveryLongitude === "number" &&
    Number.isFinite(order.deliveryLongitude);

  const hasRestaurantCoordinates =
    typeof restaurant?.latitude === "number" &&
    Number.isFinite(restaurant.latitude) &&
    typeof restaurant?.longitude === "number" &&
    Number.isFinite(restaurant.longitude);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-4 pb-3 pt-4">
          <div>
            <p className="text-xs text-gray-500">
              #{order.orderNumber ?? order.id}
            </p>

            <h2 className="font-semibold text-gray-900">
              {restaurant?.name ?? "Delivery order"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close map"
            className="rounded-full px-3 py-1 text-xl leading-none text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Map */}
        <div className="h-[55vh] min-h-[320px] bg-gray-100 sm:h-80">
          {hasCustomerCoordinates || hasRestaurantCoordinates ? (
            <OrderMap
              restaurant={
                hasRestaurantCoordinates
                  ? {
                      lat: restaurant!.latitude!,
                      lng: restaurant!.longitude!,
                      name: restaurant?.name,
                    }
                  : null
              }
              customer={
                hasCustomerCoordinates
                  ? {
                      lat: order.deliveryLatitude!,
                      lng: order.deliveryLongitude!,
                      address: order.deliveryAddress,
                    }
                  : null
              }
              rider={
                rider
                  ? {
                      lat: rider.latitude,
                      lng: rider.longitude,
                    }
                  : null
              }
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="font-medium text-gray-700">
                Delivery location is unavailable
              </p>

              <p className="mt-1 text-sm text-gray-500">
                This order does not contain delivery coordinates.
              </p>
            </div>
          )}
        </div>

        {/* Order information */}
        <div className="space-y-2 overflow-y-auto px-4 py-4 text-sm">
          <p className="text-gray-900">
            <span className="text-gray-500">
              Deliver to:{" "}
            </span>
            {order.deliveryAddress ?? "No address given"}
          </p>

          {hasCustomerCoordinates && (
            <p className="text-xs text-gray-500">
              Delivery coordinates:{" "}
              {order.deliveryLatitude!.toFixed(6)},{" "}
              {order.deliveryLongitude!.toFixed(6)}
            </p>
          )}

          {order.customer?.name && (
            <p className="text-gray-900">
              <span className="text-gray-500">
                Customer:{" "}
              </span>

              {order.customer.name}

              {order.customer.phone && (
                <>
                  {" · "}
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="font-medium underline"
                  >
                    {order.customer.phone}
                  </a>
                </>
              )}
            </p>
          )}

          {order.items && order.items.length > 0 && (
            <p className="text-xs text-gray-500">
              {order.items
                .map(
                  (item) =>
                    `${item.quantity}× ${
                      item.menuItem?.name ?? "Item"
                    }`
                )
                .join(", ")}
            </p>
          )}

          {order.deliveryFee != null && (
            <p className="text-gray-900">
              <span className="text-gray-500">
                Your earning:{" "}
              </span>
              Rs. {order.deliveryFee}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
