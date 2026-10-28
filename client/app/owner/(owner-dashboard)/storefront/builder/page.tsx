// app/(owner-dashboard)/storefront/builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout, Image as ImageIcon, Bell, Settings, Save, Loader2, ArrowUp, ArrowDown, Eye, EyeOff, Globe } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { storefrontConfigApi, type StorefrontConfigInput, type SectionSetting } from "@/lib/api/storefront";
import { BannerManager } from "@/components/owner-storefront/banner-manager";
import { PopupManager } from "@/components/owner-storefront/popup-manager";

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

  // ✅ FIXED: Replaced 'any' with 'string | boolean'
  const updateSection = (id: string, field: keyof SectionSetting, value: string | boolean) => {
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