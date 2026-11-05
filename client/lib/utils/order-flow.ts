const NEW_WARN_MINUTES = 5;
const NEW_LATE_MINUTES = 10;

interface FlowStep {
  status: string;
  label: string;
}

export function flowFor(orderType?: string): FlowStep[] {
  const end = { status: "DELIVERED", label: orderType === "PICKUP" ? "Collected" : orderType === "DINE_IN" ? "Served" : "Delivered" };
  const steps = [
    { status: "PENDING", label: "New" },
    { status: "ACCEPTED", label: "Accepted" },
    { status: "PREPARING", label: "Preparing" },
    { status: "READY", label: "Ready" },
  ];
  if (orderType !== "PICKUP" && orderType !== "DINE_IN") steps.push({ status: "OUT_FOR_DELIVERY", label: "On the way" });
  return [...steps, end];
}

export function stepIndex(status: string, orderType?: string) {
  const flow = flowFor(orderType);
  const normalized = status === "DELIVERED" || status === "COMPLETED" ? flow[flow.length - 1].status : status;
  return flow.findIndex((s) => s.status === normalized);
}

export function nextStep(status: string, orderType?: string): { label: string; next: string } | undefined {
  switch (status) {
    case "PENDING":
      return { label: "Accept order", next: "ACCEPTED" };
    case "ACCEPTED":
      return { label: "Start preparing", next: "PREPARING" };
    case "PREPARING":
      return { label: "Mark ready", next: "READY" };
    case "READY":
      if (orderType === "PICKUP") return { label: "Mark collected", next: "DELIVERED" };
      if (orderType === "DINE_IN") return { label: "Mark served", next: "DELIVERED" };
      return { label: "Send out for delivery", next: "OUT_FOR_DELIVERY" };
    case "OUT_FOR_DELIVERY":
      return { label: "Mark delivered", next: "DELIVERED" };
  }
}

export function stageLabel(status: string, orderType?: string) {
  if (status === "CANCELLED") return "Cancelled";
  return flowFor(orderType)[stepIndex(status, orderType)]?.label ?? status;
}

/** ORD-1793075497224-7853 -> 7853; the full number stays in tooltips and on the detail page. */
export function shortNumber(order: { id: string; orderNumber?: string }) {
  return order.orderNumber ? order.orderNumber.split("-").pop() : order.id.slice(0, 6).toUpperCase();
}

export function minutesSince(iso: string | undefined, now: number) {
  return iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000)) : 0;
}

export function ageLabel(minutes: number) {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return `${Math.floor(minutes / 1440)} d`;
}

export function urgency(status: string, minutes: number): "late" | "warn" | "ok" {
  if (status !== "PENDING") return "ok";
  return minutes >= NEW_LATE_MINUTES ? "late" : minutes >= NEW_WARN_MINUTES ? "warn" : "ok";
}
