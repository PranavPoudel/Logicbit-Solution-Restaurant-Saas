"use client";
import { useEffect, useState, FormEvent } from "react";
import { platformApiClient } from "@/lib/api/platform-client";

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [form, setForm] = useState({ restaurantId: "", startDate: "", endDate: "" });

  const loadSettlements = async () => {
    try {
      const { data } = await platformApiClient.get("/platform-admin/settlements");
      setSettlements(data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const handleGenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await platformApiClient.post("/platform-admin/settlements/generate", form);
      loadSettlements();
    } catch (err) {
      alert("Failed to generate settlement");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Settlements</h2>
      
      <form onSubmit={handleGenerate} className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <input className="border p-2 rounded" placeholder="Restaurant ID" required value={form.restaurantId} onChange={(e) => setForm({...form, restaurantId: e.target.value})} />
        <input className="border p-2 rounded" type="date" required value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} />
        <input className="border p-2 rounded" type="date" required value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Generate</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Restaurant ID</th>
              <th className="p-4 font-semibold text-gray-600">Amount</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 last:border-0">
                <td className="p-4">{s.restaurantId}</td>
                <td className="p-4">${s.amount}</td>
                <td className="p-4">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}