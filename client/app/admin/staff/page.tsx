"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlatformStaff, updatePlatformStaffStatus, PlatformStaff } from "@/lib/api/platform-staff";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<PlatformStaff[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await getPlatformStaff();
      setStaffList(data);
    } catch (error) {
      console.error("Failed to load staff:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) return;

    try {
      // Optimistic UI update or just reload
      await updatePlatformStaffStatus(id, !currentStatus);
      await loadStaff();
    } catch (error: any) {
      alert(error?.response?.data?.message || `Failed to ${action} staff member`);
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Staff</h2>
          <p className="text-sm text-gray-500 mt-1">Manage platform administrators and support agents</p>
        </div>

        <Link 
          href="/admin/staff/create"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          + Add Staff Member
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading staff members...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Email</th>
                <th className="p-4 font-semibold text-gray-600">Role</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {staff.name}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {staff.email}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {staff.role ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                          {staff.role.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No role</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        staff.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(staff.id, staff.isActive, staff.name)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                          staff.isActive 
                            ? "bg-red-50 text-red-600 hover:bg-red-100" 
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {staff.isActive ? "Deactivate" : "Activate"}
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