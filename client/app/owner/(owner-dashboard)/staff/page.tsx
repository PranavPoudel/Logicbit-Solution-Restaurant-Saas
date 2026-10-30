// app/(owner-dashboard)/staff/page.tsx
"use client";

import { RoleBuilder } from "@/components/owner-staff/role-builder";
import { StaffList } from "@/components/owner-staff/staff-list";

export default function StaffPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Staff & Access Control</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage roles, define permissions, and control who on your team has access to your restaurant data.
        </p>
      </div>

      <RoleBuilder />
      
      <div className="border-t border-neutral-200 my-8" />
      
      <StaffList />
    </div>
  );
}