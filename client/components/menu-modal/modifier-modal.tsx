//components/menu-modal/modifier-modal.tsx
"use client";

import { useMemo, useState } from "react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { X, Minus, Plus, AlertTriangle, ClipboardList, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMenuItemDetail } from "@/lib/api/discovery";
import { useCartStore, type SelectedModifier } from "@/store/cart-store";
import { AppImage } from "@/components/ui/app-image";
import { getItemImage } from "@/lib/utils/image";
import { isSingleModifier } from "@/lib/utils/modifiers";

const SPICE_LEVELS: Record<string, { label: string; level: number }> = {
  NONE: { label: "Not spicy", level: 0 },
  MILD: { label: "Mild", level: 1 },
  MEDIUM: { label: "Medium", level: 2 },
  HOT: { label: "Hot", level: 3 },
  VERY_HOT: { label: "Very hot", level: 4 },
};

interface OptionRowProps {
  option: { name?: string; extraPrice?: number; allergenInfo?: string };
  checked: boolean;
  type: "radio" | "checkbox";
  name: string;
  onChange: () => void;
}

function OptionRow({ option, checked, type, name, onChange }: OptionRowProps) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#E3A008] ${
        checked ? "border-[#E3A008] bg-[#E3A008]/5" : "border-[#E8E7E2] hover:bg-neutral-50"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <input type={type} name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-[#17181C]" />
        <span className="flex flex-col">
          <span className="text-sm text-[#17181C]">{option.name}</span>
          {option.allergenInfo && <span className="text-[11px] text-red-600">Allergen: {option.allergenInfo}</span>}
        </span>
      </span>
      {!!option.extraPrice && <span className="font-mono text-xs text-neutral-500">+Rs {option.extraPrice}</span>}
    </label>
  );
}

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

      if (isSingleModifier(group) && current.includes(optionId)) {
        return { ...prev, [groupId]: [] };
      }

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
          allergenInfo: option.allergenInfo,
          priceDelta: option.extraPrice ?? 0,
        });
        extra += option.extraPrice ?? 0;
      }
    }
    return { selectedModifiers: mods, extraTotal: extra };
  }, [selections, groups]);

  const basePrice = item?.price ?? 0;
  const ingredientList = (item?.ingredients ?? "").split(",").map((i) => i.trim()).filter(Boolean);
  const tags = [item?.isVegan ? "Vegan" : item?.isVegetarian ? "Vegetarian" : null].filter(Boolean);
  const spice = item?.spiceLevel ? SPICE_LEVELS[item.spiceLevel] : undefined;
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
      allergenInfo: [...new Set([item.allergenInfo, ...selectedModifiers.map((m) => m.allergenInfo)].filter(Boolean))].join("; ") || undefined,
      variantKey,
    });
    onClose();
  }

  useEscapeKey(onClose);
  const panelRef = useDialogFocus<HTMLDivElement>();
  const photo = item ? getItemImage(item) : undefined;
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white shadow-xl md:overflow-hidden transition duration-200 starting:translate-y-6 starting:opacity-0 motion-reduce:transition-none sm:max-w-md sm:rounded-2xl md:grid md:h-[min(85vh,640px)] md:max-h-none md:max-w-4xl md:grid-cols-[5fr_6fr]"
      >
        <div className="sticky top-0 z-20 h-0 md:absolute md:right-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className={`absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-sm hover:bg-white ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-40 shrink-0 overflow-hidden bg-[#2B1410]/5 md:h-full">
          {photo ? (
            <AppImage
              sizes="(min-width:768px) 440px, 100vw"
              src={photo}
              alt={item?.name ?? "Menu item"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-6xl text-[#2B1410]/20">
              {(item?.name ?? "").charAt(0)}
            </div>
          )}
          {tags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium capitalize text-[#17181C] shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:h-full md:min-h-0 md:flex-1">
          <div className="px-5 pb-3 pr-16 pt-5">
            <h2 id="dish-modal-title" className="font-display text-xl font-semibold text-[#17181C]">
              {isLoading ? "Loading…" : item?.name ?? "Item"}
            </h2>
            {item && <p className="mt-1 font-mono text-base font-semibold text-[#17181C]">Rs {basePrice}</p>}
          </div>

          <div className="space-y-5 px-5 pb-5 md:min-h-0 md:flex-1 md:overflow-y-auto">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-neutral-400">Loading options…</p>
            ) : (
              <>
                {item?.description && <p className="text-sm leading-relaxed text-neutral-600">{item.description}</p>}
                {spice && (
                  <section aria-label="Spice level" className="flex items-center justify-between rounded-xl border border-[#E8E7E2] bg-neutral-50 p-3.5">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                      <Flame size={14} aria-hidden="true" /> Spice level
                    </h3>
                    <span className="flex items-center gap-2 text-sm font-medium text-[#17181C]">
                      <span className="flex gap-0.5" aria-hidden="true">
                        {[1, 2, 3, 4].map((n) => (
                          <Flame key={n} size={16} className={n <= spice.level ? "fill-red-500 text-red-500" : "text-neutral-300"} />
                        ))}
                      </span>
                      {spice.label}
                    </span>
                  </section>
                )}
                {ingredientList.length > 0 && (
                  <section aria-label="Ingredients" className="rounded-xl border border-[#E8E7E2] bg-neutral-50 p-3.5">
                    <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                      <ClipboardList size={14} aria-hidden="true" /> Ingredients
                    </h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {ingredientList.map((ingredient, i) => (
                        <li key={`${ingredient}-${i}`} className="rounded-full border border-[#E8E7E2] bg-white px-3 py-1 text-xs font-medium capitalize text-[#17181C] shadow-sm">
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {item?.allergenInfo ? (
                  <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                    <AlertTriangle className="shrink-0 text-red-600" size={18} />
                    <div>
                      <p className="text-xs font-semibold uppercase text-red-800">Allergen Info</p>
                      <p className="mt-0.5 text-sm text-red-700">{item.allergenInfo}</p>
                    </div>
                  </div>
                ) : (
                  item && (
                    <p className="rounded-xl border border-[#E8E7E2] bg-neutral-50 p-3 text-xs text-neutral-500">
                      No allergen information provided. Ask the restaurant if you have allergies.
                    </p>
                  )
                )}

                {groups.length === 0 ? (
                  <p className="py-2 text-center text-sm text-neutral-400">No customization options for this item.</p>
                ) : (
                  groups.map((group) => {
                    const isSingle = (group.maxSelect ?? 1) <= 1;
                    if (isSingleModifier(group)) {
                      const option = group.options[0];
                      return (
                        <OptionRow
                          key={group.id}
                          option={option}
                          checked={(selections[group.id] ?? []).includes(option.id)}
                          type="checkbox"
                          name={group.id}
                          onChange={() => toggleOption(group.id, option.id, group)}
                        />
                      );
                    }
                    return (
                      <div key={group.id}>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#17181C]">
                            {group.name}
                            <span className={`ml-2 text-[11px] font-medium ${group.isRequired ? "text-red-500" : "text-neutral-400"}`}>
                              {group.isRequired ? "Required" : "Optional"}
                            </span>
                          </p>
                          <span className="text-[11px] text-neutral-400">
                            {isSingle ? "Choose 1" : `Choose up to ${group.maxSelect ?? 1}`}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {(group.options ?? []).map((option) => (
                            <OptionRow
                              key={option.id}
                              option={option}
                              checked={(selections[group.id] ?? []).includes(option.id)}
                              type={isSingle ? "radio" : "checkbox"}
                              name={group.id}
                              onChange={() => toggleOption(group.id, option.id, group)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}

                <div>
                  <label htmlFor="dish-notes" className="mb-2 block text-sm font-semibold text-[#17181C]">
                    Special Instructions <span className="font-normal text-neutral-400">(Optional)</span>
                  </label>
                  <textarea
                    id="dish-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., No onions, extra spicy, severe peanut allergy..."
                    maxLength={150}
                    className="w-full resize-none rounded-xl border border-[#E8E7E2] p-3 text-sm outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/20"
                    rows={3}
                  />
                  <p className="mt-1 text-right text-[11px] text-neutral-400">{notes.length}/150 characters</p>
                </div>
              </>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-[#E8E7E2] bg-white p-4 shadow-[0_-6px_16px_-12px_rgba(0,0,0,0.25)] md:static">
            <div className="flex items-center rounded-full border border-[#E8E7E2]">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className={`flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-50 ${focusRing}`}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-mono text-sm" aria-live="polite">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className={`flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-50 ${focusRing}`}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={isLoading || missingRequired}
              className={`h-11 flex-1 rounded-2xl bg-[#17181C] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2B2D33] disabled:opacity-50 ${focusRing} focus-visible:ring-offset-2`}
            >
              {missingRequired ? "Select required options" : `Add ${quantity} to cart — Rs ${unitPrice * quantity}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
