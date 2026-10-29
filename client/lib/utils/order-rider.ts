import type { OwnerOrderSummary } from "@/types/order";

export function riderOf(order: OwnerOrderSummary) {
  const delivery = order.delivery;
  if (delivery?.deliveryPerson?.name) return delivery.deliveryPerson;
  if (delivery?.driverName) return { name: delivery.driverName, phone: delivery.driverPhone ?? undefined, vehicleType: delivery.driverVehicle };
  return undefined;
}
