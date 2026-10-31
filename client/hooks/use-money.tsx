// hooks/use-money.tsx
"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { theme } from "@/config/theme";
import { formatMoney } from "@/lib/utils/money";

const CurrencyContext = createContext<string | null>(null);

export function CurrencyProvider({ code, children }: { code?: string | null; children: ReactNode }) {
  return <CurrencyContext.Provider value={code ?? null}>{children}</CurrencyContext.Provider>;
}

export function useMoney(code?: string | null) {
  const inherited = useContext(CurrencyContext);
  const currency = code ?? inherited;
  return useCallback((amount: number) => formatMoney(amount, currency), [currency]);
}

export function useCurrencyCode(code?: string | null) {
  const inherited = useContext(CurrencyContext);
  return code ?? inherited ?? theme.content.currencyCode;
}
