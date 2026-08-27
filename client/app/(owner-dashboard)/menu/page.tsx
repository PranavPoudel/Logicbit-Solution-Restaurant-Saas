// app/(owner-dashboard)/menu/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { categoriesApi, menuItemsApi, modifierGroupsApi } from "@/lib/api/menu";
import { CategoryList, type OwnerCategory } from "@/components/owner-menu/category-list";
import {
  MenuItemTable,
  type OwnerMenuItem,
  type MenuItemFormValues,
} from "@/components/owner-menu/menu-item-table";
import {
  ModifierGroupManager,
  type OwnerModifierGroup,
} from "@/components/owner-menu/modifier-group-manager";
import { ItemModifierLinkModal } from "@/components/owner-menu/item-modifier-link-modal";
import { SubscriptionUpgradeBanner } from "@/components/ui/subscription-upgrade-banner";

export default function MenuPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [linkModalItem, setLinkModalItem] = useState<OwnerMenuItem | null>(null);
  const [linkedGroupIds, setLinkedGroupIds] = useState<Set<string>>(new Set());

  const categoriesQuery = useQuery({
    queryKey: ["owner-categories", restaurantId],
    queryFn: () => categoriesApi.list(restaurantId as string) as Promise<OwnerCategory[]>,
    enabled: !!restaurantId,
  });

  const categories = categoriesQuery.data ?? [];
  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;
  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  const itemsQuery = useQuery({
    queryKey: ["owner-menu-items", restaurantId, activeCategoryId],
    queryFn: () => menuItemsApi.list(restaurantId as string, activeCategoryId as string) as Promise<OwnerMenuItem[]>,
    enabled: !!restaurantId && !!activeCategoryId,
  });

  const modifierGroupsQuery = useQuery({
    queryKey: ["owner-modifier-groups", restaurantId],
    queryFn: () => modifierGroupsApi.list(restaurantId as string) as Promise<OwnerModifierGroup[]>,
    enabled: !!restaurantId,
  });

  // --- Category mutations ---
  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => categoriesApi.create(restaurantId as string, { name }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] }),
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(restaurantId as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] });
      setSelectedCategoryId(null);
    },
  });

  // --- Item mutations ---
  const addItemMutation = useMutation({
    mutationFn: (input: MenuItemFormValues) =>
      menuItemsApi.create(restaurantId as string, {
        ...input,
        categoryId: input.categoryId ?? (activeCategoryId as string),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["owner-menu-items", restaurantId, activeCategoryId],
      }),
  });
  const updateItemMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MenuItemFormValues }) =>
      menuItemsApi.update(restaurantId as string, id, input),
    onSuccess: () => {
      // invalidate every category's item list — the item may have moved
      // categories and we don't track the "before" categoryId here
      queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] });
    },
  });
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => menuItemsApi.remove(restaurantId as string, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["owner-menu-items", restaurantId, activeCategoryId],
      }),
  });

  // --- Modifier group mutations ---
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
    mutationFn: ({ groupId, input }: { groupId: string; input: { name: string; extraPrice: number } }) =>
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

  // --- Link/unlink modifier group to a menu item ---
  async function openModifierLinkModal(item: OwnerMenuItem) {
    setLinkModalItem(item);
    try {
      // TODO: confirm GET .../menu-items/:id includes linked modifierGroups
      // in its response — if not, this starts empty and the owner re-links
      // fresh (safe, just not pre-filled).
      const detail = (await menuItemsApi.get(restaurantId as string, item.id)) as {
        modifierGroups?: Array<{ id: string }>;
      };
      setLinkedGroupIds(new Set((detail.modifierGroups ?? []).map((g) => g.id)));
    } catch {
      setLinkedGroupIds(new Set());
    }
  }

  function toggleGroupLink(groupId: string, linked: boolean) {
    if (!linkModalItem || !restaurantId) return;
    setLinkedGroupIds((prev) => {
      const next = new Set(prev);
      if (linked) next.add(groupId);
      else next.delete(groupId);
      return next;
    });
    if (linked) {
      modifierGroupsApi.linkToMenuItem(restaurantId, groupId, linkModalItem.id);
    } else {
      modifierGroupsApi.unlinkFromMenuItem(restaurantId, groupId, linkModalItem.id);
    }
  }

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

  return (
    <div className="max-w-6xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Menu</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Manage your categories, menu items, and modifiers.
      </p>
         <SubscriptionUpgradeBanner />

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-start mb-6">
        {categoriesQuery.isLoading ? (
          <p className="text-sm text-neutral-400">Loading categories…</p>
        ) : (
          <CategoryList
            categories={categories}
            activeId={activeCategoryId}
            onSelect={setSelectedCategoryId}
            onAdd={(name) => addCategoryMutation.mutate(name)}
            onDelete={(id) => deleteCategoryMutation.mutate(id)}
            isAdding={addCategoryMutation.isPending}
          />
        )}

        {categories.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center text-sm text-neutral-400">
            Add a category to start building your menu.
          </div>
        ) : itemsQuery.isLoading ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center text-sm text-neutral-400">
            Loading items…
          </div>
        ) : (
          <MenuItemTable
            restaurantId={restaurantId}
            items={itemsQuery.data ?? []}
            categories={categories}
            activeCategoryId={activeCategoryId as string}
            categoryName={activeCategory?.name}
            onAdd={(input) => addItemMutation.mutate(input)}
            onUpdate={(id, input) => updateItemMutation.mutate({ id, input })}
            onDelete={(id) => deleteItemMutation.mutate(id)}
            onManageModifiers={openModifierLinkModal}
            isAdding={addItemMutation.isPending}
            isUpdating={updateItemMutation.isPending}
          />
        )}
      </div>

      {modifierGroupsQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading modifier groups…</p>
      ) : (
        <ModifierGroupManager
          groups={modifierGroupsQuery.data ?? []}
          onAddGroup={(input) => addGroupMutation.mutate(input)}
          onDeleteGroup={(id) => deleteGroupMutation.mutate(id)}
          onAddOption={(groupId, input) => addOptionMutation.mutate({ groupId, input })}
          onDeleteOption={(groupId, optionId) =>
            deleteOptionMutation.mutate({ groupId, optionId })
          }
          isMutating={addGroupMutation.isPending}
        />
      )}

      {linkModalItem && (
        <ItemModifierLinkModal
          itemName={linkModalItem.name ?? "Item"}
          allGroups={modifierGroupsQuery.data ?? []}
          linkedGroupIds={linkedGroupIds}
          onToggle={toggleGroupLink}
          onClose={() => setLinkModalItem(null)}
        />
      )}
    </div>
  );
}
