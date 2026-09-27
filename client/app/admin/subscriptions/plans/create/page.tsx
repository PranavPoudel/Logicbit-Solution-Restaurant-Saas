"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSubscriptionPlan } from "@/lib/api/subscriptions";

export default function CreatePlanPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !durationDays) return;

    try {
      setIsSubmitting(true);
      await createSubscriptionPlan({
        name: name.trim(),
        priceMonthly: parseFloat(price), 
        durationDays: parseInt(durationDays, 10),
      });
      router.push("/admin/subscriptions/plans");
      router.refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create plan";
      alert(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/subscriptions/plans" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; Back to Plans
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create Subscription Plan</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plan Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Premium Monthly"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Price (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="30"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link
            href="/admin/subscriptions/plans"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !price || !durationDays}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}