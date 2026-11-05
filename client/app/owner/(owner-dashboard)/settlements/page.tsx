// app/(owner-dashboard)/settlements/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Wallet } from "lucide-react";
import { QueryError } from "@/components/ui/query-error";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { theme } from "@/config/theme";
import { useMoney } from "@/hooks/use-money";
import { listRestaurantSettlements, getOutstandingSettlement } from "@/lib/api/settlements";

interface SettlementRow {
  id: string;
  periodStart?: string;
  periodEnd?: string;
  totalCodAmount?: number;
  commissionDue?: number;
  status?: string;
}

export default function SettlementsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const money = useMoney();

  const outstandingQuery = useQuery({
    queryKey: ["settlement-outstanding", restaurantId],
    queryFn: () => getOutstandingSettlement(restaurantId as string),
    enabled: !!restaurantId,
  });

  const historyQuery = useQuery({
    queryKey: ["settlements", restaurantId],
    queryFn: () => listRestaurantSettlements(restaurantId as string) as Promise<SettlementRow[]>,
    enabled: !!restaurantId,
  });

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  const outstanding = outstandingQuery.data as
    | { commissionDue?: number; totalCodAmount?: number }
    | undefined;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Settlements</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Commission owed to {theme.brand.name} from cash-on-delivery orders.
      </p>

      <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#E3A008]/10 flex items-center justify-center shrink-0">
          <Wallet size={18} className="text-[#E3A008]" />
        </div>
        <div>
          <p className="text-xs text-neutral-500">Outstanding commission</p>
          <p className="text-xl font-semibold text-neutral-900 font-mono">
            {outstandingQuery.isLoading ? "…" : money(outstanding?.commissionDue ?? 0)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-800">History</h3>
        </div>
        {historyQuery.isLoading ? (
          <p className="text-sm text-neutral-400 text-center py-8">Loading…</p>
        ) : historyQuery.isError ? (
          <QueryError what="settlement history" error={historyQuery.error} onRetry={() => historyQuery.refetch()} />
        ) : (historyQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">
            No settlement history yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                <th className="px-5 py-2.5 font-medium">Period</th>
                <th className="px-5 py-2.5 font-medium">COD collected</th>
                <th className="px-5 py-2.5 font-medium">Commission due</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(historyQuery.data ?? []).map((s) => (
                <tr key={s.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-3 text-neutral-700">
                    {s.periodStart ? new Date(s.periodStart).toLocaleDateString() : "—"} –{" "}
                    {s.periodEnd ? new Date(s.periodEnd).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-neutral-700">
                    {money(s.totalCodAmount ?? 0)}
                  </td>
                  <td className="px-5 py-3 font-mono text-neutral-700">
                    {money(s.commissionDue ?? 0)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        s.status === "PAID"
                          ? "bg-[#0F6B5C]/10 text-[#0F6B5C]"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {s.status ?? "PENDING"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
