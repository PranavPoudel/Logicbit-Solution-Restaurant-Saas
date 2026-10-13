// components/owner-menu/modifier-group-manager.tsx
"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { isSingleModifier } from "@/lib/utils/modifiers";

export interface OwnerModifierOption {
  id: string;
  name?: string;
  extraPrice?: number;
  allergenInfo?: string;
}

export interface OwnerModifierGroup {
  id: string;
  name?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  options?: OwnerModifierOption[];
}

interface ModifierGroupManagerProps {
  groups: OwnerModifierGroup[];
  onAddGroup: (input: { name: string; minSelect: number; maxSelect: number; isRequired: boolean }) => void;
  onAddSingle: (input: { name: string; extraPrice: number; allergenInfo?: string }) => void;
  onDeleteGroup: (id: string) => void;
  onAddOption: (groupId: string, input: { name: string; extraPrice: number; allergenInfo?: string }) => void;
  onDeleteOption: (groupId: string, optionId: string) => void;
  isMutating: boolean;
}

const FIELD =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#E3A008] focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40";
const LABEL = "block text-xs font-medium text-neutral-600";
const ICON_BUTTON =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600";

function selectionRule(group: OwnerModifierGroup) {
  const min = group.minSelect ?? 0;
  const max = group.maxSelect ?? 1;
  const choose = max <= 1 ? "Choose 1" : min > 0 ? `Choose ${min} to ${max}` : `Choose up to ${max}`;
  return `${group.isRequired ? "Required" : "Optional"} · ${choose}`;
}

const priceLabel = (price?: number) => (price ? `+Rs ${price}` : "Free");

function LabeledInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={LABEL}>
      {label}
      <input {...props} className={`${FIELD} mt-1`} />
    </label>
  );
}

function FormActions({ saveLabel, onSave, onCancel, disabled }: { saveLabel: string; onSave: () => void; onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSave} disabled={disabled} className="min-h-10 rounded-lg bg-[#1B2333] px-4 text-sm font-medium text-white disabled:opacity-50">
        {saveLabel}
      </button>
      <button onClick={onCancel} className="min-h-10 rounded-lg px-4 text-sm text-neutral-600 hover:bg-neutral-100">
        Cancel
      </button>
    </div>
  );
}

function AllergenPill({ text }: { text?: string }) {
  if (!text) return null;
  return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">Allergen: {text}</span>;
}

export function ModifierGroupManager({
  groups,
  onAddGroup,
  onAddSingle,
  onDeleteGroup,
  onAddOption,
  onDeleteOption,
  isMutating,
}: ModifierGroupManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [minSelect, setMinSelect] = useState("0");
  const [maxSelect, setMaxSelect] = useState("1");
  const [showSingleForm, setShowSingleForm] = useState(false);
  const [singleName, setSingleName] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  const [singleAllergen, setSingleAllergen] = useState("");

  function submitGroup() {
    if (!groupName.trim()) return;
    onAddGroup({
      name: groupName.trim(),
      minSelect: Number(minSelect) || 0,
      maxSelect: Number(maxSelect) || 1,
      isRequired: Number(minSelect) > 0,
    });
    setGroupName("");
    setMinSelect("0");
    setMaxSelect("1");
    setShowGroupForm(false);
  }

  function submitSingle() {
    if (!singleName.trim()) return;
    onAddSingle({ name: singleName.trim(), extraPrice: Number(singlePrice) || 0, allergenInfo: singleAllergen.trim() || undefined });
    setSingleName("");
    setSinglePrice("");
    setSingleAllergen("");
    setShowSingleForm(false);
  }

  function confirmDelete(group: OwnerModifierGroup) {
    const what = isSingleModifier(group) ? `"${group.name}"` : `"${group.name}" and all its options`;
    if (confirm(`Delete ${what}?`)) onDeleteGroup(group.id);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-neutral-900">Modifiers</h3>
          <p className="mt-1 text-sm text-neutral-500">Extras customers can add to a dish. Link them from the Menu Items tab.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => {
              setShowSingleForm((v) => !v);
              setShowGroupForm(false);
            }}
            title="One extra, e.g. Extra cheese"
            className="flex min-h-10 items-center gap-1.5 rounded-lg border border-[#1B2333] px-3.5 text-sm font-medium text-[#1B2333] transition-colors hover:bg-neutral-50"
          >
            <Plus size={15} />
            New single modifier
          </button>
          <button
            onClick={() => {
              setShowGroupForm((v) => !v);
              setShowSingleForm(false);
            }}
            title="Choices, e.g. Size or Toppings"
            className="flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1B2333] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#2A3550]"
          >
            <Plus size={15} />
            New group
          </button>
        </div>
      </div>

      {showSingleForm && (
        <div className="mb-4 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <LabeledInput
              label="Name"
              autoFocus
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSingle()}
              placeholder="e.g. Extra cheese"
            />
            <LabeledInput
              label="Extra price (Rs)"
              value={singlePrice}
              onChange={(e) => setSinglePrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSingle()}
              placeholder="0"
              type="number"
              min={0}
            />
          </div>
          <LabeledInput
            label="Allergen (optional)"
            value={singleAllergen}
            onChange={(e) => setSingleAllergen(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSingle()}
            placeholder="e.g. Milk"
            maxLength={200}
          />
          <FormActions saveLabel="Save modifier" onSave={submitSingle} onCancel={() => setShowSingleForm(false)} disabled={isMutating} />
        </div>
      )}

      {showGroupForm && (
        <div className="mb-4 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <LabeledInput label="Group name" autoFocus value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Size" />
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="Minimum choices" type="number" min={0} value={minSelect} onChange={(e) => setMinSelect(e.target.value)} />
            <LabeledInput label="Maximum choices" type="number" min={1} value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} />
          </div>
          <p className="text-xs text-neutral-500">A minimum of 1 or more makes the group required.</p>
          <FormActions saveLabel="Save group" onSave={submitGroup} onCancel={() => setShowGroupForm(false)} disabled={isMutating} />
        </div>
      )}

      {groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">No modifiers yet. Add one above.</p>
      ) : (
        <ul className="space-y-2.5">
          {groups.map((group) => {
            const isOpen = expandedId === group.id;
            const options = group.options ?? [];

            if (isSingleModifier(group)) {
              const option = options[0];
              return (
                <li key={group.id} className="flex min-h-14 items-center gap-3 rounded-xl border border-neutral-200 bg-white pl-4 pr-2">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-base font-semibold text-neutral-900">{group.name}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                      Single
                    </span>
                    <AllergenPill text={option.allergenInfo} />
                  </div>
                  <span className="shrink-0 font-mono text-sm text-neutral-600">{priceLabel(option.extraPrice)}</span>
                  <button onClick={() => confirmDelete(group)} className={ICON_BUTTON} aria-label={`Delete ${group.name}`}>
                    <Trash2 size={17} />
                  </button>
                </li>
              );
            }

            return (
              <li key={group.id} className="rounded-xl border border-neutral-200 bg-white">
                <div className="flex items-center pr-2">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : group.id)}
                    aria-expanded={isOpen}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                  >
                    {isOpen ? <ChevronDown size={18} className="shrink-0 text-neutral-500" /> : <ChevronRight size={18} className="shrink-0 text-neutral-500" />}
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-neutral-900">{group.name}</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {selectionRule(group)} · {options.length} {options.length === 1 ? "option" : "options"}
                      </span>
                    </span>
                  </button>
                  <button onClick={() => confirmDelete(group)} className={ICON_BUTTON} aria-label={`Delete ${group.name}`}>
                    <Trash2 size={17} />
                  </button>
                </div>

                {isOpen && (
                  <OptionEditor
                    options={options}
                    onAdd={(input) => onAddOption(group.id, input)}
                    onDelete={(optionId) => onDeleteOption(group.id, optionId)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OptionEditor({
  options,
  onAdd,
  onDelete,
}: {
  options: OwnerModifierOption[];
  onAdd: (input: { name: string; extraPrice: number; allergenInfo?: string }) => void;
  onDelete: (optionId: string) => void;
}) {
  const [name, setName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [allergenInfo, setAllergenInfo] = useState("");

  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), extraPrice: Number(extraPrice) || 0, allergenInfo: allergenInfo.trim() || undefined });
    setName("");
    setExtraPrice("");
    setAllergenInfo("");
  }

  return (
    <div className="border-t border-neutral-100 px-4 pb-4 pt-2">
      {options.length === 0 ? (
        <p className="py-3 text-sm text-neutral-500">No options yet. Add the first one below.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {options.map((opt) => (
            <li key={opt.id} className="flex min-h-12 items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-sm font-medium text-neutral-800">{opt.name}</span>
                <AllergenPill text={opt.allergenInfo} />
              </div>
              <span className="shrink-0 font-mono text-sm text-neutral-600">{priceLabel(opt.extraPrice)}</span>
              <button onClick={() => onDelete(opt.id)} className={ICON_BUTTON} aria-label={`Delete ${opt.name}`}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid gap-2 rounded-xl bg-neutral-50 p-3 sm:grid-cols-[1fr_6.5rem_1fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Option name"
          aria-label="Option name"
          className={FIELD}
        />
        <input
          value={extraPrice}
          onChange={(e) => setExtraPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="+Rs"
          aria-label="Extra price"
          type="number"
          min={0}
          className={FIELD}
        />
        <input
          value={allergenInfo}
          onChange={(e) => setAllergenInfo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Allergen (optional)"
          aria-label="Allergen"
          maxLength={200}
          className={FIELD}
        />
        <button onClick={submit} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1B2333] px-4 text-sm font-medium text-white">
          <Plus size={15} />
          Add option
        </button>
      </div>
    </div>
  );
}
