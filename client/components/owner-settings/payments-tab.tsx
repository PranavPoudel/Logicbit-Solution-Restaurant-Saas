"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ExternalLink } from "lucide-react";
import { removeMyStripeKey } from "@/lib/api/restaurants";
import { SettingsField, SettingsToggle } from "@/components/owner-settings/settings-field";
import { SettingsForm } from "@/app/owner/(owner-dashboard)/settings/page";

interface PaymentsTabProps {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  hasNewSecret: boolean;
  setHasNewSecret: (value: boolean) => void;
  /** A Stripe key is already saved for this restaurant (the key itself is never shown). */
  hasStripeKey: boolean;
  restaurantId: string | null;
}

export function PaymentsTab({ form, set, hasNewSecret, setHasNewSecret, hasStripeKey, restaurantId }: PaymentsTabProps) {
  const queryClient = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const removeKey = useMutation({
    mutationFn: () => removeMyStripeKey(restaurantId as string),
    onSuccess: () => {
      setConfirmRemove(false);
      void queryClient.invalidateQueries({ queryKey: ["owner-restaurant", restaurantId] });
    },
  });
  const removeError = (removeKey.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;

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
            <CreditCard size={16} /> Card payments (Visa, Mastercard, JCB and more)
          </h3>
          <p className="text-xs text-blue-700 mt-1.5 leading-relaxed">
            Cards are paid on Stripe&apos;s own page, so card numbers never reach LogicBit. Paste the secret key of your Stripe account. Use a key that starts with sk_test_ while testing and sk_live_ for real payments.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stripe-secret-key" className="block text-sm font-medium text-neutral-700">
            Stripe secret key {hasStripeKey && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Saved</span>}
          </label>
          <input
            id="stripe-secret-key"
            type="password"
            autoComplete="off"
            value={form.stripeSecretKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("stripeSecretKey", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none font-mono"
            placeholder={hasStripeKey ? "•••••••••••••••• (Leave blank to keep existing)" : "sk_test_..."}
          />
          <p className="text-xs text-neutral-500">For security, a saved key is never shown again. Only fill this to save or replace it.</p>
          {hasStripeKey && (
            <div className="pt-1">
              {confirmRemove ? (
                <div role="alertdialog" aria-label="Remove the Stripe key" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs text-red-800 leading-relaxed">
                    This deletes LogicBit&apos;s copy of your key and switches card payments off. You cannot take or refund card payments until you save a key again. Your Stripe account is not changed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={removeKey.isPending}
                      onClick={() => removeKey.mutate()}
                      className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400 outline-none"
                    >
                      {removeKey.isPending ? "Removing..." : "Yes, remove the key"}
                    </button>
                    <button
                      type="button"
                      disabled={removeKey.isPending}
                      onClick={() => {
                        setConfirmRemove(false);
                        removeKey.reset();
                      }}
                      className="min-h-11 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#1B2333] outline-none"
                    >
                      Keep it
                    </button>
                  </div>
                  {removeKey.isError && (
                    <p role="alert" className="text-xs font-medium text-red-700">
                      {removeError ?? "We could not remove the key. Please try again."}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  className="min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 outline-none"
                >
                  Remove saved key
                </button>
              )}
            </div>
          )}
          {form.supportsCreditCard && !hasStripeKey && !form.stripeSecretKey.trim() && (
            <p role="alert" className="text-xs font-medium text-amber-700">Card payment is switched on but no Stripe key is saved yet, so customers cannot pay by card.</p>
          )}
        </div>

        <div className="pt-2 space-y-1.5">
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0F6B5C] hover:underline flex items-center gap-1.5 font-medium">
            <ExternalLink size={12} /> Get your key from the Stripe dashboard
          </a>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Optional but faster: in Stripe, add a webhook for the events checkout.session.completed and checkout.session.async_payment_succeeded that points to your LogicBit server at /api/v1/payments/webhooks/stripe. Without it orders are still confirmed, just when the customer returns to the site.
          </p>
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