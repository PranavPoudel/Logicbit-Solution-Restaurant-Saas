//components/menu-modal/modifier-modal.tsx
"use client";

import { useMemo, useState } from "react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { X, Minus, Plus, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMenuItemDetail } from "@/lib/api/discovery";
import { useCartStore, type SelectedModifier } from "@/store/cart-store";

interface ModifierModalProps {
  restaurantId: string;
  menuItemId: string;
  onClose: () => void;
}

export function ModifierModal({ restaurantId, menuItemId, onClose }: ModifierModalProps) {
  const { data: item, isLoading } = useQuery({
    queryKey: ["menu-item-detail", restaurantId, menuItemId],
    queryFn: () => getMenuItemDetail(restaurantId, menuItemId),
  });

  const addItem = useCartStore((s) => s.addItem);

  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState(""); // 🆕 ADDED: Per-item notes state

  const groups = useMemo(() => item?.modifierGroups ?? [], [item]);

  function toggleOption(groupId: string, optionId: string, group: (typeof groups)[number]) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      const maxSelect = group.maxSelect ?? 1;

      if (maxSelect <= 1) {
        return { ...prev, [groupId]: [optionId] };
      }

      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  const { selectedModifiers, extraTotal } = useMemo(() => {
    const mods: SelectedModifier[] = [];
    let extra = 0;
    for (const group of groups) {
      const selectedIds = selections[group.id] ?? [];
      for (const optionId of selectedIds) {
        const option = group.options?.find((o) => o.id === optionId);
        if (!option) continue;
        mods.push({
          modifierGroupId: group.id,
          modifierOptionId: option.id,
          groupName: group.name ?? "",
          optionName: option.name ?? "",
          priceDelta: option.extraPrice ?? 0,
        });
        extra += option.extraPrice ?? 0;
      }
    }
    return { selectedModifiers: mods, extraTotal: extra };
  }, [selections, groups]);

  const basePrice = item?.price ?? 0;
  const unitPrice = basePrice + extraTotal;

  const missingRequired = groups.some(
    (g) => g.isRequired && (selections[g.id] ?? []).length === 0
  );

  function handleAdd() {
    if (!item) return;
    
    // 🆕 ADDED: Include notes in variantKey so "Burger" and "Burger (no onions)" are separate cart lines
    const notesKey = notes.trim() ? `notes:${notes.trim().toLowerCase()}` : "";
    const modifiersKey = selectedModifiers.map((m) => m.optionName).sort().join("|");
    const variantKey = [modifiersKey, notesKey].filter(Boolean).join("::");

    addItem({
      id: `${menuItemId}-${Date.now()}`,
      menuItemId,
      restaurantId,
      name: item.name ?? "Item",
      price: unitPrice,
      quantity,
      selectedModifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
      notes: notes.trim() || undefined, // 🆕 ADDED
      variantKey,
    });
    onClose();
  }

  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#E8E7E2]">
          <h2 className="font-display font-semibold text-[#17181C]">
            {isLoading ? "Loading…" : item?.name ?? "Item"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-5 flex-1">
          {isLoading ? (
            <p className="text-sm text-neutral-400 text-center py-8">Loading options…</p>
          ) : (
            <>
              {/* 🆕 ADDED: Allergen Warning Banner */}
              {item?.allergenInfo && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                  <AlertTriangle className="shrink-0 text-red-600" size={18} />
                  <div>
                    <p className="text-xs font-semibold text-red-800 uppercase">Allergen Info</p>
                    <p className="text-sm text-red-700 mt-0.5">{item.allergenInfo}</p>
                  </div>
                </div>
              )}

              {groups.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">
                  No customization options for this item.
                </p>
              ) : (
                groups.map((group) => {
                  const isSingle = (group.maxSelect ?? 1) <= 1;
                  return (
                    <div key={group.id}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[#17181C]">
                          {group.name}
                          {group.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <span className="text-[11px] text-neutral-400">
                          {isSingle ? "Choose 1" : `Choose up to ${group.maxSelect ?? 1}`}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {(group.options ?? []).map((option) => {
                          const checked = (selections[group.id] ?? []).includes(option.id);
                          return (
                            <label
                              key={option.id}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                                checked ? "border-[#E3A008] bg-[#E3A008]/5" : "border-[#E8E7E2] hover:bg-neutral-50"
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <input
                                  type={isSingle ? "radio" : "checkbox"}
                                  name={group.id}
                                  checked={checked}
                                  onChange={() => toggleOption(group.id, option.id, group)}
                                  className="accent-[#E3A008]"
                                />
                                <span className="text-sm text-[#17181C]">{option.name}</span>
                              </span>
                              {!!option.extraPrice && (
                                <span className="text-xs font-mono text-neutral-500">
                                  +Rs {option.extraPrice}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* 🆕 ADDED: Special Instructions Textarea */}
              <div>
                <p className="text-sm font-medium text-[#17181C] mb-2">
                  Special Instructions <span className="text-neutral-400 font-normal">(Optional)</span>
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., No onions, extra spicy, severe peanut allergy..."
                  maxLength={150}
                  className="w-full rounded-xl border border-[#E8E7E2] p-3 text-sm outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/20 resize-none"
                  rows={3}
                />
                <p className="text-[11px] text-neutral-400 text-right mt-1">
                  {notes.length}/150 characters
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-[#E8E7E2] space-y-3 bg-white sm:rounded-b-2xl">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-[#E8E7E2] flex items-center justify-center hover:bg-neutral-50"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-mono w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-full border border-[#E8E7E2] flex items-center justify-center hover:bg-neutral-50"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={isLoading || missingRequired}
            className="w-full bg-[#17181C] text-white text-sm font-medium py-3 rounded-2xl disabled:opacity-50 hover:bg-[#2B2D33] transition-colors"
          >
            {`Add ${quantity} to cart — Rs ${unitPrice * quantity}`}
          </button>
        </div>
      </div>
    </div>
  );
}