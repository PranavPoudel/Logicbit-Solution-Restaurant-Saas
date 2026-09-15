"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addPlatformStaff, listPlatformRoles } from "@/lib/api/platform-admin";

export default function CreateStaffPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([{id:2, name:"test1"}]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", roleId: "" });

  useEffect(() => {
    listPlatformRoles().then((res) => setRoles(res?.data || []));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addPlatformStaff(form);
      router.push("/admin/staff");
    } catch (err) {
      alert("Failed to create staff");
    }
  };

  return (
    <div className="p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-6">Create New Staff</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <input 
          className="w-full p-2 border rounded" 
          placeholder="Full Name" 
          required 
          value={form.fullName} 
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
        />
        <input 
          className="w-full p-2 border rounded" 
          type="email" 
          placeholder="Email" 
          required 
          value={form.email} 
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
        />
        <input 
          className="w-full p-2 border rounded" 
          type="password" 
          placeholder="Password" 
          required 
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
        />
        <select 
          className="w-full p-2 border rounded bg-white" 
          required 
          value={form.roleId} 
          onChange={(e) => setForm({ ...form, roleId: e.target.value })}
        >
          <option value="">Select Role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Submit
        </button>
      </form>
    </div>
  );
}