"use client";

import dynamic from "next/dynamic";

const OrderMap = dynamic(() => import("@/components/delivery/order-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
      Loading map…
    </div>
  ),
});

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
    name?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  customer?: { name?: string; phone?: string | null };
  items?: Array<{ id?: string; quantity: number; menuItem?: { name?: string } }>;
}

interface Props {
  order: RiderOrder;
  rider: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

export function OrderMapModal({ order, rider, onClose }: Props) {
  const r = order.restaurant;
  const hasRestaurant = r?.latitude != null && r?.longitude != null;
  const hasCustomer = order.deliveryLatitude != null && order.deliveryLongitude != null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between px-4 pb-3 pt-4">
          <div>
            <p className="text-xs text-gray-500">#{order.orderNumber ?? order.id}</p>
            <h2 className="font-semibold text-gray-900">{r?.name ?? "Order"}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2.5 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="h-72 bg-gray-100 sm:h-80">
          {hasRestaurant || hasCustomer ? (
            <OrderMap
              restaurant={
                hasRestaurant
                  ? { lat: r!.latitude!, lng: r!.longitude!, name: r?.name }
                  : null
              }
              customer={
                hasCustomer
                  ? {
                      lat: order.deliveryLatitude!,
                      lng: order.deliveryLongitude!,
                      address: order.deliveryAddress,
                    }
                  : null
              }
              rider={rider ? { lat: rider.latitude, lng: rider.longitude } : null}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
              This order has no saved coordinates, so it can&apos;t be shown on the map.
            </div>
          )}
        </div>

        <div className="space-y-2 overflow-y-auto px-4 py-3 text-sm">
          <p className="text-gray-900">
            <span className="text-gray-500">Deliver to: </span>
            {order.deliveryAddress ?? "No address given"}
          </p>
          {order.customer?.name && (
            <p className="text-gray-900">
              <span className="text-gray-500">Customer: </span>
              {order.customer.name}
              {order.customer.phone && (
                <>
                  {" · "}
                  <a href={`tel:${order.customer.phone}`} className="font-medium underline">
                    {order.customer.phone}
                  </a>
                </>
              )}
            </p>
          )}
          {order.items && order.items.length > 0 && (
            <p className="text-xs text-gray-500">
              {order.items.map((i) => `${i.quantity}× ${i.menuItem?.name ?? "Item"}`).join(", ")}
            </p>
          )}
          {order.deliveryFee != null && (
            <p className="text-gray-900">
              <span className="text-gray-500">Your earning: </span>Rs. {order.deliveryFee}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}