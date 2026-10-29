// app/(owner-dashboard)/tables/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react";
import { QueryError } from "@/components/ui/query-error";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { tablesApi } from "@/lib/api/tables";
import { TablesList } from "@/components/owner-tables/tables-list";
import { TablesTrashBin } from "@/components/owner-tables/tables-trash-bin";

const TABS = [
  { key: "TABLES", label: "Tables" },
  { key: "TRASH", label: "Trash", icon: Trash2 },
];

export default function TablesPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("TABLES");

  const tablesQuery = useQuery({
    queryKey: ["owner-tables", restaurantId, activeTab === "TRASH"],
    queryFn: () => tablesApi.list(restaurantId as string, activeTab === "TRASH"),
    enabled: !!restaurantId,
  });

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">No restaurant selected.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Tables</h1>
      <p className="text-sm text-neutral-500 mb-6">Manage your restaurant's floor plan and table capacity.</p>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-2 text-sm font-medium px-4 py-2.5 border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-[#E3A008] text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {Icon && <Icon size={16} className={tab.key === "TRASH" ? "text-red-500" : ""} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tablesQuery.isLoading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Loading tables...</p>
      ) : tablesQuery.isError ? (
        <QueryError what="tables" error={tablesQuery.error} onRetry={() => tablesQuery.refetch()} />
      ) : activeTab === "TABLES" ? (
        <TablesList
          tables={tablesQuery.data ?? []}
          restaurantId={restaurantId}
          queryClient={queryClient}
        />
      ) : (
        <TablesTrashBin
          tables={tablesQuery.data ?? []}
          restaurantId={restaurantId}
          queryClient={queryClient}
        />
      )}
    </div>
  );
}