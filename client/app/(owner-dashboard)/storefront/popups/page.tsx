"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Bell, Calendar, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { ImageUpload } from "@/components/ui/image-upload";
import { 
  storefrontPopupsApi, 
  type StorefrontPopupInput 
} from "@/lib/api/storefront";

// Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
const formatDateForInput = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function StorefrontPopupsPage() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch popups
  const { data: popups = [], isLoading } = useQuery({
    queryKey: ["storefront-popups", restaurantId],
    queryFn: () => storefrontPopupsApi.list(restaurantId as string),
    enabled: !!restaurantId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: StorefrontPopupInput) => storefrontPopupsApi.create(restaurantId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StorefrontPopupInput }) => 
      storefrontPopupsApi.update(restaurantId as string, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storefrontPopupsApi.remove(restaurantId as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] }),
  });

  if (isLoading) return <div className="p-8 text-center text-neutral-500">Loading popups...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Promotional Popups</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Schedule time-bound offers or announcements to show on your storefront.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white rounded-lg hover:bg-[#2B2D33] transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add Popup
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <PopupForm 
          restaurantId={restaurantId!}
          initialData={editingId ? popups.find(p => p.id === editingId) : undefined}
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

      {/* Popup List */}
      <div className="space-y-4">
        {popups.length === 0 && !isCreating && !editingId && (
          <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
            <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No popups scheduled. Add your first popup above.</p>
          </div>
        )}

        {popups.map((popup) => {
          // Determine status based on dates
          const now = new Date();
          const start = popup.startDate ? new Date(popup.startDate) : null;
          const end = popup.endDate ? new Date(popup.endDate) : null;
          
          let status = "Inactive";
          let statusColor = "bg-neutral-100 text-neutral-600";
          
          if (popup.isActive) {
            if (start && now < start) {
              status = "Scheduled";
              statusColor = "bg-blue-100 text-blue-700";
            } else if (end && now > end) {
              status = "Expired";
              statusColor = "bg-red-100 text-red-700";
            } else {
              status = "Active";
              statusColor = "bg-green-100 text-green-700";
            }
          }

          return (
            <div key={popup.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex gap-4 items-start">
              {/* Image Preview */}
              <div className="w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                {popup.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={popup.imageUrl} alt="Popup" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-neutral-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-neutral-900 truncate">{popup.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
                    {status}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 line-clamp-2 mb-2">{popup.message || "No message"}</p>
                
                <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                  {start && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Starts: {new Date(popup.startDate!).toLocaleDateString()}
                    </span>
                  )}
                  {end && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Ends: {new Date(popup.endDate!).toLocaleDateString()}
                    </span>
                  )}
                  {popup.ctaText && popup.ctaLink && (
                    <span className="flex items-center gap-1 text-[#0F6B5C]">
                      <LinkIcon size={12} /> CTA: {popup.ctaText}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingId(popup.id)}
                  className="px-3 py-2 text-xs font-medium text-[#1B2333] hover:bg-neutral-100 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this popup?")) {
                      deleteMutation.mutate(popup.id);
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
          );
        })}
      </div>
    </div>
  );
}

// --- Sub-component: Popup Form ---
function PopupForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  restaurantId 
}: { 
  onSubmit: (data: StorefrontPopupInput) => void; 
  onCancel: () => void; 
  initialData?: any;
  restaurantId: string;
}) {
  const [formData, setFormData] = useState<StorefrontPopupInput>({
    title: initialData?.title || "",
    message: initialData?.message || "",
    imageUrl: initialData?.imageUrl || "",
    ctaText: initialData?.ctaText || "",
    ctaLink: initialData?.ctaLink || "",
    startDate: initialData?.startDate ? formatDateForInput(initialData.startDate) : "",
    endDate: initialData?.endDate ? formatDateForInput(initialData.endDate) : "",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert datetime-local strings back to ISO strings for the backend
    const payload: StorefrontPopupInput = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };
    
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
      <h3 className="font-semibold text-neutral-900">{initialData ? "Edit Popup" : "Add New Popup"}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <ImageUpload
            restaurantId={restaurantId}
            value={formData.imageUrl}
            onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
            label="Popup Image (Optional, 1:1 or 4:3 recommended)"
            className="w-full h-40"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            maxLength={150}
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
            placeholder="e.g. Weekend Special Offer!"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none resize-none"
            placeholder="e.g. Get 20% off on all orders above Rs. 1000 this weekend."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Button Text (CTA)</label>
          <input
            type="text"
            value={formData.ctaText}
            onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
            placeholder="e.g. Order Now"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Button Link (CTA URL)</label>
          <input
            type="url"
            value={formData.ctaLink}
            onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date & Time</label>
          <input
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">End Date & Time</label>
          <input
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 text-[#1B2333] border-neutral-300 rounded focus:ring-[#1B2333]"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-neutral-700 cursor-pointer">
            Active (Enable this popup)
          </label>
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
          {initialData ? "Save Changes" : "Add Popup"}
        </button>
      </div>
    </form>
  );
}