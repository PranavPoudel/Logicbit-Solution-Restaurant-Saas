// app/(owner-dashboard)/staff/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  createRole,
  deleteRole,
  listRoles,
  listPermissions,
  addPermissionToRole,
  removePermissionFromRole,
  inviteStaff,
  listStaff,
  deactivateStaff,
  type StaffMember,
} from "@/lib/api/roles-permissions";

interface RoleWithPermissions {
  id: string;
  name: string;
  permissions: { permission: { id: string; name: string } }[];
}

interface Permission {
  id: string;
  name: string;
  description?: string;
}

function RoleBuilder() {
  const queryClient = useQueryClient();
  const [newRoleName, setNewRoleName] = useState("");
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  const rolesQuery = useQuery<RoleWithPermissions[]>({
    queryKey: ["owner-roles"],
    queryFn: listRoles,
  });

  const permissionsQuery = useQuery<Permission[]>({
    queryKey: ["owner-permissions"],
    queryFn: listPermissions,
  });

  const createRoleMutation = useMutation({
    mutationFn: () => createRole({ name: newRoleName }),
    onSuccess: () => {
      setNewRoleName("");
      queryClient.invalidateQueries({ queryKey: ["owner-roles"] });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-roles"] }),
  });

  const togglePermissionMutation = useMutation({
    mutationFn: ({
      roleId,
      permissionId,
      hasIt,
    }: {
      roleId: string;
      permissionId: string;
      hasIt: boolean;
    }) =>
      hasIt
        ? removePermissionFromRole(roleId, permissionId)
        : addPermissionToRole(roleId, permissionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-roles"] }),
  });

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];

  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-neutral-900 mb-1">Roles</h2>
      <p className="text-xs text-neutral-500 mb-3">
        Create roles and choose which permissions each one grants. Assign
        roles to staff below.
      </p>

      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (newRoleName.trim()) createRoleMutation.mutate();
        }}
      >
        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm flex-1"
          placeholder="New role name, e.g. Cashier"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
        />
        <button
          type="submit"
          disabled={createRoleMutation.isPending}
          className="bg-neutral-900 text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
        >
          Add role
        </button>
      </form>

      {rolesQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading roles...</p>
      ) : roles.length === 0 ? (
        <p className="text-sm text-neutral-400">No roles yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {roles.map((role) => {
            const isExpanded = expandedRoleId === role.id;
            const grantedIds = new Set(role.permissions.map((p) => p.permission.id));

            return (
              <div key={role.id} className="border border-neutral-200 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-neutral-900"
                    onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                  >
                    {role.name}{" "}
                    <span className="text-neutral-400 font-normal">
                      ({role.permissions.length} permission
                      {role.permissions.length === 1 ? "" : "s"})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRoleMutation.mutate(role.id)}
                    className="text-neutral-400 hover:text-red-500"
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-100 px-4 py-3 grid grid-cols-2 gap-2">
                    {permissions.map((permission) => {
                      const hasIt = grantedIds.has(permission.id);
                      return (
                        <label
                          key={permission.id}
                          className="flex items-center gap-2 text-xs text-neutral-700"
                        >
                          <input
                            type="checkbox"
                            checked={hasIt}
                            onChange={() =>
                              togglePermissionMutation.mutate({
                                roleId: role.id,
                                permissionId: permission.id,
                                hasIt,
                              })
                            }
                          />
                          {permission.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StaffList() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    roleIds: [] as string[],
  });
  const [error, setError] = useState("");

  const rolesQuery = useQuery<RoleWithPermissions[]>({
    queryKey: ["owner-roles"],
    queryFn: listRoles,
  });

  const staffQuery = useQuery<StaffMember[]>({
    queryKey: ["owner-staff"],
    queryFn: listStaff,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteStaff(form),
    onSuccess: () => {
      setForm({ name: "", email: "", password: "", phone: "", roleIds: [] });
      setError("");
      queryClient.invalidateQueries({ queryKey: ["owner-staff"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Could not add staff member.");
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
      roleIds: f.roleIds.includes(roleId)
        ? f.roleIds.filter((id) => id !== roleId)
        : [...f.roleIds, roleId],
    }));
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-neutral-900 mb-1">Staff</h2>
      <p className="text-xs text-neutral-500 mb-3">
        Add team members and assign the roles they should have.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.roleIds.length === 0) {
            setError("Select at least one role.");
            return;
          }
          inviteMutation.mutate();
        }}
        className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-3 mb-6"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <input
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            type="email"
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            type="password"
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            placeholder="Temporary password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            minLength={8}
            required
          />
          <input
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-700 mb-1">Roles</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-1.5 text-xs border border-neutral-200 rounded-full px-3 py-1"
              >
                <input
                  type="checkbox"
                  checked={form.roleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                {role.name}
              </label>
            ))}
            {roles.length === 0 && (
              <p className="text-xs text-neutral-400">Create a role above first.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={inviteMutation.isPending}
          className="self-start bg-neutral-900 text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
        >
          {inviteMutation.isPending ? "Adding..." : "Add staff member"}
        </button>
      </form>

      {staffQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading staff...</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-neutral-400">No staff members yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className="border border-neutral-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{member.name}</p>
                <p className="text-xs text-neutral-500">
                  {member.email} · {member.roles.join(", ") || "No roles"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deactivateMutation.mutate(member.id)}
                className="text-xs text-red-500 font-medium"
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

export default function StaffPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Staff & Roles</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Manage roles, permissions, and who on your team has access to what.
      </p>

      <RoleBuilder />
      <StaffList />
    </div>
  );
}
