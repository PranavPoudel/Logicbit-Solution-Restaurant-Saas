interface Order {
  id: string;
  orderNumber: string;
  customer: { name: string };
  total: number;
  status: string;
  createdAt: string;
}

interface RecentOrdersTableProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-purple-100 text-purple-800",
  READY: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E8E7E2] p-8 text-center text-sm text-neutral-500">
        No recent orders.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E7E2] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E8E7E2]">
        <h3 className="font-display font-semibold text-[#1B2333]">Recent Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F8F9FA] text-neutral-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Order #</th>
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E7E2]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[#F8F9FA] transition-colors">
                <td className="px-5 py-4 font-mono font-medium text-[#1B2333]">{order.orderNumber}</td>
                <td className="px-5 py-4 text-neutral-600">{order.customer?.name || "Guest"}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || "bg-neutral-100 text-neutral-600"}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-mono font-medium text-[#1B2333]">
                  NPR {order.total.toFixed(2)}
                </td>
                <td className="px-5 py-4 text-right text-neutral-500 text-xs">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}