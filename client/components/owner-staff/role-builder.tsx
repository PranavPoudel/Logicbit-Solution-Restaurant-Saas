// components/owner-staff/role-builder.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Shield, ShieldCheck, ShieldX, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  createRole,
  deleteRole,
  listRoles,
  listPermissions,
  addPermissionToRole,
  removePermissionFromRole,
} from "@/lib/api/roles-permissions";

interface RoleWithPermissions {
  id: string;
  name: string;
  isDefault?: boolean;
  permissions: { permission: { id: string; name: string; description?: string } }[];
}

interface Permission {
  id: string;
  name: string;
  description?: string;
}

export function RoleBuilder() {
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
    mutationFn: ({ roleId, permissionId, hasIt }: { roleId: string; permissionId: string; hasIt: boolean }) =>
      hasIt ? removePermissionFromRole(roleId, permissionId) : addPermissionToRole(roleId, permissionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-roles"] }),
  });

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];

  const handleSelectAll = (role: RoleWithPermissions) => {
    const grantedIds = new Set(role.permissions.map((p) => p.permission.id));
    permissions.forEach((perm) => {
      if (!grantedIds.has(perm.id)) {
        togglePermissionMutation.mutate({ roleId: role.id, permissionId: perm.id, hasIt: false });
      }
    });
  };

  const handleClearAll = (role: RoleWithPermissions) => {
    role.permissions.forEach((p) => {
      togglePermissionMutation.mutate({ roleId: role.id, permissionId: p.permission.id, hasIt: true });
    });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-[#E3A008]" />
        <h2 className="text-sm font-semibold text-neutral-900">Roles & Permissions</h2>
      </div>
      <p className="text-xs text-neutral-500 mb-4">
        Create custom roles and define exactly what they can access. Click on a role to manage its permissions.
      </p>

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (newRoleName.trim()) createRoleMutation.mutate();
        }}
      >
        <input
          className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
          placeholder="New role name (e.g., Cashier, Manager)"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          disabled={createRoleMutation.isPending}
        />
        <button
          type="submit"
          disabled={createRoleMutation.isPending || !newRoleName.trim()}
          className="bg-[#1B2333] text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50 flex items-center gap-2"
        >
          {createRoleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Role
        </button>
      </form>

      {rolesQuery.isLoading ? (
        <p className="text-sm text-neutral-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading roles...</p>
      ) : roles.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg p-6 text-center">
          <p className="text-sm text-neutral-500">No custom roles yet. Create one above to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {roles.map((role) => {
            const isExpanded = expandedRoleId === role.id;
            const grantedIds = new Set(role.permissions.map((p) => p.permission.id));
            const isDefault = role.name.toLowerCase() === "owner" || role.isDefault;

            return (
              <div key={role.id} className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                <div 
                  className="flex items-center justify-between px-4 py-3 bg-neutral-50/50 cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                >
                  <div className="flex items-center gap-3">
                    <button type="button" className="text-neutral-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                        {role.name}
                        {isDefault && <span className="text-[10px] font-bold uppercase bg-[#E3A008]/10 text-[#E3A008] px-1.5 py-0.5 rounded">Default</span>}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"} granted
                      </p>
                    </div>
                  </div>
                  
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
                          deleteRoleMutation.mutate(role.id);
                        }
                      }}
                      className="text-neutral-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Delete ${role.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">Assigned Permissions</h4>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => handleSelectAll(role)}
                          className="text-xs text-[#0F6B5C] hover:underline font-medium flex items-center gap-1"
                        >
                          <ShieldCheck size={12} /> Select All
                        </button>
                        <span className="text-neutral-300">|</span>
                        <button 
                          type="button" 
                          onClick={() => handleClearAll(role)}
                          className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1"
                        >
                          <ShieldX size={12} /> Clear All
                        </button>
                      </div>
                    </div>

                    {permissionsQuery.isLoading ? (
                      <p className="text-xs text-neutral-400">Loading permissions...</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                        {permissions.map((permission) => {
                          const hasIt = grantedIds.has(permission.id);
                          const isMutating = togglePermissionMutation.isPending && 
                            togglePermissionMutation.variables?.roleId === role.id && 
                            togglePermissionMutation.variables?.permissionId === permission.id;

                          return (
                            <label
                              key={permission.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                hasIt ? "bg-[#0F6B5C]/5 border-[#0F6B5C]/30" : "bg-white border-neutral-200 hover:border-neutral-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={hasIt}
                                onChange={() => togglePermissionMutation.mutate({ roleId: role.id, permissionId: permission.id, hasIt })}
                                disabled={isMutating}
                                className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#0F6B5C] focus:ring-[#0F6B5C] disabled:opacity-50"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900">{permission.name}</p>
                                {permission.description && <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{permission.description}</p>}
                              </div>
                              {isMutating && <Loader2 className="w-4 h-4 animate-spin text-neutral-400 shrink-0" />}
                            </label>
                          );
                        })}
                      </div>
                    )}
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