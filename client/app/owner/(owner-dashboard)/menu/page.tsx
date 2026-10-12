// app/(owner-dashboard)/menu/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { categoriesApi, menuItemsApi, modifierGroupsApi } from "@/lib/api/menu";
import { CategoryManager } from "@/components/owner-menu/category-manager";
import { MenuItemManager } from "@/components/owner-menu/menu-item-manager";
import { ModifierGroupManager } from "@/components/owner-menu/modifier-group-manager";
import { MenuTrashBin } from "@/components/owner-menu/menu-trash-bin";
import { SubscriptionUpgradeBanner } from "@/components/ui/subscription-upgrade-banner";

const TABS = [
  { key: "ITEMS", label: "Menu Items" },
  { key: "CATEGORIES", label: "Categories" },
  { key: "MODIFIERS", label: "Modifiers" },
  { key: "TRASH", label: "Trash", icon: Trash2 },
];

export default function MenuPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ITEMS");

  const categoriesQuery = useQuery({
    queryKey: ["owner-categories", restaurantId, activeTab === "TRASH"],
    queryFn: () => categoriesApi.list(restaurantId as string, activeTab === "TRASH"),
    enabled: !!restaurantId,
  });

  const itemsQuery = useQuery({
    queryKey: ["owner-menu-items", restaurantId, activeTab === "TRASH"],
    queryFn: () => menuItemsApi.list(restaurantId as string, undefined, activeTab === "TRASH"),
    enabled: !!restaurantId,
  });

  const modifierGroupsQuery = useQuery({
    queryKey: ["owner-modifier-groups", restaurantId],
    queryFn: () => modifierGroupsApi.list(restaurantId as string),
    enabled: !!restaurantId && activeTab !== "TRASH",
  });

  // --- Modifier Group Mutations ---
  const addGroupMutation = useMutation({
    mutationFn: (input: { name: string; minSelect: number; maxSelect: number; isRequired: boolean }) =>
      modifierGroupsApi.create(restaurantId as string, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["owner-modifier-groups", restaurantId] }),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => modifierGroupsApi.remove(restaurantId as string, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["owner-modifier-groups", restaurantId] }),
  });

  const addOptionMutation = useMutation({
    mutationFn: ({ groupId, input }: { groupId: string; input: { name: string; extraPrice: number; allergenInfo?: string } }) =>
      modifierGroupsApi.addOption(restaurantId as string, groupId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["owner-modifier-groups", restaurantId] }),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: ({ groupId, optionId }: { groupId: string; optionId: string }) =>
      modifierGroupsApi.removeOption(restaurantId as string, groupId, optionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["owner-modifier-groups", restaurantId] }),
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
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Menu Management</h1>
      <p className="text-sm text-neutral-500 mb-6">Manage your categories, menu items, modifiers, and trashed items.</p>
      <SubscriptionUpgradeBanner />

      {/* Top Tabs */}
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

      {/* Tab Content */}
      {activeTab === "CATEGORIES" && (
        <CategoryManager
          categories={categoriesQuery.data ?? []}
          restaurantId={restaurantId}
          isLoading={categoriesQuery.isLoading}
        />
      )}

      {activeTab === "ITEMS" && (
        <MenuItemManager
          items={itemsQuery.data ?? []}
          categories={categoriesQuery.data ?? []}
          restaurantId={restaurantId}
          isLoading={itemsQuery.isLoading || categoriesQuery.isLoading}
        />
      )}

      {activeTab === "MODIFIERS" && (
        modifierGroupsQuery.isLoading ? (
          <p className="text-sm text-neutral-400 py-8 text-center">Loading modifier groups…</p>
        ) : (
          <ModifierGroupManager
            groups={modifierGroupsQuery.data ?? []}
            onAddGroup={(input) => addGroupMutation.mutate(input)}
            onDeleteGroup={(id) => deleteGroupMutation.mutate(id)}
            onAddOption={(groupId, input) => addOptionMutation.mutate({ groupId, input })}
            onDeleteOption={(groupId, optionId) =>
              deleteOptionMutation.mutate({ groupId, optionId })
            }
            isMutating={
              addGroupMutation.isPending ||
              deleteGroupMutation.isPending ||
              addOptionMutation.isPending ||
              deleteOptionMutation.isPending
            }
          />
        )
      )}

      {activeTab === "TRASH" && (
        <MenuTrashBin
          categories={categoriesQuery.data ?? []}
          items={itemsQuery.data ?? []}
          restaurantId={restaurantId}
          isLoading={categoriesQuery.isLoading || itemsQuery.isLoading}
        />
      )}
    </div>
  );
}