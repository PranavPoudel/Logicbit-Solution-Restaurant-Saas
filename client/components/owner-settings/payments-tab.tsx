"use client";

import { CreditCard, ExternalLink } from "lucide-react";
import { SettingsField, SettingsToggle } from "@/components/owner-settings/settings-field";
import { SettingsForm } from "@/app/owner/(owner-dashboard)/settings/page";

interface PaymentsTabProps {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  hasNewSecret: boolean;
  setHasNewSecret: (value: boolean) => void;
}

export function PaymentsTab({ form, set, hasNewSecret, setHasNewSecret }: PaymentsTabProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Enabled Payment Methods</h3>
          <p className="text-xs text-neutral-500 mt-1">Select which payment methods you want to offer to your customers at checkout.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingsToggle label="Cash on Delivery (COD)" checked={form.supportsCod} onChange={(v) => set("supportsCod", v)} />
          <SettingsToggle label="Credit / Debit Card" checked={form.supportsCreditCard} onChange={(v) => set("supportsCreditCard", v)} />
          <SettingsToggle label="eSewa" checked={form.supportsEsewa} onChange={(v) => set("supportsEsewa", v)} />
          <SettingsToggle label="Khalti" checked={form.supportsKhalti} onChange={(v) => set("supportsKhalti", v)} />
          <SettingsToggle label="IPS" checked={form.supportsIps} onChange={(v) => set("supportsIps", v)} />
          <SettingsToggle label="PhonePe" checked={form.supportsPhonePay} onChange={(v) => set("supportsPhonePay", v)} />
          <SettingsToggle label="PayPay" checked={form.supportsPaypay} onChange={(v) => set("supportsPaypay", v)} />
        </div>
      </div>

      <div className="pt-6 border-t border-neutral-100">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <CreditCard size={16} /> PayPay Integration Credentials
          </h3>
          <p className="text-xs text-blue-700 mt-1.5 leading-relaxed">
            Enter your PayPay for Developers credentials. These are stored securely and used exclusively to process orders for this restaurant.
          </p>
        </div>

        <SettingsField label="Merchant ID" value={form.paypayMerchantId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("paypayMerchantId", e.target.value)} placeholder="e.g., 123456789" />
        <SettingsField label="API Key" value={form.paypayApiKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("paypayApiKey", e.target.value)} placeholder="e.g., sample_key" />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">API Secret</label>
          <input
            type={hasNewSecret ? "text" : "password"}
            value={form.paypayApiSecret}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              set("paypayApiSecret", e.target.value);
              if (!hasNewSecret && e.target.value.length > 0) setHasNewSecret(true);
            }}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none font-mono"
            placeholder="•••••••••••••••• (Leave blank to keep existing)"
          />
          <p className="text-xs text-neutral-500">For security, your existing secret is hidden. Only fill this if you need to update or rotate it.</p>
        </div>

        <div className="pt-2">
          <a href="https://developer.paypay.ne.jp/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0F6B5C] hover:underline flex items-center gap-1.5 font-medium">
            <ExternalLink size={12} /> Get credentials from PayPay for Developers
          </a>
        </div>
      </div>
    </div>
  );
}