"use client";
import { useEffect, useState, FormEvent } from "react";
import { platformApiClient } from "@/lib/api/platform-client";

export default function CuisinesPage() {
  const [cuisines, setCuisines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCuisine, setNewCuisine] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadCuisines = async () => {
    try {
      setLoading(true);
      const { data } = await platformApiClient.get("/platform-admin/cuisines");
      
      setCuisines(data?.data || data || []);
    } catch (err) {
      console.error("Failed to load cuisines", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuisines();
  }, []);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCuisine.trim()) return;

    const generatedSlug = newCuisine
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") 
      .replace(/^-+|-+$/g, "");   

    try {
      setIsAdding(true);
      await platformApiClient.post("/platform-admin/cuisines", {
        name: newCuisine.trim(),
        slug: generatedSlug,
        isActive: true, 
      });
      setNewCuisine("");
      loadCuisines();    
    } catch (err: any) {
      const errorMsg = Array.isArray(err?.response?.data?.message) 
        ? err.response.data.message[0] 
        : err?.response?.data?.message;
        
      alert(errorMsg || "Failed to create cuisine");
    } finally {
      setIsAdding(false);
    }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await platformApiClient.delete(`/platform-admin/cuisines/${id}`);
      loadCuisines(); // Refresh the list
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete cuisine");
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuisines</h2>
          <p className="text-sm text-gray-500 mt-1">Manage food categories for restaurants</p>
        </div>

        {/* Inline Create Form */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g. Italian, Mexican..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm w-64"
            value={newCuisine}
            onChange={(e) => setNewCuisine(e.target.value)}
          />
          <button
            type="submit"
            disabled={isAdding || !newCuisine.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {isAdding ? "Adding..." : "Add Cuisine"}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading cuisines...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">ID</th>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cuisines.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No cuisines found. Add one above!
                  </td>
                </tr>
              ) : (
                cuisines.map((cuisine) => (
                  <tr key={cuisine.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-500 font-mono">
                      {/* Truncating ID to make it look cleaner in the UI */}
                      {cuisine.id.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {cuisine.name}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleDelete(cuisine.id, cuisine.name)}
                        className="text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium px-3 py-1.5 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}