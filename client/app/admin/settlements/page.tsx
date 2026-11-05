// app/admin/settlements/page.tsx
"use client";
import { useEffect, useState, FormEvent } from "react";
import { 
  listPendingSettlements, 
  generateSettlement,
  markSettlementPaid
} from "@/lib/api/settlements";

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [form, setForm] = useState({ restaurantId: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const data = await listPendingSettlements();
      setSettlements(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const handleGenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await generateSettlement(form.restaurantId, {
        periodStart: new Date(form.startDate).toISOString(),
        periodEnd: new Date(form.endDate).toISOString(),
      });
      setForm({ restaurantId: "", startDate: "", endDate: "" });
      loadSettlements();
      alert("Settlement generated successfully");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate settlement");
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Confirm you have paid this vendor?")) return;
    try {
      await markSettlementPaid(id);
      loadSettlements();
    } catch (error) {
      alert("Failed to mark as paid");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Settlements</h2>
      
      <form onSubmit={handleGenerate} className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <input 
          className="border p-2 rounded flex-1 min-w-[200px]" 
          placeholder="Restaurant ID" 
          required 
          value={form.restaurantId} 
          onChange={(e) => setForm({ ...form, restaurantId: e.target.value })} 
        />
        <input 
          className="border p-2 rounded" 
          type="date" 
          required 
          value={form.startDate} 
          onChange={(e) => setForm({ ...form, startDate: e.target.value })} 
        />
        <input 
          className="border p-2 rounded" 
          type="date" 
          required 
          value={form.endDate} 
          onChange={(e) => setForm({ ...form, endDate: e.target.value })} 
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
          Generate Payout
        </button>
      </form>

      {loading ? (
        <div className="text-gray-500">Loading settlements...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Restaurant</th>
                <th className="p-4 font-semibold text-gray-600">Period</th>
                <th className="p-4 font-semibold text-gray-600">Net Payout</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{s.restaurant?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{s.restaurantId}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(s.periodStart).toLocaleDateString()} - {new Date(s.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold text-green-600">${Number(s.netAmount).toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleMarkPaid(s.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Mark as Paid
                    </button>
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No pending settlements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}