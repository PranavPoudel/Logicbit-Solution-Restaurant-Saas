"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPlatformPermissions, createPlatformRole, Permission } from "@/lib/api/platform-staff";

export default function createPlatformRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const data = await getPlatformPermissions();
        setPermissions(data);
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, []);

  const togglePermission = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedIds.size === 0) {
      alert("Please provide a role name and select at least one permission.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createPlatformRole({
        name: name.trim(),
        permissionIds: Array.from(selectedIds)
      });
      router.push("/admin/roles");
      router.refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create role";
      alert(Array.isArray(msg) ? msg[0] : msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/roles" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; Back to Roles
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create New Role</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Finance Manager, Support Agent..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Assign Permissions ({selectedIds.size} selected)
          </label>
          
          {loading ? (
            <div className="text-sm text-gray-500 animate-pulse">Loading available permissions...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissions.map((p) => (
                <label 
                  key={p.id} 
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(p.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={selectedIds.has(p.id)}
                    onChange={() => togglePermission(p.id)}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{p.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link
            href="/admin/roles"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Role"}
          </button>
        </div>
      </form>
    </div>
  );
}