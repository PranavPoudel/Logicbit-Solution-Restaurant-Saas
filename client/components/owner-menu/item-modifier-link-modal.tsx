// components/owner-menu/item-modifier-link-modal.tsx
"use client";

import { X } from "lucide-react";
import type { OwnerModifierGroup } from "@/components/owner-menu/modifier-group-manager";

interface ItemModifierLinkModalProps {
  itemName: string;
  allGroups: OwnerModifierGroup[];
  linkedGroupIds: Set<string>;
  onToggle: (groupId: string, linked: boolean) => void;
  onClose: () => void;
}

export function ItemModifierLinkModal({
  itemName,
  allGroups,
  linkedGroupIds,
  onToggle,
  onClose,
}: ItemModifierLinkModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-800">
            Modifiers for <span className="font-semibold">{itemName}</span>
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {allGroups.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">
              No modifiers yet. Create one first in the Modifiers tab.
            </p>
          ) : (
            allGroups.map((group) => {
              const linked = linkedGroupIds.has(group.id);
              return (
                <label
                  key={group.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-200 cursor-pointer"
                >
                  <span className="text-sm text-neutral-800">{group.name}</span>
                  <input
                    type="checkbox"
                    checked={linked}
                    onChange={() => onToggle(group.id, !linked)}
                    className="accent-[#E3A008]"
                  />
                </label>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="w-full text-sm font-medium bg-[#1B2333] text-white py-2.5 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
