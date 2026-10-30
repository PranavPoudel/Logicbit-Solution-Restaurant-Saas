"use client";

import { useState, FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { City, CityInput, createCity, deleteCity, getPlatformCities, updateCity } from "@/lib/api/cities";
import { DynamicMapPicker } from "@/components/map/dynamic-map-picker";

type Form = { name: string; nameJa: string; country: string; latitude: number; longitude: number; displayOrder: number; isActive: boolean };

const errorMessage = (error: unknown, fallback: string) => (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() || fallback;

export default function CitiesPage() {
  const { data, isLoading: loading, refetch } = useQuery({ queryKey: ["admin-cities"], queryFn: getPlatformCities });
  const cities = Array.isArray(data) ? data : [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({ name: "", nameJa: "", country: "", latitude: 0, longitude: 0, displayOrder: 0, isActive: true });

  const openModal = (city?: City) => {
    const home = cities[0];
    setEditingId(city?.id ?? null);
    setForm(
      city
        ? { name: city.name, nameJa: city.nameJa ?? "", country: city.country, latitude: city.latitude, longitude: city.longitude, displayOrder: city.displayOrder, isActive: city.isActive }
        : { name: "", nameJa: "", country: home?.country ?? "", latitude: home?.latitude ?? 0, longitude: home?.longitude ?? 0, displayOrder: cities.length, isActive: true }
    );
    setIsModalOpen(true);
  };

  const setField = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input: CityInput = { ...form, name: form.name.trim(), nameJa: form.nameJa.trim(), country: form.country.trim().toUpperCase() };
    try {
      setIsSubmitting(true);
      if (editingId) await updateCity(editingId, input);
      else await createCity(input);
      setIsModalOpen(false);
      await refetch();
    } catch (error) {
      alert(errorMessage(error, "Failed to save city"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this city? Restaurants keep their city text and will show as an unlisted city.")) return;
    try {
      await deleteCity(id);
      await refetch();
    } catch (error) {
      alert(errorMessage(error, "Failed to delete city"));
    }
  };

  const input = "w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cities</h2>
          <p className="text-sm text-gray-500 mt-1">Cities shown on the home page map and used for the hero. The first active city is the default when a visitor&apos;s location is unknown.</p>
        </div>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Add City
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse text-gray-500">Loading cities...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">Order</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Japanese</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Country</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Coordinates</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-500">{c.displayOrder}</td>
                  <td className="p-4 font-medium text-gray-900">{c.name}</td>
                  <td className="p-4 text-sm text-gray-700">{c.nameJa || "-"}</td>
                  <td className="p-4 text-sm text-gray-500 font-mono">{c.country}</td>
                  <td className="p-4 text-sm text-gray-500 font-mono">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</td>
                  <td className="p-4 text-sm">{c.isActive ? <span className="text-green-600">Active</span> : <span className="text-gray-400">Hidden</span>}</td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openModal(c)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {cities.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No cities yet. Add your first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg my-auto">
            <h3 className="text-lg font-bold mb-4">{editingId ? "Edit City" : "Add City"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                  <input required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Tokyo" className={`${input} mt-1`} />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Japanese name
                  <input value={form.nameJa} onChange={(e) => setField("nameJa", e.target.value)} placeholder="e.g. 東京" className={`${input} mt-1`} />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Country code
                  <input required minLength={2} maxLength={2} value={form.country} onChange={(e) => setField("country", e.target.value.toUpperCase())} placeholder="JP" className={`${input} mt-1 font-mono`} />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Order
                  <input type="number" min={0} value={form.displayOrder} onChange={(e) => setField("displayOrder", Number(e.target.value))} className={`${input} mt-1`} />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} className="h-4 w-4" />
                  Active
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Location. Drag the marker to the city centre.</p>
                <DynamicMapPicker lat={form.latitude} lng={form.longitude} onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))} />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="block text-xs text-gray-500">
                    Latitude
                    <input type="number" step="any" required min={-90} max={90} value={form.latitude} onChange={(e) => setField("latitude", Number(e.target.value))} className={`${input} mt-1 font-mono`} />
                  </label>
                  <label className="block text-xs text-gray-500">
                    Longitude
                    <input type="number" step="any" required min={-180} max={180} value={form.longitude} onChange={(e) => setField("longitude", Number(e.target.value))} className={`${input} mt-1 font-mono`} />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
