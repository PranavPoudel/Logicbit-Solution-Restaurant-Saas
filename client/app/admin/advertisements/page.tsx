// app/platform-admin/advertisements/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPendingAdvertisements,
  approveAdvertisement,
  rejectAdvertisement,
  type Advertisement,
} from "@/lib/api/advertisements";

function ApproveForm({
  ad,
  onCancel,
  onSubmit,
}: {
  ad: Advertisement;
  onCancel: () => void;
  onSubmit: (amountPaid: number, priority?: number) => void;
}) {
  const [amountPaid, setAmountPaid] = useState("");
  const [priority, setPriority] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Number(amountPaid), priority ? Number(priority) : undefined);
      }}
      className="flex items-center gap-2 mt-2"
    >
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Amount paid"
        className="border border-neutral-300 rounded-md px-2 py-1.5 text-sm w-32"
        value={amountPaid}
        onChange={(e) => setAmountPaid(e.target.value)}
        required
      />
      <input
        type="number"
        min="0"
        placeholder="Priority (optional)"
        className="border border-neutral-300 rounded-md px-2 py-1.5 text-sm w-36"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      />
      <button type="submit" className="bg-green-700 text-white text-xs font-medium rounded-md px-3 py-1.5">
        Confirm approve
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-neutral-500">
        Cancel
      </button>
    </form>
  );
}

function RejectForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(reason);
      }}
      className="flex items-center gap-2 mt-2"
    >
      <input
        type="text"
        placeholder="Reason for rejection"
        className="border border-neutral-300 rounded-md px-2 py-1.5 text-sm flex-1"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />
      <button type="submit" className="bg-red-700 text-white text-xs font-medium rounded-md px-3 py-1.5">
        Confirm reject
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-neutral-500">
        Cancel
      </button>
    </form>
  );
}

export default function PlatformAdvertisementsPage() {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState<{ id: string; type: "approve" | "reject" } | null>(null);

  const adsQuery = useQuery({
    queryKey: ["platform-pending-ads"],
    queryFn: listPendingAdvertisements,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, amountPaid, priority }: { id: string; amountPaid: number; priority?: number }) =>
      approveAdvertisement(id, { amountPaid, priority }),
    onSuccess: () => {
      setOpenForm(null);
      queryClient.invalidateQueries({ queryKey: ["platform-pending-ads"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectAdvertisement(id, reason),
    onSuccess: () => {
      setOpenForm(null);
      queryClient.invalidateQueries({ queryKey: ["platform-pending-ads"] });
    },
  });

  const ads = adsQuery.data ?? [];

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Advertisement requests</h1>
      <p className="text-sm text-neutral-500 mb-6">Review and approve or reject restaurant ad requests.</p>

      {adsQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-neutral-400">No pending requests.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {ads.map((ad) => (
            <div key={ad.id} className="border border-neutral-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{ad.title}</p>
                  <p className="text-xs text-neutral-500">
                    {ad.placementType.replace("_", " ")} · {ad.startDate?.slice(0, 10)} → {ad.endDate?.slice(0, 10)}
                  </p>
                </div>

                {!openForm || openForm.id !== ad.id ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOpenForm({ id: ad.id, type: "approve" })} className="bg-green-700 text-white text-xs font-medium rounded-md px-3 py-1.5">
                      Approve
                    </button>
                    <button type="button" onClick={() => setOpenForm({ id: ad.id, type: "reject" })} className="bg-red-700 text-white text-xs font-medium rounded-md px-3 py-1.5">
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>

              {openForm?.id === ad.id && openForm.type === "approve" && (
                <ApproveForm ad={ad} onCancel={() => setOpenForm(null)} onSubmit={(amountPaid, priority) => approveMutation.mutate({ id: ad.id, amountPaid, priority })} />
              )}

              {openForm?.id === ad.id && openForm.type === "reject" && (
                <RejectForm onCancel={() => setOpenForm(null)} onSubmit={(reason) => rejectMutation.mutate({ id: ad.id, reason })} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}