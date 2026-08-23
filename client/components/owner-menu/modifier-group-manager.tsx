// components/owner-menu/modifier-group-manager.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export interface OwnerModifierOption {
  id: string;
  name?: string;
  extraPrice?: number;
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
  onDeleteGroup: (id: string) => void;
  onAddOption: (groupId: string, input: { name: string; extraPrice: number }) => void;
  onDeleteOption: (groupId: string, optionId: string) => void;
  isMutating: boolean;
}

export function ModifierGroupManager({
  groups,
  onAddGroup,
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

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-800">Modifier groups</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            e.g. &quot;Size&quot; (choose 1) or &quot;Toppings&quot; (choose up to 3). Link
            these to menu items below.
          </p>
        </div>
        <button
          onClick={() => setShowGroupForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md shrink-0"
        >
          <Plus size={13} />
          New group
        </button>
      </div>

      {showGroupForm && (
        <div className="border border-neutral-200 rounded-lg p-3 mb-3 space-y-2">
          <input
            autoFocus
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name (e.g. Size)"
            className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
          />
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-neutral-500">
              Min select
              <input
                type="number"
                min={0}
                value={minSelect}
                onChange={(e) => setMinSelect(e.target.value)}
                className="w-full mt-1 text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
              />
            </label>
            <label className="flex-1 text-xs text-neutral-500">
              Max select
              <input
                type="number"
                min={1}
                value={maxSelect}
                onChange={(e) => setMaxSelect(e.target.value)}
                className="w-full mt-1 text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
              />
            </label>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={submitGroup}
              disabled={isMutating}
              className="text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              Save group
            </button>
            <button
              onClick={() => setShowGroupForm(false)}
              className="text-xs text-neutral-500 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-6">
          No modifier groups yet — create one above.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {groups.map((group) => {
            const isOpen = expandedId === group.id;
            return (
              <li key={group.id} className="py-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : group.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-neutral-800"
                  >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {group.name}
                    <span className="text-xs font-normal text-neutral-400 ml-1">
                      ({group.minSelect ?? 0}–{group.maxSelect ?? 1} select
                      {group.isRequired ? ", required" : ""})
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteGroup(group.id)}
                    className="text-neutral-300 hover:text-red-500"
                    aria-label="Delete group"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {isOpen && (
                  <OptionEditor
                    options={group.options ?? []}
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
  onAdd: (input: { name: string; extraPrice: number }) => void;
  onDelete: (optionId: string) => void;
}) {
  const [name, setName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");

  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), extraPrice: Number(extraPrice) || 0 });
    setName("");
    setExtraPrice("");
  }

  return (
    <div className="mt-2 ml-5 pl-3 border-l border-neutral-100 space-y-1.5">
      {options.map((opt) => (
        <div key={opt.id} className="group flex items-center justify-between text-sm">
          <span className="text-neutral-600">{opt.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">
              {opt.extraPrice ? `+Rs ${opt.extraPrice}` : "Free"}
            </span>
            <button
              onClick={() => onDelete(opt.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500"
              aria-label="Delete option"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-1.5 pt-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Option name"
          className="flex-1 text-xs border border-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
        />
        <input
          value={extraPrice}
          onChange={(e) => setExtraPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="+Rs"
          type="number"
          className="w-16 text-xs border border-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
        />
        <button
          onClick={submit}
          className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2.5 py-1.5 rounded-md"
        >
          Add
        </button>
      </div>
    </div>
  );
}
