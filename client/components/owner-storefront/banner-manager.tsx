// components/owner-storefront/banner-manager.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { storefrontBannersApi, type BannerInput, type Banner } from "@/lib/api/storefront";
import { ImageUpload } from "@/components/ui/image-upload";

export function BannerManager({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerInput>({ title: "", subtitle: "", imageUrl: "", linkUrl: "" });

  const { data: banners = [] } = useQuery<Banner[]>({ 
    queryKey: ["storefront-banners", restaurantId], 
    queryFn: () => storefrontBannersApi.list(restaurantId) 
  });
  
  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; input: BannerInput }) => 
      data.id ? storefrontBannersApi.update(restaurantId, data.id, data.input) : storefrontBannersApi.create(restaurantId, data.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] });
      setIsCreating(false); 
      setEditingId(null); 
      setFormData({ title: "", subtitle: "", imageUrl: "", linkUrl: "" });
    }
  });

  const deleteMutation = useMutation({ 
    mutationFn: (id: string) => storefrontBannersApi.remove(restaurantId, id), 
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] }) 
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-neutral-900">Homepage Banners</h3>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white rounded-lg text-sm font-medium">
            Add Banner
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ id: editingId || undefined, input: formData }); }} className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <ImageUpload restaurantId={restaurantId} value={formData.imageUrl} onChange={(url) => setFormData(p => ({ ...p, imageUrl: url }))} className="w-full h-48" label="Banner Image (16:9 recommended)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1B2333]" />
            <input value={formData.subtitle} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} placeholder="Subtitle" className="px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1B2333]" />
            <input value={formData.linkUrl} onChange={e => setFormData(p => ({ ...p, linkUrl: e.target.value }))} placeholder="Link URL (Optional)" className="md:col-span-2 px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1B2333]" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { setIsCreating(false); setEditingId(null); }} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm text-white bg-[#1B2333] rounded-lg disabled:opacity-50">{editingId ? "Update" : "Add"} Banner</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex gap-4 items-center">
            <div className="w-32 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400"><ImageIcon size={20}/></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-neutral-900 truncate">{banner.title || "Untitled"}</h4>
              <p className="text-sm text-neutral-500 truncate">{banner.subtitle || "No subtitle"}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditingId(banner.id); setFormData({ title: banner.title, subtitle: banner.subtitle, imageUrl: banner.imageUrl, linkUrl: banner.linkUrl }); setIsCreating(true); }} 
                className="px-3 py-1.5 text-xs font-medium text-[#1B2333] hover:bg-neutral-100 rounded-lg"
              >
                Edit
              </button>
              <button 
                onClick={() => confirm("Delete this banner?") && deleteMutation.mutate(banner.id)} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                aria-label="Delete banner"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && !isCreating && <p className="text-center text-sm text-neutral-500 py-8">No banners yet.</p>}
      </div>
    </div>
  );
}