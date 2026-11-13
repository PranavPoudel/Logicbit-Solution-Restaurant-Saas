"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Truck } from "lucide-react";
import { getMyUberDirect, removeMyUberDirect, saveMyUberDirect, type UberDirectInput } from "@/lib/api/restaurants";

const EMPTY: UberDirectInput = { clientId: "", clientSecret: "", customerId: "", signingKey: "" };
const inputClass = "w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none font-mono";
const secondaryButton =
  "min-h-11 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#1B2333] outline-none";

const messageOf = (error: unknown, fallback: string) => (error as { response?: { data?: { message?: string | string[] } } } | null)?.response?.data?.message?.toString() ?? fallback;

/**
 * The restaurant's own Uber Direct account, so Uber bills the restaurant and not LogicBit. It has its own Save button
 * because saving checks the login with Uber first. The secrets are never shown again once saved.
 */
export function UberDirectCard({ restaurantId }: { restaurantId: string | null }) {
  const queryClient = useQueryClient();
  const queryKey = ["owner-uber-direct", restaurantId];
  const status = useQuery({ queryKey, queryFn: () => getMyUberDirect(restaurantId as string), enabled: !!restaurantId });

  const [form, setForm] = useState<UberDirectInput>(EMPTY);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const save = useMutation({
    mutationFn: () => saveMyUberDirect(restaurantId as string, { clientId: form.clientId.trim(), clientSecret: form.clientSecret.trim(), customerId: form.customerId.trim(), signingKey: form.signingKey.trim() }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      setForm(EMPTY);
    },
  });
  const remove = useMutation({
    mutationFn: () => removeMyUberDirect(restaurantId as string),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      setConfirmRemove(false);
    },
  });

  const data = status.data;
  const complete = Object.values(form).every((value) => value.trim().length > 0);

  const field = (key: keyof UberDirectInput, label: string, opts: { secret?: boolean; placeholder?: string } = {}) => (
    <div className="space-y-1.5">
      <label htmlFor={`uber-${key}`} className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={`uber-${key}`}
        type={opts.secret ? "password" : "text"}
        autoComplete="off"
        spellCheck={false}
        value={form[key]}
        onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
        className={inputClass}
        placeholder={opts.placeholder}
      />
    </div>
  );

  return (
    <div className="pt-6 border-t border-neutral-100">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
          <Truck size={16} /> Uber Direct couriers
        </h3>
        <p className="text-xs text-blue-700 mt-1.5 leading-relaxed">
          Use Uber couriers for delivery orders outside your own delivery radius. This uses your own Uber Direct account, so Uber bills you, not LogicBit. Without it, those orders are offered to the delivery partners on LogicBit.
        </p>
      </div>

      {status.isLoading && <p className="text-sm text-neutral-500">Loading...</p>}
      {status.isError && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {messageOf(status.error, "We could not load the Uber Direct settings.")}
        </p>
      )}

      {data?.connected && (
        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-neutral-700">
            Uber Direct account <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Connected</span>
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-neutral-600">
            <div>
              <dt className="font-medium text-neutral-500">Client ID</dt>
              <dd className="font-mono break-all">{data.clientId}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-500">Customer ID</dt>
              <dd className="font-mono break-all">{data.customerId}</dd>
            </div>
          </dl>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-700">Webhook address to give Uber</p>
            <code className="block rounded-lg bg-neutral-100 px-3 py-2 text-xs break-all select-all">{data.webhookUrl ?? data.webhookPath}</code>
            {!data.webhookUrl && <p className="text-xs text-neutral-500">Put your LogicBit server address in front of this path.</p>}
          </div>
          <p className="text-xs text-neutral-500">To change the details, remove the account and add it again.</p>
          {!confirmRemove && (
            <button type="button" onClick={() => setConfirmRemove(true)} className="min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 outline-none">
              Remove Uber account
            </button>
          )}
          {confirmRemove && (
            <div role="alertdialog" aria-label="Remove the Uber Direct account" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-800 leading-relaxed">
                Delivery orders will go back to the delivery partners on LogicBit. Your Uber account is not changed.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={remove.isPending} onClick={() => remove.mutate()} className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400 outline-none">
                  {remove.isPending ? "Removing..." : "Yes, remove it"}
                </button>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => {
                    setConfirmRemove(false);
                    remove.reset();
                  }}
                  className={secondaryButton}
                >
                  Keep it
                </button>
              </div>
              {remove.isError && (
                <p role="alert" className="text-xs font-medium text-red-700">
                  {messageOf(remove.error, "We could not remove the account. Please try again.")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {data && !data.connected && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (complete) save.mutate();
          }}
        >
          <ol className="list-decimal pl-5 space-y-1 text-xs text-neutral-600 leading-relaxed">
            <li>In your Uber Direct dashboard, open the Developer tab and copy the Client ID, Client Secret and Customer ID.</li>
            <li>Still in the dashboard, add a webhook for delivery status updates pointing at the address shown here once you save, and copy its signing key.</li>
            <li>Paste all four below. We check them with Uber before saving.</li>
          </ol>
          {field("clientId", "Client ID")}
          {field("clientSecret", "Client secret", { secret: true })}
          {field("customerId", "Customer ID")}
          {field("signingKey", "Webhook signing key", { secret: true })}
          <p className="text-xs text-neutral-500">For security, the secret and the signing key are never shown again after saving.</p>
          {save.isError && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {messageOf(save.error, "We could not save the Uber Direct account. Please try again.")}
            </p>
          )}
          <button type="submit" disabled={!complete || save.isPending} className="min-h-11 rounded-lg bg-[#1B2333] px-4 text-sm font-medium text-white hover:bg-[#252f45] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#1B2333] focus-visible:ring-offset-2 outline-none">
            {save.isPending ? "Checking with Uber..." : "Check and save"}
          </button>
        </form>
      )}

      <div className="pt-3">
        <a href="https://developer.uber.com/docs/deliveries/get-started" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0F6B5C] hover:underline flex items-center gap-1.5 font-medium">
          <ExternalLink size={12} /> How to get your Uber Direct details
        </a>
        <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">Couriers need your restaurant&apos;s phone number, address and map location (General and Location tabs) and the customer&apos;s phone number.</p>
      </div>
    </div>
  );
}
