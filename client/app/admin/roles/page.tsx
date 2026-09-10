"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listPlatformRoles } from "@/lib/api/platform-admin";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPlatformRoles()
      .then((res) => {
        // Fallback checks depending on if NestJS wraps the array in a 'data' property
        setRoles(res?.data || res || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
        <Link href="/admin/roles/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Create Role
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading roles...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Role Name</th>
                <th className="p-4 font-semibold text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{role.name}</td>
                    <td className="p-4 text-gray-600">{role.description || "N/A"}</td>
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