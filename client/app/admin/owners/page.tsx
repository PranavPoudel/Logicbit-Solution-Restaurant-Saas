"use client";

import { Fragment, useEffect, useState } from "react";
import { getOwnersOverview, OwnerOverview, OwnerStats } from "@/lib/api/platform-admin";

const rs = (n: number) => `Rs. ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const th = "p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider";

function StatCells({ stats, className = "p-4" }: { stats: OwnerStats; className?: string }) {
  return (
    <>
      <td className={`${className} text-right`}>{stats.orders}</td>
      <td className={`${className} text-right`}>{rs(stats.sales)}</td>
      <td className={`${className} text-right`}>{rs(stats.commission)}</td>
      <td className={`${className} text-right font-medium`}>{rs(stats.sales - stats.commission)}</td>
    </>
  );
}

function StatHeaders() {
  return (
    <>
      <th className={`${th} text-right`}>Orders</th>
      <th className={`${th} text-right`}>Sales</th>
      <th className={`${th} text-right`}>Commission</th>
      <th className={`${th} text-right`}>Payout</th>
    </>
  );
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<OwnerOverview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"owners" | "restaurants">("owners");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    getOwnersOverview()
      .then(setOwners)
      .catch((error) => console.error("Failed to load owners overview:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading owners...</div>;
  if (!owners) return <div className="p-8 text-center text-red-500">Failed to load owners.</div>;

  const sum = (key: keyof OwnerStats) => owners.reduce((total, o) => total + o[key], 0);
  const restaurants = owners
    .flatMap((o) => o.restaurants.map((r) => ({ ...r, ownerName: o.owner?.name ?? "—" })))
    .sort((a, b) => b.orders - a.orders);

  const cards = [
    { label: "Total orders", value: sum("orders").toLocaleString() },
    { label: "Gross sales", value: rs(sum("sales")) },
    { label: "Platform commission", value: rs(sum("commission")), className: "text-emerald-600" },
    { label: "Paid out to restaurants", value: rs(sum("sales") - sum("commission")), className: "text-blue-600" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Owners &amp; Cash Flow</h1>
        <p className="text-sm text-gray-500 mt-1">
          Orders and money per owner and restaurant. Sales count delivered orders only.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{c.label}</h3>
            <p className={`text-2xl font-bold mt-2 ${c.className ?? "text-gray-900"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["owners", "restaurants"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${
              view === v ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {v === "owners" ? "By owner" : "By restaurant"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className={th}>{view === "owners" ? "Owner" : "Restaurant"}</th>
              <th className={th}>{view === "owners" ? "Restaurants" : "Owner"}</th>
              <StatHeaders />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {view === "owners"
              ? owners.map((o) => (
                  <Fragment key={o.tenantId}>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{o.owner?.name ?? "No owner"}</p>
                        <p className="text-xs text-gray-500">{[o.owner?.email, o.owner?.phone].filter(Boolean).join(" • ")}</p>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setOpen(open === o.tenantId ? null : o.tenantId)}
                          className="text-blue-600 hover:underline"
                        >
                          {o.restaurants.length} {o.restaurants.length === 1 ? "restaurant" : "restaurants"}
                          {open === o.tenantId ? " ▴" : " ▾"}
                        </button>
                      </td>
                      <StatCells stats={o} />
                    </tr>
                    {open === o.tenantId &&
                      o.restaurants.map((r) => (
                        <tr key={r.id} className="bg-gray-50 text-gray-600">
                          <td className="p-3 pl-10" colSpan={2}>{r.name}</td>
                          <StatCells stats={r} className="p-3" />
                        </tr>
                      ))}
                  </Fragment>
                ))
              : restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{r.name}</td>
                    <td className="p-4 text-gray-600">{r.ownerName}</td>
                    <StatCells stats={r} />
                  </tr>
                ))}
            {(view === "owners" ? owners : restaurants).length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 italic">Nothing here yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
