// app/(owner-dashboard)/storefront/builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout, Image as ImageIcon, Bell, Settings, Save, Loader2, ArrowUp, ArrowDown, Eye, EyeOff, Globe } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { storefrontConfigApi, type StorefrontConfigInput, type SectionSetting } from "@/lib/api/storefront";
import { storefrontBannersApi, type BannerInput } from "@/lib/api/storefront";
import { storefrontPopupsApi, POPUP_TYPES, POPUP_LIMITS, type StorefrontPopupInput } from "@/lib/api/storefront";
import { getErrorMessage } from "@/lib/utils/error";
import { ImageUpload } from "@/components/ui/image-upload";

const TABS = [
  { key: "LAYOUT", label: "Homepage Layout", icon: Layout },
  { key: "BANNERS", label: "Banners", icon: ImageIcon },
  { key: "POPUPS", label: "Promotional Popups", icon: Bell },
  { key: "INFO", label: "About & Contact", icon: Settings },
];

const DEFAULT_SECTIONS: SectionSetting[] = [
  { id: "banner", isVisible: true, titleEn: "Welcome", titleJa: "ようこそ" },
  { id: "offers", isVisible: true, titleEn: "Special Offers", titleJa: "特別オファー" },
  { id: "menu", isVisible: true, titleEn: "Our Menu", titleJa: "メニュー" },
  { id: "about", isVisible: true, titleEn: "About Us", titleJa: "私たちについて" },
  { id: "contact", isVisible: true, titleEn: "Contact & Location", titleJa: "お問い合わせ" },
  { id: "reviews", isVisible: false, titleEn: "Customer Reviews", titleJa: "お客様の声" },
];

export default function StorefrontBuilderPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("LAYOUT");

  // --- Layout & Info State ---
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["storefront-config", restaurantId],
    queryFn: () => storefrontConfigApi.get(restaurantId as string),
    enabled: !!restaurantId,
  });

  const [sectionSettings, setSectionSettings] = useState<SectionSetting[]>(DEFAULT_SECTIONS);
  const [infoData, setInfoData] = useState({
    aboutText: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    socialLinks: { facebook: "", instagram: "" },
  });

  useEffect(() => {
    if (config) {
      setSectionSettings((config.sectionSettings && config.sectionSettings.length > 0) 
        ? config.sectionSettings 
        : DEFAULT_SECTIONS);
      setInfoData({
        aboutText: config.aboutText || "",
        contactPhone: config.contactPhone || "",
        contactEmail: config.contactEmail || "",
        contactAddress: config.contactAddress || "",
        socialLinks: config.socialLinks || { facebook: "", instagram: "" },
      });
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: (data: StorefrontConfigInput) => storefrontConfigApi.update(restaurantId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-config", restaurantId] });
    },
  });

  const handleSaveLayout = () => {
    updateConfigMutation.mutate({ ...infoData, sectionSettings });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sectionSettings.length - 1) return;
    const newSettings = [...sectionSettings];
    [newSettings[index], newSettings[index + (direction === "up" ? -1 : 1)]] = 
    [newSettings[index + (direction === "up" ? -1 : 1)], newSettings[index]];
    setSectionSettings(newSettings);
  };

  const updateSection = (id: string, field: keyof SectionSetting, value: any) => {
    setSectionSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- Render Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "LAYOUT":
        return (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Layout size={18} className="text-[#E3A008]" /> Homepage Sections
              </h3>
              <p className="text-sm text-neutral-500 mb-6">Toggle sections on/off, customize their titles, and reorder them for your customer-facing website.</p>
              
              <div className="space-y-3">
                {sectionSettings.map((section, index) => (
                  <div key={section.id} className="flex items-center gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveSection(index, "up")} disabled={index === 0} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"><ArrowUp size={16} /></button>
                      <button onClick={() => moveSection(index, "down")} disabled={index === sectionSettings.length - 1} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"><ArrowDown size={16} /></button>
                    </div>
                    
                    <button onClick={() => updateSection(section.id, "isVisible", !section.isVisible)} className="shrink-0">
                      {section.isVisible ? <Eye size={20} className="text-[#0F6B5C]" /> : <EyeOff size={20} className="text-neutral-400" />}
                    </button>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><Globe size={10} /> English Title</label>
                        <input 
                          value={section.titleEn} 
                          onChange={(e) => updateSection(section.id, "titleEn", e.target.value)}
                          disabled={!section.isVisible}
                          className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1"><Globe size={10} /> Japanese Title</label>
                        <input 
                          value={section.titleJa} 
                          onChange={(e) => updateSection(section.id, "titleJa", e.target.value)}
                          disabled={!section.isVisible}
                          className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                <button 
                  onClick={handleSaveLayout} 
                  disabled={updateConfigMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1B2333] text-white rounded-lg hover:bg-[#2B2D33] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {updateConfigMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Layout & Info
                </button>
              </div>
            </div>
          </div>
        );

      case "BANNERS":
        return <BannerManager restaurantId={restaurantId!} />;
      
      case "POPUPS":
        return <PopupManager restaurantId={restaurantId!} />;

      case "INFO":
        return (
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-2">About & Contact Details</h3>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">About Us</label>
              <textarea rows={4} value={infoData.aboutText} onChange={(e) => setInfoData({...infoData, aboutText: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none resize-none" placeholder="Tell your customers about your restaurant..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Phone</label>
                <input type="tel" value={infoData.contactPhone} onChange={(e) => setInfoData({...infoData, contactPhone: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Email</label>
                <input type="email" value={infoData.contactEmail} onChange={(e) => setInfoData({...infoData, contactEmail: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Physical Address</label>
              <input type="text" value={infoData.contactAddress} onChange={(e) => setInfoData({...infoData, contactAddress: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none" />
            </div>
            <div className="pt-4 border-t border-neutral-200 flex justify-end">
              <button onClick={handleSaveLayout} disabled={updateConfigMutation.isPending} className="flex items-center gap-2 px-6 py-2.5 bg-[#1B2333] text-white rounded-lg hover:bg-[#2B2D33] transition-colors text-sm font-medium disabled:opacity-50">
                {updateConfigMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Info
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (configLoading) return <div className="p-8 text-center text-neutral-500">Loading storefront settings...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Storefront Builder</h1>
        <p className="text-sm text-neutral-500 mt-1">Customize how your restaurant appears to customers on the web.</p>
      </div>

      <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-2 text-sm font-medium px-4 py-3 border-b-2 transition-all ${
                activeTab === tab.key ? "border-[#E3A008] text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {renderTabContent()}
    </div>
  );
}

// --- Sub-components for Banners and Popups (Reusing your existing logic, adapted for tabs) ---

function BannerManager({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerInput>({ title: "", subtitle: "", imageUrl: "", linkUrl: "" });

  const { data: banners = [] } = useQuery({ queryKey: ["storefront-banners", restaurantId], queryFn: () => storefrontBannersApi.list(restaurantId) });
  
  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; input: BannerInput }) => 
      data.id ? storefrontBannersApi.update(restaurantId, data.id, data.input) : storefrontBannersApi.create(restaurantId, data.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] });
      setIsCreating(false); setEditingId(null); setFormData({ title: "", subtitle: "", imageUrl: "", linkUrl: "" });
    }
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => storefrontBannersApi.remove(restaurantId, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] }) });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-neutral-900">Homepage Banners</h3>
        {!isCreating && <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white rounded-lg text-sm font-medium">Add Banner</button>}
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
        {banners.map((b: any, i: number) => (
          <div key={b.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex gap-4 items-center">
            <div className="w-32 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
              {b.imageUrl ? <img src={b.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-400"><ImageIcon size={20}/></div>}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-neutral-900 truncate">{b.title || "Untitled"}</h4>
              <p className="text-sm text-neutral-500 truncate">{b.subtitle || "No subtitle"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(b.id); setFormData({ title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl }); setIsCreating(true); }} className="px-3 py-1.5 text-xs font-medium text-[#1B2333] hover:bg-neutral-100 rounded-lg">Edit</button>
              <button onClick={() => confirm("Delete this banner?") && deleteMutation.mutate(b.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><ImageIcon size={18} className="hidden" />🗑️</button>
            </div>
          </div>
        ))}
        {banners.length === 0 && !isCreating && <p className="text-center text-sm text-neutral-500 py-8">No banners yet.</p>}
      </div>
    </div>
  );
}

function PopupUsage({ label, hint, used, limit }: { label: string; hint: string; used: number; limit: number }) {
  const full = used >= limit;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      className={`rounded-xl border p-4 ${full ? "border-amber-300 bg-amber-50" : "border-neutral-200 bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">{label}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>
        </div>
        <p className="shrink-0 text-2xl font-semibold leading-none text-neutral-900">
          {used}
          <span className="text-base font-medium text-neutral-400"> / {limit}</span>
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < used ? (full ? "bg-amber-500" : "bg-[#1B2333]") : "bg-neutral-200"}`} />
        ))}
      </div>
      <p className={`mt-2 text-xs font-medium ${full ? "text-amber-800" : "text-neutral-500"}`}>
        {full ? "Limit reached. Turn one off to activate another." : `${limit - used} of ${limit} active slots free`}
      </p>
    </div>
  );
}

const EMPTY_POPUP: StorefrontPopupInput = { title: "", message: "", imageUrl: "", ctaText: "", ctaLink: "", type: "DISCOUNT", isActive: true };

function PopupManager({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StorefrontPopupInput>(EMPTY_POPUP);

  const { data: popups = [] } = useQuery({ queryKey: ["storefront-popups", restaurantId], queryFn: () => storefrontPopupsApi.list(restaurantId) });
  
  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; input: StorefrontPopupInput }) => 
      data.id ? storefrontPopupsApi.update(restaurantId, data.id, data.input) : storefrontPopupsApi.create(restaurantId, data.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] });
      setIsCreating(false); setEditingId(null); setFormData(EMPTY_POPUP);
    }
  });

  const activeCount = (external: boolean, excludeId?: string | null) =>
    popups.filter((p: any) => p.isActive && p.id !== excludeId && (p.type === "EXTERNAL_AD") === external).length;
  const ownActive = activeCount(false);
  const externalActive = activeCount(true);
  const formIsExternal = formData.type === "EXTERNAL_AD";
  const atLimit = activeCount(formIsExternal, editingId) >= (formIsExternal ? POPUP_LIMITS.external : POPUP_LIMITS.own);
  const willBeActive = !!formData.isActive && !atLimit;

  const deleteMutation = useMutation({ mutationFn: (id: string) => storefrontPopupsApi.remove(restaurantId, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] }) });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-neutral-900">Promotional Popups</h3>
        {!isCreating && <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white rounded-lg text-sm font-medium">Add Popup</button>}
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
        {popups.map((p: any) => (
          <div key={p.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex gap-4 items-center">
            <div className="w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Bell size={20} className="text-neutral-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-neutral-900 truncate">{p.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.type === 'EXTERNAL_AD' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>{POPUP_TYPES.find((t) => t.value === p.type)?.label ?? 'Announcement'}</span>
              </div>
              <p className="text-sm text-neutral-500 line-clamp-2">{p.message || "No message"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(p.id); setFormData({ title: p.title, message: p.message, imageUrl: p.imageUrl, ctaText: p.ctaText, ctaLink: p.ctaLink, type: p.type, isActive: p.isActive }); setIsCreating(true); }} className="px-3 py-1.5 text-xs font-medium text-[#1B2333] hover:bg-neutral-100 rounded-lg">Edit</button>
              <button onClick={() => confirm("Delete this popup?") && deleteMutation.mutate(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
            </div>
          </div>
        ))}
        {popups.length === 0 && !isCreating && <p className="text-center text-sm text-neutral-500 py-8">No popups scheduled.</p>}
      </div>
    </div>
  );
}