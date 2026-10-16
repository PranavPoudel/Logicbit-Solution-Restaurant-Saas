//components/menu-modal/modifier-modal.tsx
"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { getMenuItemDetail } from "@/lib/api/discovery";
import { useCartStore, type SelectedModifier } from "@/store/cart-store";
import { getFullImageUrl, getItemImage } from "@/lib/utils/image";
import { SpiceBadge } from "@/components/menu/dish-tags";
import { isSingleModifier } from "@/lib/utils/modifiers";
import { money } from "@/lib/utils/money";
import { AllergenAlert, Badge, Button, Choice, Icon, IconButton, Stepper, inputCls } from "@/components/ui/primitives";

const MD = "(min-width: 768px)";
const subscribeMd = (cb: () => void) => {
  const mq = window.matchMedia(MD);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsDesktop = () => useSyncExternalStore(subscribeMd, () => window.matchMedia(MD).matches, () => false);

/* Sizing lives in inline styles so the popup layout never depends on generated CSS classes. */
const OVERLAY: CSSProperties = { position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "center", alignItems: "flex-end" };
const OVERLAY_DESKTOP: CSSProperties = { ...OVERLAY, alignItems: "center", padding: 32 };
/* overflow: clip (not hidden) so focusing a checkbox can never scroll the popup frame itself */
const PANEL: CSSProperties = { position: "relative", display: "flex", flexDirection: "column", width: "100%", overflow: "clip" };
const PANEL_DESKTOP: CSSProperties = { ...PANEL, height: "min(88vh, 720px)", maxWidth: 960 };
const PANEL_MOBILE: CSSProperties = { ...PANEL, maxHeight: "92vh" };
const IMAGE_BOX: CSSProperties = { position: "relative", flexShrink: 0, height: 224 };
const IMAGE_BOX_DESKTOP: CSSProperties = { position: "absolute", top: 0, bottom: 0, left: 0, width: "44%", height: "auto" };
const imageFill = (url: string): CSSProperties => ({ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundImage: `url("${url}")`, backgroundSize: "cover", backgroundPosition: "center" });
const CONTENT_COL: CSSProperties = { position: "relative", display: "flex", flexDirection: "column", flex: "1 1 0%", minHeight: 0 };
const CONTENT_COL_DESKTOP: CSSProperties = { ...CONTENT_COL, position: "absolute", top: 0, bottom: 0, left: "44%", right: 0 };
const SCROLL_AREA: CSSProperties = { flex: "1 1 0%", minHeight: 0, overflowY: "auto" };
const FOOTER: CSSProperties = { flexShrink: 0 };

interface ModifierModalProps {
  restaurantId: string;
  menuItemId: string;
  onClose: () => void;
}

export function ModifierModal({ restaurantId, menuItemId, onClose }: ModifierModalProps) {
  const t = useTranslations("dish");
  const tc = useTranslations("common");
  const { data: item, isLoading, isError, refetch } = useQuery({
    queryKey: ["menu-item-detail", restaurantId, menuItemId],
    queryFn: () => getMenuItemDetail(restaurantId, menuItemId),
  });

  const addItem = useCartStore((s) => s.addItem);

  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);

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
    const unitPrice = basePrice + extraTotal;
  const missingGroup = groups.find((g) => g.isRequired && (selections[g.id] ?? []).length === 0);
  const photo = item ? getItemImage(item) : undefined;

  function handleAdd() {
    if (!item) return;
    if (missingGroup) {
      setTried(true);
      document.getElementById(`group-${missingGroup.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

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
      image: photo ? getFullImageUrl(photo) : undefined,
      selectedModifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
      notes: notes.trim() || undefined,
      allergenInfo: [...new Set([item.allergenInfo, ...selectedModifiers.map((m) => m.allergenInfo)].filter(Boolean))].join("; ") || undefined,
      variantKey,
    });
    onClose();
  }

  useEscapeKey(onClose);
  const panelRef = useDialogFocus<HTMLDivElement>();
  const desktop = useIsDesktop();

  return (
    <div className="z-50 bg-espresso/70" style={desktop ? OVERLAY_DESKTOP : OVERLAY} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => {
          e.currentTarget.scrollTop = 0;
          e.currentTarget.scrollLeft = 0;
        }}
        style={desktop ? PANEL_DESKTOP : PANEL_MOBILE}
        className="sheet-in rounded-t-[36px] bg-cream text-ink shadow-warm md:rounded-[36px]"
      >
        <div className="absolute left-1/2 top-2 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-parchment/80 md:hidden" aria-hidden />
        <IconButton icon="x" label={tc("close")} onClick={onClose} className="absolute right-4 top-4 z-20 bg-paper text-ink shadow-hard" />

        <div style={desktop ? IMAGE_BOX_DESKTOP : IMAGE_BOX}>
          {photo ? (
            <div role="img" aria-label={item?.name ?? t("photoAlt")} style={imageFill(getFullImageUrl(photo))} />
          ) : (
            <div className="grid h-full w-full place-items-center bg-saffron font-display text-8xl font-extrabold text-ink/30">{(item?.name ?? "").charAt(0)}</div>
          )}
          {item?.isFeatured && <span className="absolute bottom-4 left-4 -rotate-6 rounded-xl bg-saffron px-3 py-1 font-display text-lg font-extrabold text-espresso shadow-hard">{t("popular")}</span>}
        </div>

        <div style={desktop ? CONTENT_COL_DESKTOP : CONTENT_COL}>
          <div style={SCROLL_AREA} className="thin-scroll space-y-7 p-5 pr-3 [overscroll-behavior:contain] md:p-8 md:pr-5">
            {isLoading ? (
              <p className="py-12 text-center text-lg text-ink/70">{t("loadingOptions")}</p>
            ) : isError ? (
              <div role="alert" className="py-12 text-center">
                <p className="font-display text-2xl font-extrabold">{t("loadErrorTitle")}</p>
                <p className="mt-2 text-lg text-ink/75">{t("loadErrorBody")}</p>
                <Button variant="ink" className="mt-6" onClick={() => refetch()}>{tc("retry")}</Button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {(item?.isVegan || item?.isVegetarian) && (
                      <Badge tone="herb"><Icon name="leaf" className="h-4 w-4" />{item?.isVegan ? t("vegan") : t("vegetarian")}</Badge>
                    )}
                    {item && <SpiceBadge item={item} />}
                  </div>
                  <h2 id="dish-title" className="mt-3 font-display text-4xl font-extrabold leading-none md:text-5xl">{item?.name ?? t("fallbackName")}</h2>
                  {item?.description && <p className="mt-3 text-lg text-ink/75">{item.description}</p>}
                  <p className="mt-3 font-display text-2xl font-extrabold text-[var(--accent,var(--brand-chili))]">{groups.length > 0 ? t("from", { price: money(basePrice) }) : money(basePrice)}</p>
                </div>

                {ingredientList.length > 0 && (
                  <section aria-label={t("ingredients")}>
                    <p className="mb-3 font-display text-xl font-extrabold">{t("ingredients")}</p>
                    <ul className="flex flex-wrap gap-2">
                      {ingredientList.map((ingredient, i) => (
                        <li key={`${ingredient}-${i}`} className="rounded-full bg-paper px-3 py-1 font-medium capitalize shadow-soft">{ingredient}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {item?.allergenInfo ? (
                  <AllergenAlert text={item.allergenInfo} />
                ) : (
                  item && <p className="rounded-2xl bg-ink/5 p-4 text-ink/75">{t("noAllergen")}</p>
                )}

                {groups.map((group) => {
                  const maxSelect = group.maxSelect ?? 1;
                  const isSingle = maxSelect <= 1;
                  const current = selections[group.id] ?? [];
                  const needs = tried && group.isRequired && current.length === 0;

                  if (isSingleModifier(group)) {
                    const option = group.options[0];
                    return (
                      <div key={group.id} id={`group-${group.id}`}>
                        <p className="mb-3 font-display text-xl font-extrabold">{t("addOn")}</p>
                        <Choice
                          type="checkbox"
                          checked={current.includes(option.id)}
                          onChange={() => toggleOption(group.id, option.id, group)}
                          label={option.allergenInfo ? `${option.name} (${option.allergenInfo})` : option.name ?? ""}
                          extra={option.extraPrice ? `+${money(option.extraPrice)}` : undefined}
                        />
                      </div>
                    );
                  }

                  return (
                    <fieldset key={group.id} id={`group-${group.id}`}>
                      <legend className="mb-3 flex w-full items-center justify-between gap-3">
                        <span className="font-display text-xl font-extrabold">{group.name}</span>
                        <span className="flex items-center gap-2">
                          <Badge tone={needs ? "chili" : "soft"}>{needs ? t("pickOne") : group.isRequired ? t("required") : t("optional")}</Badge>
                          <Badge tone="soft">{isSingle ? t("choose1") : t("upTo", { max: maxSelect, count: current.length })}</Badge>
                        </span>
                      </legend>
                      <div className={`space-y-2 rounded-2xl ${needs ? "ring-4 ring-chili/40" : ""}`}>
                        {(group.options ?? []).map((option) => {
                          const checked = current.includes(option.id);
                          return (
                            <Choice
                              key={option.id}
                              type={isSingle ? "radio" : "checkbox"}
                              name={group.id}
                              checked={checked}
                              disabled={!isSingle && !checked && current.length >= maxSelect}
                              onChange={() => toggleOption(group.id, option.id, group)}
                              label={option.allergenInfo ? `${option.name} (${option.allergenInfo})` : option.name ?? ""}
                              extra={option.extraPrice ? `+${money(option.extraPrice)}` : t("included")}
                            />
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}

                <label className="block">
                  <span className="mb-2 block font-display text-xl font-extrabold">{t("instructions")}</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 150))}
                    rows={3}
                    placeholder={t("instructionsPlaceholder")}
                    className={`${inputCls} resize-none py-3`}
                  />
                  <span className="mt-1 block text-right text-ink/60">{notes.length}/150</span>
                </label>
              </>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-[84px] h-8 bg-gradient-to-t from-cream to-transparent" aria-hidden />
          <div style={FOOTER} className="flex items-center gap-3 border-t-2 border-ink/10 bg-cream p-4 md:px-8">
            <Stepper value={quantity} min={1} onChange={setQuantity} />
            <Button size="lg" full onClick={handleAdd} disabled={isLoading || isError} className="flex-1 whitespace-nowrap !px-4">
              {t("addToCart", { price: money(unitPrice * quantity) })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
