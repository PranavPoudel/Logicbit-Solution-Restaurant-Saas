const LABEL: Record<string, string> = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank transfer',
  PAYPAY: 'PayPay',
  OTHER: 'another method',
};

/** "by bank transfer (ref 123)" — how a refund was paid back, for emails and notes */
export function describeRefundPayback(method?: string | null, reference?: string | null) {
  if (!method) return '';
  return ` by ${LABEL[method] ?? method.toLowerCase()}${reference ? ` (ref ${reference})` : ''}`;
}
