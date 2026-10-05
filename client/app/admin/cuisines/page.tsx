"use client";

import { useEffect, useState, FormEvent } from "react";
import { 
  getPlatformCuisines, 
  createCuisine, 
  updateCuisine, 
  deleteCuisine, 
  Cuisine 
} from "@/lib/api/cuisines";

export default function CuisinesPage() {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cuisineName, setCuisineName] = useState("");

  const loadCuisines = async () => {
    try {
      setLoading(true);
      const data = await getPlatformCuisines();
      setCuisines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load cuisines", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuisines();
  }, []);

  const openModal = (cuisine?: Cuisine) => {
    if (cuisine) {
      setEditingId(cuisine.id);
      setCuisineName(cuisine.name);
    } else {
      setEditingId(null);
      setCuisineName("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cuisineName.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateCuisine(editingId, { name: cuisineName });
      } else {
        await createCuisine({ name: cuisineName });
      }
      setIsModalOpen(false);
      await loadCuisines();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to save cuisine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cuisine?")) return;
    try {
      await deleteCuisine(id);
      await loadCuisines();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to delete cuisine");
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuisines</h2>
          <p className="text-sm text-gray-500 mt-1">Manage platform-wide food categories.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Add Cuisine
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse text-gray-500">Loading cuisines...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Slug</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cuisines.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{c.name}</td>
                  <td className="p-4 text-sm text-gray-500 font-mono">{c.slug || '-'}</td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openModal(c)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {cuisines.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-gray-500">No cuisines found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">{editingId ? "Edit Cuisine" : "Add Cuisine"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                required
                value={cuisineName}
                onChange={(e) => setCuisineName(e.target.value)}
                placeholder="e.g. Italian, Fast Food"
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-6"
              />
              <div className="flex justify-end gap-3">
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