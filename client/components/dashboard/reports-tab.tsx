"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { listRestaurantOrders } from "@/lib/api/orders";
import { reservationsApi } from "@/lib/api/reservations";
import { Download, Filter, Loader2, AlertCircle } from "lucide-react";

// --- Utility: Convert JSON to CSV ---
const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((fieldName) => {
        let value = row[fieldName];
        // Handle nested objects (e.g., customer.name)
        if (typeof value === "object" && value !== null) {
          value = JSON.stringify(value); 
        }
        // Escape commas and quotes
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    ),
  ];
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function ReportsTab() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const [activeReport, setActiveReport] = useState<"orders" | "reservations">("orders");
  
  // Simple date inputs (you can upgrade to react-day-picker later)
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["restaurant-orders-report", restaurantId, startDate, endDate, statusFilter],
    queryFn: () => listRestaurantOrders(restaurantId as string, { startDate, endDate, status: statusFilter || undefined }),
    enabled: !!restaurantId && activeReport === "orders",
  });

  const { data: reservations, isLoading: isLoadingReservations } = useQuery({
    queryKey: ["restaurant-reservations-report", restaurantId, startDate, endDate, statusFilter],
    queryFn: () => reservationsApi.list(restaurantId as string, { startDate, endDate, status: statusFilter || undefined }),
    enabled: !!restaurantId && activeReport === "reservations",
  });

  const handleExport = () => {
    const dataToExport = activeReport === "orders" ? orders : reservations;
    // Flatten data slightly for better CSV output
    const flattenedData = (dataToExport || []).map((item: any) => ({
      id: item.id,
      date: item.createdAt || item.reservationDate,
      customer: item.customer?.name || item.customerName || "Guest",
      phone: item.customer?.phone || item.customerPhone || "N/A",
      status: item.status,
      total: item.total || "N/A",
      details: activeReport === "orders" 
        ? item.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name}`).join("; ") 
        : `Party of ${item.partySize} at ${item.reservationTime}`,
    }));
    exportToCSV(flattenedData, `${activeReport}-report-${startDate}-to-${endDate}`);
  };

  if (!restaurantId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>No restaurant selected.</p>
      </div>
    );
  }

  const isLoading = activeReport === "orders" ? isLoadingOrders : isLoadingReservations;
  const data = activeReport === "orders" ? orders : reservations;

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">From</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-[#E3A008] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">To</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-[#E3A008] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Status (Optional)</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-[#E3A008] focus:border-transparent outline-none bg-white"
            >
              <option value="">All Statuses</option>
              {activeReport === "orders" ? (
                <>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              ) : (
                <>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
            </select>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={!data || data.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#E3A008] text-white text-sm font-medium rounded-md hover:bg-[#c98d07] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => { setActiveReport("orders"); setStatusFilter(""); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeReport === "orders" ? "border-[#E3A008] text-[#E3A008]" : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Orders Report
        </button>
        <button
          onClick={() => { setActiveReport("reservations"); setStatusFilter(""); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeReport === "reservations" ? "border-[#E3A008] text-[#E3A008]" : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Reservations Report
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E3A008]" />
            <p className="text-sm text-neutral-500">Loading report data...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Filter size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No records found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 text-neutral-600 font-medium border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Status</th>
                  {activeReport === "orders" && <th className="px-6 py-3 text-right">Total</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.map((item: any) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                      {item.orderNumber || item.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {new Date(item.createdAt || item.reservationDate).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-neutral-400">
                        {item.reservationTime || new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-neutral-900">{item.customer?.name || item.customerName || "Guest"}</p>
                      <p className="text-xs text-neutral-500">{item.customer?.phone || item.customerPhone || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 max-w-xs truncate">
                      {activeReport === "orders" 
                        ? item.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name}`).join(", ")
                        : `Party of ${item.partySize} ${item.table ? `(${item.table.name})` : ""}`
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === "DELIVERED" || item.status === "COMPLETED" || item.status === "CONFIRMED"
                          ? "bg-green-100 text-green-700"
                          : item.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {activeReport === "orders" && (
                      <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                        NPR {Number(item.total).toLocaleString()}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}