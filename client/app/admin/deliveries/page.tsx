"use client";

import { useEffect, useState } from "react";
import { useMoney } from "@/hooks/use-money";
import { 
  getAllDeliveries, 
  getAllRiders, 
  toggleRiderLock, 
  reviewRiderApproval, 
  Delivery, 
  Rider,
  DeliveryPartnerRow,
  getAllDeliveryPartners
} from "@/lib/api/platform-admin-delivery";
import { findProvider, formatPartnerFee } from "@/lib/delivery-partner-providers";
import { ProviderBadge } from "@/components/delivery-partners/provider-badge";
import { 
  Truck, 
  UserCheck, 
  UserX, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  MapPin, 
  Bike,
  Handshake,
  RefreshCw
} from "lucide-react";

export default function DeliveriesPage() {
  const money = useMoney();
  const [activeTab, setActiveTab] = useState<"deliveries" | "pending" | "riders" | "partners">("deliveries");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [partners, setPartners] = useState<DeliveryPartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const partnerGroups = Object.entries(
    partners.reduce<Record<string, DeliveryPartnerRow[]>>((acc, p) => {
      (acc[p.name] ||= []).push(p);
      return acc;
    }, {}),
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deliveriesData, ridersData, partnersData] = await Promise.all([
        getAllDeliveries(),
        getAllRiders(),
        getAllDeliveryPartners(),
      ]);
      setDeliveries(deliveriesData || []);
      setRiders(ridersData || []);
      setPartners(partnersData || []);
    } catch (err) {
      console.error("Failed to load delivery module data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleLock = async (riderId: string, currentStatus: boolean) => {
    setActionLoading(riderId);
    try {
      await toggleRiderLock(riderId, !currentStatus);
      await fetchData();
    } catch (err) {
      alert("Failed to update rider status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproval = async (riderId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(riderId);
    try {
      await reviewRiderApproval(riderId, status);
      await fetchData();
    } catch (err) {
      alert("Failed to update rider approval");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRiders = riders.filter((r) => r.approvalStatus === "PENDING");
  const activeRiders = riders.filter((r) => r.approvalStatus === "APPROVED");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deliveries & Riders</h1>
          <p className="text-gray-500 mt-1">Manage live logistics, rider applications, and account access.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 gap-6">
        <button
          onClick={() => setActiveTab("deliveries")}
          className={`flex items-center gap-2 pb-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "deliveries"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Truck className="w-4 h-4" /> All Deliveries ({deliveries.length})
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 pb-3 font-semibold text-sm border-b-2 transition relative ${
            activeTab === "pending"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Pending Approval
          {pendingRiders.length > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingRiders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("riders")}
          className={`flex items-center gap-2 pb-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "riders"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bike className="w-4 h-4" /> Riders Directory ({activeRiders.length})
        </button>

        <button
          onClick={() => setActiveTab("partners")}
          className={`flex items-center gap-2 pb-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "partners"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Handshake className="w-4 h-4" /> Delivery Services ({partners.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading delivery logistics...</div>
      ) : (
        <>
          {/* TAB 1: ALL DELIVERIES */}
          {activeTab === "deliveries" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Restaurant</th>
                    <th className="py-3 px-4">Customer / Address</th>
                    <th className="py-3 px-4">Assigned Rider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Earning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No deliveries found</td>
                    </tr>
                  ) : (
                    deliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          #{delivery.order?.orderNumber || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {delivery.order?.restaurant?.name || "Unknown"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{delivery.order?.customer?.name || "Customer"}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {delivery.order?.deliveryAddress || "N/A"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {delivery.deliveryPerson ? (
                            <div>
                              <span className="font-semibold text-gray-900">{delivery.deliveryPerson.name}</span>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {delivery.deliveryPerson.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              delivery.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : delivery.status === "ON_THE_WAY" || delivery.status === "PICKED_UP"
                                ? "bg-blue-100 text-blue-800"
                                : delivery.status === "ASSIGNED"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {delivery.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {money(delivery.earningAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: PENDING RIDER APPROVALS */}
          {activeTab === "pending" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRiders.length === 0 ? (
                <div className="col-span-full bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-200">
                  No pending rider applications to review.
                </div>
              ) : (
                pendingRiders.map((rider) => (
                  <div key={rider.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{rider.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3.5 h-3.5" /> {rider.phone}
                        </p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                      <div className="text-gray-600">
                        <span className="font-medium">Vehicle:</span> {rider.vehicleType || "Not specified"}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Applied Date:</span> {new Date(rider.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        disabled={actionLoading === rider.id}
                        onClick={() => handleApproval(rider.id, "APPROVED")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Accept
                      </button>
                      <button
                        disabled={actionLoading === rider.id}
                        onClick={() => handleApproval(rider.id, "REJECTED")}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: RIDERS DIRECTORY & ACCOUNT LOCKING */}
          {activeTab === "riders" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                    <th className="py-3 px-4">Rider Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Total Deliveries</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeRiders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No active riders registered</td>
                    </tr>
                  ) : (
                    activeRiders.map((rider) => (
                      <tr key={rider.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-bold text-gray-900">{rider.name}</td>
                        <td className="py-3 px-4 text-gray-600">{rider.phone}</td>
                        <td className="py-3 px-4 text-gray-600">{rider.vehicleType || "N/A"}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{rider._count?.deliveries || 0}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              rider.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {rider.isActive ? "Active" : "Locked / Suspended"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={actionLoading === rider.id}
                            onClick={() => handleToggleLock(rider.id, rider.isActive)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition ${
                              rider.isActive
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {rider.isActive ? (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Lock Account
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Unlock Account
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {/* TAB 4: THIRD-PARTY DELIVERY SERVICES */}
          {activeTab === "partners" && (
            <div className="space-y-4">
              {partnerGroups.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {partnerGroups.map(([name, rows]) => (
                    <div key={name} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <ProviderBadge provider={findProvider(name)} size={44} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500">
                          {rows.length} restaurant{rows.length > 1 ? "s" : ""} · {rows.filter((r) => r.isActive).length} active
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {partners.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-14 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                      <Handshake className="w-7 h-7" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">No delivery services yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">When restaurants add the delivery companies they work with, they will show up here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">Restaurant</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Account ID</th>
                          <th className="py-3 px-4">Fee</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {partners.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <ProviderBadge provider={findProvider(p.name)} size={36} />
                                <span className="font-bold text-gray-900">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-800">{p.restaurant.name}</td>
                            <td className="py-3 px-4">
                              <div className="text-gray-900">{p.contactName || "N/A"}</div>
                              {p.contactPhone && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {p.contactPhone}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{p.accountId || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-800 whitespace-nowrap">{formatPartnerFee(p)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ${p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                {p.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}