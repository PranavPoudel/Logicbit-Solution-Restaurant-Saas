"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Truck, Clock, Bike, CheckCircle2, XCircle, Search, X, RefreshCw, FlaskConical } from "lucide-react";
import { listAllDeliveries } from "@/lib/api/platform-admin";
import { StatCard } from "@/components/dashboard/stat-card";

// ---------- helpers ----------
const TABS = ["All", "Pending", "On the way", "Delivered", "Cancelled"] as const;
type Tab = (typeof TABS)[number];
type Group = Exclude<Tab, "All">;

const DATE_FILTERS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
] as const;
type DateKey = (typeof DATE_FILTERS)[number]["key"];

// Read the first value that exists from a list of possible field paths
function pick(obj: any, ...paths: string[]): any {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function statusGroup(raw: string): Group {
  const s = String(raw || "").toUpperCase();
  if (s.includes("CANCEL") || s.includes("REJECT") || s.includes("FAIL")) return "Cancelled";
  if (s.includes("DELIVERED") || s.includes("COMPLETE")) return "Delivered";
  if (
    s.includes("PICK") ||
    s.includes("TRANSIT") ||
    s.includes("WAY") ||
    s.includes("OUT_FOR") ||
    s.includes("ACCEPT") ||
    s.includes("PROGRESS") ||
    s.includes("ARRIV")
  )
    return "On the way";
  return "Pending";
}

const GROUP_STYLES: Record<Group, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "On the way": "bg-blue-100 text-blue-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

function prettyStatus(raw: string) {
  return String(raw || "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function fmtDate(value: any) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value: any) {
  if (value === undefined || value === null || value === "") return "—";
  const n = Number(value);
  return isNaN(n) ? "—" : `Rs. ${n.toFixed(2)}`;
}

// Turn one raw delivery into the fields the page needs
function normalize(d: any) {
  const status = String(pick(d, "status", "deliveryStatus", "order.status") ?? "UNKNOWN");
  return {
    raw: d,
    id: String(pick(d, "id") ?? ""),
    orderNumber: String(
      pick(d, "order.orderNumber", "orderNumber", "orderId", "order.id") ?? pick(d, "id") ?? ""
    ),
    restaurant: pick(d, "order.restaurant.name", "restaurant.name", "restaurantName") ?? "—",
    rider:
      pick(
        d,
        "deliveryPerson.user.fullName",
        "deliveryPerson.user.name",
        "deliveryPerson.fullName",
        "deliveryPerson.name",
        "rider.name",
        "rider.fullName",
        "riderName"
      ) ?? "Not assigned",
    customer: pick(d, "order.customer.name", "order.customer.fullName", "customer.name") ?? "—",
    address: pick(d, "order.deliveryAddress", "deliveryAddress", "address", "order.address") ?? "—",
    fee: pick(d, "deliveryFee", "order.deliveryFee", "fee"),
    total: pick(d, "order.total", "total"),
    createdAt: pick(d, "createdAt", "order.createdAt"),
    deliveredAt: pick(d, "deliveredAt", "completedAt"),
    status,
    group: statusGroup(status),
  };
}
type Row = ReturnType<typeof normalize>;

function startOfRange(key: DateKey): number | null {
  const now = new Date();
  if (key === "all") return null;
  if (key === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = key === "7d" ? 7 : 30;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

// ---------- sample data (preview only, development mode) ----------
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function sample(
  n: number,
  restaurant: string,
  rider: string | null,
  status: string,
  ageMs: number,
  fee: number,
  total: number,
  customer: string,
  address: string
) {
  const created = new Date(Date.now() - ageMs).toISOString();
  return {
    id: `sample-${n}`,
    status,
    deliveryFee: fee,
    createdAt: created,
    deliveredAt: status === "DELIVERED" ? new Date(Date.now() - ageMs + 40 * 60 * 1000).toISOString() : null,
    deliveryPerson: rider ? { user: { fullName: rider } } : null,
    order: {
      orderNumber: `ORD-10${n}`,
      total,
      deliveryAddress: address,
      restaurant: { name: restaurant },
      customer: { name: customer },
    },
  };
}

const SAMPLE_ROWS: Row[] = [
  sample(1, "Momo's & More", "Bikash Rai", "DELIVERED", 2 * HOUR, 80, 650, "Test Customer", "Baneshwor, Kathmandu"),
  sample(2, "Burger Station", "Suman Thapa", "PICKED_UP", 1 * HOUR, 60, 820, "Anita Gurung", "Thamel, Kathmandu"),
  sample(3, "Newari Bhanchha Ghar", null, "PENDING", 30 * 60 * 1000, 70, 540, "Rojan Shrestha", "Patan Dhoka, Lalitpur"),
  sample(4, "Momo's & More", "Bikash Rai", "ACCEPTED", 45 * 60 * 1000, 90, 410, "Sita Maharjan", "Koteshwor, Kathmandu"),
  sample(5, "Burger Station", "Suman Thapa", "DELIVERED", 1 * DAY + 2 * HOUR, 60, 960, "Test Customer", "Kalanki, Kathmandu"),
  sample(6, "Newari Bhanchha Ghar", "Dipesh KC", "CANCELLED", 2 * DAY, 70, 380, "Prakash Joshi", "Jawalakhel, Lalitpur"),
  sample(7, "Momo's & More", "Dipesh KC", "DELIVERED", 5 * DAY, 80, 720, "Anita Gurung", "Maitighar, Kathmandu"),
  sample(8, "Burger Station", "Bikash Rai", "DELIVERED", 40 * DAY, 60, 1100, "Rojan Shrestha", "Lazimpat, Kathmandu"),
].map(normalize);

// ---------- page ----------
export default function AdminDeliveriesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [tab, setTab] = useState<Tab>("All");
  const [dateKey, setDateKey] = useState<DateKey>("30d");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [useSample, setUseSample] = useState(false);

  const isDev = process.env.NODE_ENV !== "production";

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listAllDeliveries();
      const list: any[] = Array.isArray(data) ? data : data?.deliveries ?? data?.data ?? [];
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[admin deliveries] first item:", list[0]);
      }
      const normalized = list.map(normalize).sort((a, b) => {
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      });
      setRows(normalized);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load deliveries:", err);
      if (!silent) setError("Could not load deliveries. Is the backend running?");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const sourceRows = useSample ? SAMPLE_ROWS : rows;

  // Rows after the date filter (used for stat cards and tab counts)
  const inDateRange = useMemo(() => {
    const start = startOfRange(dateKey);
    if (start === null) return sourceRows;
    return sourceRows.filter((r) => {
      const t = new Date(r.createdAt ?? 0).getTime();
      return !isNaN(t) && t >= start;
    });
  }, [sourceRows, dateKey]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      All: inDateRange.length,
      Pending: 0,
      "On the way": 0,
      Delivered: 0,
      Cancelled: 0,
    };
    inDateRange.forEach((r) => {
      c[r.group] += 1;
    });
    return c;
  }, [inDateRange]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inDateRange.filter((r) => {
      if (tab !== "All" && r.group !== tab) return false;
      if (!q) return true;
      return [r.orderNumber, r.restaurant, r.rider, r.customer, r.id]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [inDateRange, tab, query]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-sm text-gray-500 mt-1">
            Delivery report across all restaurants
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastUpdated && !useSample && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          {isDev && (
            <button
              onClick={() => {
                setUseSample((v) => !v);
                setSelected(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FlaskConical size={14} />
              {useSample ? "Hide sample data" : "Preview sample data"}
            </button>
          )}
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {useSample && (
        <div className="px-4 py-3 text-sm text-purple-800 bg-purple-50 border border-purple-200 rounded-lg">
          Showing sample data for preview only. These deliveries are not real.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total deliveries" value={String(counts.All)} icon={Truck} colorVariant="blue" />
        <StatCard
          label="In progress"
          value={String(counts.Pending + counts["On the way"])}
          icon={Clock}
          colorVariant="amber"
        />
        <StatCard label="Delivered" value={String(counts.Delivered)} icon={CheckCircle2} colorVariant="teal" />
        <StatCard label="Cancelled" value={String(counts.Cancelled)} icon={XCircle} colorVariant="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                tab === t
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {t} <span className="opacity-60">({counts[t]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value as DateKey)}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, restaurant, rider"
              className="w-full sm:w-72 pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading && !useSample ? (
        <div className="p-8 text-center text-gray-500 animate-pulse">Loading deliveries...</div>
      ) : error && !useSample ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-rose-600">{error}</p>
          <button
            onClick={() => load()}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Order #</th>
                <th className="p-4">Restaurant</th>
                <th className="p-4">Rider</th>
                <th className="p-4">Status</th>
                <th className="p-4">Fee</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                    No deliveries found.
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr
                    key={r.id || r.orderNumber}
                    onClick={() => setSelected(r)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-mono font-medium text-gray-900">
                      #{r.orderNumber.length > 12 ? r.orderNumber.slice(-6) : r.orderNumber}
                    </td>
                    <td className="p-4 text-gray-700">{r.restaurant}</td>
                    <td className="p-4 text-gray-600 flex items-center gap-1.5">
                      <Bike size={14} className="text-gray-400" />
                      {r.rider}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${GROUP_STYLES[r.group]}`}
                      >
                        {prettyStatus(r.status)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{money(r.fee)}</td>
                    <td className="p-4 text-gray-500">{fmtDate(r.createdAt)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery</p>
                <h2 className="text-xl font-bold text-gray-900 font-mono">
                  #{selected.orderNumber.length > 12 ? selected.orderNumber.slice(-6) : selected.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${GROUP_STYLES[selected.group]}`}
            >
              {prettyStatus(selected.status)}
            </span>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
              <DetailRow label="Restaurant" value={selected.restaurant} />
              <DetailRow label="Customer" value={selected.customer} />
              <DetailRow label="Rider" value={selected.rider} />
              <DetailRow label="Address" value={String(selected.address)} />
              <DetailRow label="Delivery fee" value={money(selected.fee)} />
              <DetailRow label="Order total" value={money(selected.total)} />
              <DetailRow label="Created" value={fmtDate(selected.createdAt)} />
              <DetailRow label="Delivered" value={fmtDate(selected.deliveredAt)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}