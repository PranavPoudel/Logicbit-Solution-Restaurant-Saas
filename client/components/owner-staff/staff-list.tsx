// components/owner-staff/staff-list.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";
import {
  inviteStaff,
  listStaff,
  deactivateStaff,
  listRoles,
  type StaffMember,
} from "@/lib/api/roles-permissions";

interface RoleWithPermissions {
  id: string;
  name: string;
}

export function StaffList() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", roleIds: [] as string[] });
  const [error, setError] = useState("");

  const rolesQuery = useQuery<RoleWithPermissions[]>({ queryKey: ["owner-roles"], queryFn: listRoles });
  const staffQuery = useQuery<StaffMember[]>({ queryKey: ["owner-staff"], queryFn: listStaff });

  const inviteMutation = useMutation({
    mutationFn: () => inviteStaff(form),
    onSuccess: () => {
      setForm({ name: "", email: "", password: "", phone: "", roleIds: [] });
      setError("");
      queryClient.invalidateQueries({ queryKey: ["owner-staff"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Could not add staff member. Check if email already exists.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deactivateStaff(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-staff"] }),
  });

  const roles = rolesQuery.data ?? [];
  const staff = staffQuery.data ?? [];

  function toggleRole(roleId: string) {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter((id) => id !== roleId) : [...f.roleIds, roleId],
    }));
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-[#1B2333]" />
        <h2 className="text-sm font-semibold text-neutral-900">Team Members</h2>
      </div>
      <p className="text-xs text-neutral-500 mb-4">Invite your staff and assign them the roles you created above.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.roleIds.length === 0) {
            setError("Please select at least one role for this staff member.");
            return;
          }
          inviteMutation.mutate();
        }}
        className="border border-neutral-200 rounded-xl p-5 bg-white flex flex-col gap-4 mb-8"
      >
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name</label>
            <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2333] outline-none" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address</label>
            <input type="email" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2333] outline-none" placeholder="john@restaurant.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Temporary Password</label>
            <input type="password" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2333] outline-none" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} minLength={8} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Phone (Optional)</label>
            <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2333] outline-none" placeholder="e.g. 9841000000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-2">Assign Roles</label>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button key={role.id} type="button" onClick={() => toggleRole(role.id)} className={`flex items-center gap-2 text-xs border rounded-full px-3 py-1.5 transition-all ${form.roleIds.includes(role.id) ? "bg-[#1B2333] text-white border-[#1B2333]" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"}`}>
                {form.roleIds.includes(role.id) && <ShieldCheck size={12} />}
                {role.name}
              </button>
            ))}
            {roles.length === 0 && <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">Create a role above first before adding staff.</p>}
          </div>
        </div>

        <button type="submit" disabled={inviteMutation.isPending} className="self-start bg-[#1B2333] text-white text-sm font-medium rounded-lg px-5 py-2.5 disabled:opacity-50 flex items-center gap-2">
          {inviteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {inviteMutation.isPending ? "Adding Member..." : "Add Staff Member"}
        </button>
      </form>

      {staffQuery.isLoading ? (
        <p className="text-sm text-neutral-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading staff...</p>
      ) : staff.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-xl p-8 text-center">
          <p className="text-sm text-neutral-500">No staff members added yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {staff.map((member) => (
            <div key={member.id} className="border border-neutral-200 rounded-xl p-4 bg-white flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{member.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{member.email} {member.phone && `· ${member.phone}`}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {member.roles && member.roles.length > 0 ? (
                    member.roles.map((roleName, idx) => (
                      <span key={idx} className="text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{roleName}</span>
                    ))
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">No Roles</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to deactivate ${member.name}? They will lose access immediately.`)) {
                    deactivateMutation.mutate(member.id);
                  }
                }}
                disabled={deactivateMutation.isPending}
                className="min-h-11 text-xs font-medium text-red-600 hover:bg-red-50 px-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Deactivate
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}