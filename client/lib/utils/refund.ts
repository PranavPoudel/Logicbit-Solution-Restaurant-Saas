export type RefundMethod = "CASH" | "BANK_TRANSFER" | "PAYPAY" | "OTHER";

export const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "PAYPAY", label: "PayPay" },
  { value: "OTHER", label: "Other" },
];

/** "Bank transfer, ref 123" — how a refund was paid back, or an empty string for older refunds */
export function describeRefundPayback(method?: string | null, reference?: string | null) {
  const label = REFUND_METHODS.find((m) => m.value === method)?.label;
  if (!label) return "";
  return reference ? `${label}, ref ${reference}` : label;
}
