"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { ImageUpload } from "@/components/ui/image-upload";
import { storefrontBannersApi, type BannerInput } from "@/lib/api/storefront";


interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

export default function StorefrontBannersPage() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ Typed the useQuery hook with Banner[]
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["storefront-banners", restaurantId],
    queryFn: () => storefrontBannersApi.list(restaurantId as string),
    enabled: !!restaurantId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: BannerInput) => storefrontBannersApi.create(restaurantId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BannerInput> }) => 
      storefrontBannersApi.update(restaurantId as string, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storefrontBannersApi.remove(restaurantId as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => storefrontBannersApi.reorder(restaurantId as string, orderedIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] }),
  });

  // Helper to move a banner up or down
  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === banners.length - 1) return;

    const newBanners = [...banners];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap
    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
    
    // Update displayOrder locally for instant UI feedback
    newBanners.forEach((b, i) => {
      b.displayOrder = i;
    });

    // Trigger backend reorder
    reorderMutation.mutate(newBanners.map(b => b.id));
  };

  if (isLoading) return <div className="p-8 text-center text-neutral-500">Loading banners...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Homepage Banners</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage the image sliders on your public storefront. Use arrows to change display order.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white rounded-lg hover:bg-[#2B2D33] transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add Banner
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <BannerForm 
          restaurantId={restaurantId!}
          initialData={editingId ? banners.find((b: Banner) => b.id === editingId) : undefined}
          onSubmit={(data) => {
            if (editingId) {
              updateMutation.mutate({ id: editingId, data });
            } else {
              createMutation.mutate(data);
            }
          }} 
          onCancel={() => {
            setIsCreating(false);
            setEditingId(null);
          }} 
        />
      )}

      {/* Banner List */}
      <div className="space-y-4">
        {banners.length === 0 && !isCreating && !editingId && (
          <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
            <ImageIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No banners yet. Add your first banner above.</p>
          </div>
        )}

        {banners.map((banner, index) => (
          <div key={banner.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex gap-4 items-start">
            {/* Image Preview */}
            <div className="w-32 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
              {banner.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <ImageIcon size={20} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">{banner.title || "Untitled Banner"}</h3>
              <p className="text-sm text-neutral-500 truncate">{banner.subtitle || "No subtitle"}</p>
              {banner.linkUrl && (
                <div className="flex items-center gap-1 text-xs text-[#0F6B5C] mt-1">
                  <LinkIcon size={12} />
                  <span className="truncate">{banner.linkUrl}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleMove(index, "up")}
                disabled={index === 0 || reorderMutation.isPending}
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg disabled:opacity-30"
                title="Move up"
              >
                <ArrowUp size={18} />
              </button>
              <button
                onClick={() => handleMove(index, "down")}
                disabled={index === banners.length - 1 || reorderMutation.isPending}
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg disabled:opacity-30"
                title="Move down"
              >
                <ArrowDown size={18} />
              </button>
              
              <button
                onClick={() => setEditingId(banner.id)}
                className="px-3 py-2 text-xs font-medium text-[#1B2333] hover:bg-neutral-100 rounded-lg"
              >
                Edit
              </button>
              
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this banner?")) {
                    deleteMutation.mutate(banner.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Sub-component: Banner Form ---
function BannerForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  restaurantId 
}: { 
  onSubmit: (data: BannerInput) => void; 
  onCancel: () => void; 
  initialData?: Banner;
  restaurantId: string;
}) {
  const [formData, setFormData] = useState<BannerInput>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    imageUrl: initialData?.imageUrl || "",
    linkUrl: initialData?.linkUrl || "",
    displayOrder: initialData?.displayOrder ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
      <h3 className="font-semibold text-neutral-900">{initialData ? "Edit Banner" : "Add New Banner"}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <ImageUpload
            restaurantId={restaurantId}
            value={formData.imageUrl}
            onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
            label="Banner Image (16:9 recommended)"
            className="w-full h-48"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
            placeholder="e.g. Weekend Special"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Subtitle</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
            placeholder="e.g. Get 20% off on all Momos"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Link URL (Optional)</label>
          <input
            type="url"
            value={formData.linkUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-[#1B2333] hover:bg-[#2B2D33] rounded-lg transition-colors"
        >
          {initialData ? "Save Changes" : "Add Banner"}
        </button>
      </div>
    </form>
  );
}