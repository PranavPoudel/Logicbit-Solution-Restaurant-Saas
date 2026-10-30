"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlatformRoles, Role } from "@/lib/api/platform-staff";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await getPlatformRoles();
        setRoles(data);
      } catch (error) {
        console.error("Failed to load roles:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRoles();
  }, []);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">Manage staff access levels across the platform</p>
        </div>

        <Link 
          href="/admin/roles/create"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + Create New Role
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading roles...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600 w-1/3">Role Name</th>
                <th className="p-4 font-semibold text-gray-600">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-gray-500">
                    No roles found. Create one to get started!
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {role.name}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {role.permissions?.length > 0 ? (
                          role.permissions.map((p: any, idx) => (
                            <span 
                              key={p.id || idx} 
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100"
                            >
                              {p.permission?.name || p.name || "Unknown"}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                        )}
                      </div>
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