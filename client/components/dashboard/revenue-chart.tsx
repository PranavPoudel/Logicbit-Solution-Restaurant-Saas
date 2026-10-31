// components/dashboard/revenue-chart.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useMoney } from "@/hooks/use-money";

interface RevenuePoint {
  date: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const money = useMoney();
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-800">
          Revenue — last 7 days
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: -20, right: 10, top: 5 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E3A008" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#E3A008" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            formatter={(value) => [
              money(Number(value ?? 0)),
              "Revenue",
            ]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E5E5E3",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#1B2333"
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
