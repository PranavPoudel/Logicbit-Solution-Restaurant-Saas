export type RefundMethod = "CASH" | "BANK_TRANSFER" | "PAYPAY" | "CARD" | "OTHER";

export const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "PAYPAY", label: "PayPay" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

/** The refund method that sends money back through the gateway the customer paid with, or null for cash orders */
export function gatewayRefundMethod(paymentMethod?: string | null): "PAYPAY" | "CARD" | null {
  if (paymentMethod === "PAYPAY") return "PAYPAY";
  if (paymentMethod === "CREDIT_CARD") return "CARD";
  return null;
}

export const GATEWAY_NAME = { PAYPAY: "PayPay", CARD: "Stripe" } as const;

/** "Bank transfer, ref 123" — how a refund was paid back, or an empty string for older refunds */
export function describeRefundPayback(method?: string | null, reference?: string | null) {
  const label = REFUND_METHODS.find((m) => m.value === method)?.label;
  if (!label) return "";
  return reference ? `${label}, ref ${reference}` : label;
}
