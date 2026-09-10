// components/owner-orders/order-table.tsx
"use client";

import { Eye, Trash2, MoreVertical, Clock, MapPin, Package } from "lucide-react";
import { useState } from "react";

export interface OwnerOrderSummary {
  id: string;
  orderNumber?: string;
  status?: string;
  customer?: { name?: string; phone?: string };
  items?: Array<{
    menuItemId?: string;
    menuItem?: { name?: string };
    quantity?: number;
    unitPrice?: number;
  }>;
  total?: number;
  createdAt?: string;
  orderType?: string;
  deliveryAddress?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-purple-100 text-purple-800",
  READY: "bg-teal-100 text-teal-800",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS = ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

export function OrderTable({
  orders,
  isTrash,
  isMutating,
  onView,
  onStatusChange,
  onCancel,
}: {
  orders: OwnerOrderSummary[];
  isTrash: boolean;
  isMutating: boolean;
  onView: (orderId: string) => void;
  onStatusChange: (orderId: string, status: string) => void;
  onCancel: (orderId: string) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    onStatusChange(orderId, newStatus);
    setOpenMenuId(null);
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">
                Order #
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">
                Customer
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">
                Type
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">
                Items
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">
                Total
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">
                Placed
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">
                Status
              </th>
              <th className="text-right text-xs font-semibold text-neutral-600 px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => {
              const status = (order.status ?? "PENDING").toUpperCase();
              const isNew = status === "PENDING";
              
              return (
                <tr 
                  key={order.id} 
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-medium text-neutral-900">
                      #{order.orderNumber ?? order.id.slice(0, 8)}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {order.customer?.name ?? "Customer"}
                      </p>
                      {order.customer?.phone && (
                        <p className="text-xs text-neutral-500">
                          {order.customer.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {order.orderType === "DELIVERY" ? (
                        <MapPin size={14} className="text-neutral-400" />
                      ) : (
                        <Package size={14} className="text-neutral-400" />
                      )}
                      <span className="text-sm text-neutral-700">
                        {order.orderType ?? "PICKUP"}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-sm text-neutral-600">
                      {(order.items ?? []).length} items
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold text-neutral-900">
                      Rs {(order.total ?? 0).toLocaleString()}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Clock size={12} />
                      {order.createdAt 
                        ? new Date(order.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    {isTrash ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Cancelled
                      </span>
                    ) : (
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={isMutating}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer disabled:opacity-50 ${
                          STATUS_COLORS[status] || "bg-neutral-100 text-neutral-800"
                        }`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace(/_/g, " ")}
                          </option>
                        ))}
                        {status !== "DELIVERED" && (
                          <option value="CANCELLED">Cancelled</option>
                        )}
                      </select>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(order.id)}
                        className="p-1.5 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {!isTrash && status !== "DELIVERED" && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {openMenuId === order.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => onCancel(order.id)}
                                disabled={isMutating}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
}