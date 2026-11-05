"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, Loader2, Send, Sparkles } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { ownerEmailsApi, type EmailOrder } from "@/lib/api/owner-emails";
import { getErrorMessage } from "@/lib/utils/error";
import { AudiencePicker, type Audience } from "@/components/owner-email/audience-picker";
import { EmailPreview } from "@/components/owner-email/email-preview";
import { OrderPicker } from "@/components/owner-email/order-picker";
import { RecentOrders } from "@/components/owner-email/recent-orders";

const SUBJECT_MAX = 120;
const BODY_MAX = 5000;
const ORDER_SUBJECT_PREFIX = "About your order ";

const templates = [
  {
    label: "Weekend offer",
    subject: "A little something for your weekend",
    body: "Hi there,\n\nThis weekend only, enjoy 20% off your order with us. Just show this email or mention it when you order.\n\nHope to see you soon!",
  },
  {
    label: "New menu item",
    subject: "Something new just landed on our menu",
    body: "Hi there,\n\nWe've just added a new dish to our menu and we'd love for you to be one of the first to try it.\n\nCome by or order online today.",
  },
  {
    label: "Thank you",
    subject: "Thank you for ordering with us",
    body: "Hi there,\n\nThank you for being one of our regulars. It means a lot to a small kitchen like ours, and we hope to keep serving you well.",
  },
  {
    label: "Closing notice",
    subject: "A quick note about our opening hours",
    body: "Hi there,\n\nWe'll be closed for a short time and will be back soon. Thank you for your patience and support.",
  },
];

const inputBase =
  "min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2";

const inputState = (hasError: boolean) =>
  hasError
    ? "border-red-400 focus-visible:ring-red-200"
    : "border-neutral-200 focus-visible:border-[#E3A008] focus-visible:ring-[#E3A008]/30";

export default function OwnerEmailCustomersPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();

  const [audience, setAudience] = useState<Audience>("ALL");
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [touched, setTouched] = useState({ customer: false, subject: false, body: false });
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const customersQuery = useQuery({
    queryKey: ["owner-email-customers", restaurantId],
    queryFn: () => ownerEmailsApi.customers(restaurantId as string),
    enabled: !!restaurantId,
  });

  const ordersQuery = useQuery({
    queryKey: ["owner-email-orders", restaurantId, customerId],
    queryFn: () => ownerEmailsApi.orders(restaurantId as string, customerId),
    enabled: !!restaurantId && audience === "ONE" && !!customerId,
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["owner-email-recent-orders", restaurantId],
    queryFn: () => ownerEmailsApi.recentOrders(restaurantId as string),
    enabled: !!restaurantId,
  });

  const historyQuery = useQuery({
    queryKey: ["owner-email-history", restaurantId],
    queryFn: () => ownerEmailsApi.history(restaurantId as string),
    enabled: !!restaurantId,
    refetchInterval: (query) => (query.state.data?.some((h) => h.state === "SENDING") ? 3000 : false),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      ownerEmailsApi.send(restaurantId as string, {
        audience,
        customerId: audience === "ONE" ? customerId : undefined,
        orderId: audience === "ONE" && orderId ? orderId : undefined,
        subject: subject.trim(),
        body: body.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-email-history", restaurantId] });
      setSubject("");
      setBody("");
      setCustomerId("");
      setOrderId("");
      setTouched({ customer: false, subject: false, body: false });
      setConfirming(false);
    },
  });

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  const customers = customersQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const selected = customers.find((c) => c.id === customerId);
  const customerOrders = ordersQuery.data ?? [];
  const selectedOrder = audience === "ONE" ? customerOrders.find((o) => o.id === orderId) : undefined;
  const reachable = customers.filter((c) => !c.unsubscribed).length;
  const recipientCount = audience === "ALL" ? reachable : selected ? 1 : 0;
  const recipientLabel =
    audience === "ALL"
      ? `All customers (${reachable})`
      : selected
        ? `${selected.name} <${selected.email}>`
        : "Choose a customer";

  const errors = {
    customer: audience === "ONE" && !customerId ? "Choose who this email is for." : "",
    subject: subject.trim() ? "" : "Add a subject so customers know what this is about.",
    body: body.trim() ? "" : "Write a message before sending.",
  };
  const showError = (key: keyof typeof errors) => (touched[key] ? errors[key] : "");
  const touch = (key: keyof typeof errors) => setTouched((t) => ({ ...t, [key]: true }));

  const edit = <T,>(setter: (v: T) => void) => (value: T) => {
    if (sendMutation.isSuccess || sendMutation.isError) sendMutation.reset();
    setConfirming(false);
    setter(value);
  };

  const isAutoSubject = (value: string) => value.startsWith(ORDER_SUBJECT_PREFIX);

  const pickCustomer = (id: string) => {
    edit(setCustomerId)(id);
    setOrderId("");
    if (isAutoSubject(subject)) setSubject("");
  };

  const pickOrder = (id: string) => {
    edit(setOrderId)(id);
    const order = customerOrders.find((o) => o.id === id);
    if (order && (!subject.trim() || isAutoSubject(subject))) setSubject(`${ORDER_SUBJECT_PREFIX}${order.number}`);
    else if (!order && isAutoSubject(subject)) setSubject("");
  };

  const pickRecentOrder = (order: EmailOrder) => {
    edit(setAudience)("ONE");
    setCustomerId(order.customerId);
    setOrderId(order.id);
    if (!subject.trim() || isAutoSubject(subject)) setSubject(`${ORDER_SUBJECT_PREFIX}${order.number}`);
    document.getElementById("email-subject")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const applyTemplate = (t: (typeof templates)[number]) => {
    edit(setSubject)(t.subject);
    setBody(t.body);
  };

  const handleSend = () => {
    setTouched({ customer: true, subject: true, body: true });
    const firstInvalid = errors.customer
      ? "email-customer-search"
      : errors.subject
        ? "email-subject"
        : errors.body
          ? "email-body"
          : null;
    if (firstInvalid) return document.getElementById(firstInvalid)?.focus();
    if (audience === "ALL" && !confirming) return setConfirming(true);
    sendMutation.mutate();
  };

  const sent = sendMutation.data;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Email Customers</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Send an update or offer to everyone who has ordered from you, or write to one customer.
        </p>
      </div>

      <div aria-live="polite">
        {sendMutation.isSuccess && sent && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                {sent.audience === "ALL"
                  ? `Sending to ${sent.recipientCount} customers`
                  : sent.failedCount > 0
                    ? `Couldn't deliver to ${sent.recipientLabel}`
                    : `Email sent to ${sent.recipientLabel}`}
              </p>
              <p className="text-sm text-green-800">
                {sent.audience === "ALL"
                  ? `“${sent.subject}” is going out a few at a time. Watch the progress under Recently sent.`
                  : sent.failedCount > 0
                    ? `“${sent.subject}” could not be delivered.`
                    : `“${sent.subject}” is on its way.`}
              </p>
            </div>
          </div>
        )}
        {sendMutation.isError && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-900">Couldn&apos;t send your email</p>
              <p className="text-sm text-red-800">
                {getErrorMessage(sendMutation.error, "Nothing was sent. Check your connection and try again.")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="space-y-6 rounded-xl border border-neutral-200 bg-white p-5 sm:p-6"
        >
          <AudiencePicker
            audience={audience}
            onAudienceChange={edit(setAudience)}
            customers={customers}
            isLoading={customersQuery.isLoading}
            customerId={customerId}
            onCustomerChange={pickCustomer}
            customerError={showError("customer")}
            onCustomerBlur={() => touch("customer")}
          />

          {audience === "ONE" && customerId && (
            <OrderPicker
              orders={customerOrders}
              isLoading={ordersQuery.isLoading}
              orderId={orderId}
              onOrderChange={pickOrder}
            />
          )}

          <div className="space-y-3 border-t border-neutral-100 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                <Sparkles size={16} aria-hidden="true" className="text-[#E3A008]" />
                Start from a template
              </span>
              <span className="text-xs text-neutral-400">Optional. You can edit it after.</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="min-h-11 rounded-full border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-[#E3A008] hover:bg-[#E3A008]/10 motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 border-t border-neutral-100 pt-6">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="email-subject" className="text-sm font-semibold text-neutral-900">
                  Subject
                </label>
                <span className="text-xs tabular-nums text-neutral-400">
                  {subject.length}/{SUBJECT_MAX}
                </span>
              </div>
              <input
                id="email-subject"
                value={subject}
                maxLength={SUBJECT_MAX}
                onChange={(e) => edit(setSubject)(e.target.value)}
                onBlur={() => touch("subject")}
                aria-invalid={!!showError("subject")}
                aria-describedby={showError("subject") ? "email-subject-error" : undefined}
                placeholder="e.g. 20% off this weekend"
                className={`${inputBase} ${inputState(!!showError("subject"))}`}
              />
              {showError("subject") && (
                <p id="email-subject-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.subject}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="email-body" className="text-sm font-semibold text-neutral-900">
                  Message
                </label>
                <span className="text-xs tabular-nums text-neutral-400">
                  {body.length}/{BODY_MAX}
                </span>
              </div>
              <textarea
                id="email-body"
                value={body}
                rows={9}
                maxLength={BODY_MAX}
                onChange={(e) => edit(setBody)(e.target.value)}
                onBlur={() => touch("body")}
                aria-invalid={!!showError("body")}
                aria-describedby={showError("body") ? "email-body-error" : undefined}
                placeholder="Write your message…"
                className={`${inputBase} resize-y leading-relaxed ${inputState(!!showError("body"))}`}
              />
              {showError("body") && (
                <p id="email-body-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.body}
                </p>
              )}
            </div>
          </div>

          {confirming ? (
            <div
              role="group"
              aria-label="Confirm send"
              className="flex flex-col gap-3 rounded-xl border border-[#E3A008]/50 bg-[#E3A008]/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-neutral-900">
                <span className="font-semibold">Send to all {recipientCount} customers?</span>{" "}
                This can&apos;t be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-11 flex-1 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  ref={confirmRef}
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 text-sm font-medium text-white hover:bg-[#1f2937] disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2 sm:flex-none"
                >
                  {sendMutation.isPending ? (
                    <Loader2 size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Send size={16} aria-hidden="true" />
                  )}
                  {sendMutation.isPending ? "Sending…" : `Yes, send to ${recipientCount}`}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-500">
                {recipientCount > 0
                  ? `Will be sent to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}`
                  : "Choose a customer to continue"}
              </p>
              <button
                type="submit"
                disabled={sendMutation.isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1f2937] active:scale-[0.98] disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2"
              >
                {sendMutation.isPending ? (
                  <Loader2 size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                ) : (
                  <Send size={16} aria-hidden="true" />
                )}
                {sendMutation.isPending ? "Sending…" : audience === "ALL" ? "Review and send" : "Send email"}
              </button>
            </div>
          )}
        </form>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <EmailPreview recipient={recipientLabel} subject={subject.trim()} body={body.trim()} order={selectedOrder} />

          <RecentOrders
            orders={recentOrdersQuery.data ?? []}
            isLoading={recentOrdersQuery.isLoading}
            activeOrderId={orderId}
            onPick={pickRecentOrder}
          />

          <section aria-label="Recently sent" className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Clock size={16} aria-hidden="true" className="text-neutral-400" />
              Recently sent
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Emails you send will be listed here so you can see what went out and when.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {history.map((h) => (
                  <li key={h.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{h.subject}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {h.recipientLabel}
                      {h.audience === "ALL" ? ` (${h.recipientCount})` : ""}
                      {h.state === "SENDING" ? ` · Sending ${h.sentCount + h.failedCount} of ${h.recipientCount}` : h.failedCount > 0 ? ` · ${h.sentCount} sent, ${h.failedCount} failed` : ""}
                      {h.orderNumber ? ` · Order ${h.orderNumber}` : ""} ·{" "}
                      {new Date(h.sentAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
