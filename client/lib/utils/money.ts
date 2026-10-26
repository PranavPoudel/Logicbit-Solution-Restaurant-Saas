// lib/utils/money.ts
import { theme } from "@/config/theme";

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string) {
  let formatter = formatters.get(currency);
  if (!formatter) {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    formatter = new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: digits });
    formatters.set(currency, formatter);
  }
  return formatter;
}

export function formatMoney(amount: number, currency?: string | null) {
  const code = currency || theme.content.currencyCode;
  try {
    return formatterFor(code).format(amount);
  } catch {
    return `${code} ${amount}`;
  }
}
