// components/owner-storefront/popup-manager.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Trash2 } from "lucide-react";
import { storefrontPopupsApi, POPUP_TYPES, POPUP_LIMITS, type StorefrontPopupInput, type StorefrontPopup } from "@/lib/api/storefront";
import { getErrorMessage } from "@/lib/utils/error";
import { ImageUpload } from "@/components/ui/image-upload";
import { PopupUsage } from "./popup-usage";

const EMPTY_POPUP: StorefrontPopupInput = { title: "", message: "", imageUrl: "", ctaText: "", ctaLink: "", type: "DISCOUNT", isActive: true };

export function PopupManager({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StorefrontPopupInput>(EMPTY_POPUP);

  const { data: popups = [] } = useQuery<StorefrontPopup[]>({ 
    queryKey: ["storefront-popups", restaurantId], 
    queryFn: () => storefrontPopupsApi.list(restaurantId) 
  });
  
  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; input: StorefrontPopupInput }) => 
      data.id ? storefrontPopupsApi.update(restaurantId, data.id, data.input) : storefrontPopupsApi.create(restaurantId, data.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] });
      setIsCreating(false); 
      setEditingId(null); 
      setFormData(EMPTY_POPUP);
    }
  });

  const activeCount = (external: boolean, excludeId?: string | null) =>
    popups.filter((p) => p.isActive && p.id !== excludeId && (p.type === "EXTERNAL_AD") === external).length;
    
  const ownActive = activeCount(false);
  const externalActive = activeCount(true);
  const formIsExternal = formData.type === "EXTERNAL_AD";
  const atLimit = activeCount(formIsExternal, editingId) >= (formIsExternal ? POPUP_LIMITS.external : POPUP_LIMITS.own);
  const willBeActive = !!formData.isActive && !atLimit;

  const deleteMutation = useMutation({ 
    mutationFn: (id: string) => storefrontPopupsApi.remove(restaurantId, id), 
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] }) 
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-neutral-900">Promotional Popups</h3>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white rounded-lg text-sm font-medium">
            Add Popup
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PopupUsage label="Your own promotions" hint="Discounts, new dishes, events and announcements" used={ownActive} limit={POPUP_LIMITS.own} />
        <PopupUsage label="External ads" hint="Third-party promotions, labelled &quot;Ad&quot;" used={externalActive} limit={POPUP_LIMITS.external} />
      </div>

      {isCreating && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ id: editingId || undefined, input: { ...formData, isActive: willBeActive } }); }} className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Type</p>
            <div className="flex flex-wrap gap-2">
              {POPUP_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={formData.type === t.value}
                  onClick={() => setFormData((p) => ({ ...p, type: t.value }))}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${formData.type === t.value ? "border-[#1B2333] bg-[#1B2333] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {formIsExternal && <p className="mt-2 text-xs text-neutral-500">Third-party promotions are limited to {POPUP_LIMITS.external} active at a time and are labelled &quot;Ad&quot; for customers.</p>}
          </div>
          <ImageUpload restaurantId={restaurantId} value={formData.imageUrl} onChange={(url) => setFormData(p => ({ ...p, imageUrl: url }))} className="w-full h-40" label="Popup Image (Optional)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Popup Title *" className="px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1B2333]" />
            <input value={formData.ctaText} onChange={e => setFormData(p => ({ ...p, ctaText: e.target.value }))} placeholder="Button Text (e.g., Order Now)" className="px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1B2333]" />
            <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} placeholder="Message" rows={3} className="md:col-span-2 px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1B2333] resize-none" />
            <input value={formData.ctaLink} onChange={e => setFormData(p => ({ ...p, ctaLink: e.target.value }))} placeholder="Button Link URL" className="md:col-span-2 px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1B2333]" />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={willBeActive} disabled={atLimit} onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[#1B2333]" />
            <label htmlFor="isActive" className="text-sm font-medium text-neutral-700">Active</label>
            {atLimit && <span className="text-xs text-amber-700">Limit reached. This one will be saved as inactive. Turn another {formIsExternal ? "external ad" : "promotion"} off to activate it.</span>}
          </div>
          {saveMutation.isError && <p className="text-sm text-red-600">{getErrorMessage(saveMutation.error, "Couldn't save this popup.")}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { setIsCreating(false); setEditingId(null); }} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm text-white bg-[#1B2333] rounded-lg disabled:opacity-50">{editingId ? "Update" : "Add"} Popup</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {popups.map((popup) => (
          <div key={popup.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex gap-4 items-center">
            <div className="w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              {popup.imageUrl ? (
                <img src={popup.imageUrl} alt={popup.title} className="w-full h-full object-cover" />
              ) : (
                <Bell size={20} className="text-neutral-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-neutral-900 truncate">{popup.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${popup.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                  {popup.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${popup.type === 'EXTERNAL_AD' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                  {POPUP_TYPES.find((t) => t.value === popup.type)?.label ?? 'Announcement'}
                </span>
              </div>
              <p className="text-sm text-neutral-500 line-clamp-2">{popup.message || "No message"}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditingId(popup.id); setFormData({ title: popup.title, message: popup.message, imageUrl: popup.imageUrl, ctaText: popup.ctaText, ctaLink: popup.ctaLink, type: popup.type, isActive: popup.isActive }); setIsCreating(true); }} 
                className="px-3 py-1.5 text-xs font-medium text-[#1B2333] hover:bg-neutral-100 rounded-lg"
              >
                Edit
              </button>
              <button 
                onClick={() => confirm("Delete this popup?") && deleteMutation.mutate(popup.id)} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                aria-label="Delete popup"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {popups.length === 0 && !isCreating && <p className="text-center text-sm text-neutral-500 py-8">No popups scheduled.</p>}
      </div>
    </div>
  );
}