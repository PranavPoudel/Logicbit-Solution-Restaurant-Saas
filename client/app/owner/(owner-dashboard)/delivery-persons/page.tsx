// app/owner/(owner-dashboard)/delivery-persons/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  addDeliveryPerson,
  listDeliveryPersons,
} from "@/lib/api/delivery-persons";
import { useOwnerAuthStore } from "@/store/owner-auth-store";

interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  vehicleType?: string | null;
  isAvailable?: boolean;
  isActive?: boolean;
  tenantId?: string | null; // ✅ Added to distinguish dedicated vs. freelance
}

export default function DeliveryPersonsPage() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    vehicleType: "",
  });

  async function loadDeliveryPersons() {
    try {
      setLoading(true);
      setError("");
      const data = await listDeliveryPersons();
      setDeliveryPersons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load delivery persons:", err);
      setError("Failed to load delivery persons.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const store = useOwnerAuthStore.getState();
    if (!store.accessToken || !store.activeRestaurantId) {
      console.warn("Auth or Restaurant ID not ready yet. Skipping load.");
      setLoading(false);
      return;
    }
    loadDeliveryPersons();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await addDeliveryPerson({
        name: form.name,
        phone: form.phone,
        password: form.password,
        vehicleType: form.vehicleType || undefined,
      });
      setForm({ name: "", phone: "", password: "", vehicleType: "" });
      setShowForm(false);
      await loadDeliveryPersons();
    } catch (err) {
      console.error("Failed to add delivery person:", err);
      setError("Failed to add delivery person. Please check the details.");
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ Split the list into two groups for the UI
  const dedicatedPersons = deliveryPersons.filter((p) => p.tenantId !== null);
  const freelancePersons = deliveryPersons.filter((p) => p.tenantId === null);

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Delivery Persons
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your dedicated delivery staff and view available freelance riders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {showForm ? "Cancel" : "+ Add Dedicated Delivery Person"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">
            Add Dedicated Delivery Person
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Phone</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Vehicle Type</label>
              <input
                type="text"
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                placeholder="e.g. Bike, Scooter, Car"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Delivery Person"}
            </button>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          Loading delivery persons...
        </div>
      )}

      {/* ✅ Section 1: Dedicated Staff */}
      {!loading && (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900">
              Your Delivery Team
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Delivery persons hired directly by your restaurant.
            </p>
          </div>

          {dedicatedPersons.length === 0 ? (
            <div className="p-10 text-center text-sm text-neutral-500">
              No dedicated delivery persons found. Add one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-neutral-600">Name</th>
                    <th className="px-6 py-3 font-medium text-neutral-600">Phone</th>
                    <th className="px-6 py-3 font-medium text-neutral-600">Vehicle</th>
                    <th className="px-6 py-3 font-medium text-neutral-600">Availability</th>
                    <th className="px-6 py-3 font-medium text-neutral-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dedicatedPersons.map((person) => (
                    <tr key={person.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-6 py-4 font-medium text-neutral-900">{person.name}</td>
                      <td className="px-6 py-4 text-neutral-600">{person.phone}</td>
                      <td className="px-6 py-4 text-neutral-600">{person.vehicleType || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={person.isAvailable ? "text-green-600" : "text-neutral-500"}>
                          {person.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={person.isActive ? "text-green-600" : "text-red-500"}>
                          {person.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ✅ Section 2: Freelance Riders */}
      {!loading && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50">
          <div className="border-b border-teal-200 px-6 py-4">
            <h2 className="text-base font-semibold text-teal-900">
              Available Freelance Riders
            </h2>
            <p className="text-xs text-teal-700 mt-1">
              Independent delivery persons registered on LogicBit who are currently online and available for gig work.
            </p>
          </div>

          {freelancePersons.length === 0 ? (
            <div className="p-10 text-center text-sm text-teal-700/70">
              No freelance riders are currently available in your area.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-teal-200 bg-teal-100/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-teal-800">Name</th>
                    <th className="px-6 py-3 font-medium text-teal-800">Phone</th>
                    <th className="px-6 py-3 font-medium text-teal-800">Vehicle</th>
                    <th className="px-6 py-3 font-medium text-teal-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {freelancePersons.map((person) => (
                    <tr key={person.id} className="border-b border-teal-100 last:border-0 bg-white/50">
                      <td className="px-6 py-4 font-medium text-neutral-900">
                        {person.name} 
                        <span className="ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                          Freelance
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">{person.phone}</td>
                      <td className="px-6 py-4 text-neutral-600">{person.vehicleType || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          ● Available
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}