'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUnprintedOrders, markOrderAsPrinted } from '@/lib/api/orders';
import { ThermalReceipt } from './ThermalReceipt';
import { useOwnerAuthStore } from '@/store/owner-auth-store';

export function OrderPrintListener() {
  // 🆕 FIXED: Use 'activeRestaurantId' to match your Zustand store
  const { activeRestaurantId } = useOwnerAuthStore();
  
  const queryClient = useQueryClient();
  const printingRef = useRef<Set<string>>(new Set());
  const [orderToPrint, setOrderToPrint] = useState<any>(null);

  // 1. Poll for unprinted orders every 5 seconds
  const { data: unprintedOrders } = useQuery({
    queryKey: ['orders', 'unprinted', activeRestaurantId],
    queryFn: () => getUnprintedOrders(activeRestaurantId!),
    refetchInterval: 5000,
    enabled: !!activeRestaurantId, // Only run if a restaurant is selected
  });

  // 2. Mutation to mark as printed
  const markPrintedMutation = useMutation({
    mutationFn: (orderId: string) => markOrderAsPrinted(activeRestaurantId!, orderId),
    onSuccess: () => {
      // Invalidate queries to refresh the UI and stop polling this order
      queryClient.invalidateQueries({ queryKey: ['orders', 'unprinted', activeRestaurantId] });
      queryClient.invalidateQueries({ queryKey: ['orders', activeRestaurantId] });
    },
  });

  // 3. Trigger print when a new unprinted order is found
  useEffect(() => {
    if (!unprintedOrders || unprintedOrders.length === 0 || !activeRestaurantId) return;

    const order = unprintedOrders[0]; // Get the oldest unprinted order

    if (printingRef.current.has(order.id)) return; // Prevent duplicate triggers

    printingRef.current.add(order.id);
    setOrderToPrint(order);

    // Mark as printed in DB immediately so polling stops fetching it
    markPrintedMutation.mutate(order.id);

  }, [unprintedOrders, markPrintedMutation, activeRestaurantId]);

  // 4. Handle the actual browser print action
  useEffect(() => {
    if (orderToPrint) {
      // Small delay to ensure the receipt DOM is fully rendered before printing
      const printTimer = setTimeout(() => {
        window.print();
        // Clear the state after print dialog is triggered
        setOrderToPrint(null);
      }, 500);

      return () => clearTimeout(printTimer);
    }
  }, [orderToPrint]);

  // 5. Render the receipt ONLY when printing, hidden otherwise
  if (!orderToPrint) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/90 flex items-center justify-center print:static print:z-auto print:bg-white">
      <div className="print:hidden absolute top-4 right-4">
        <button 
          onClick={() => {
            setOrderToPrint(null);
            // Optional: remove from ref set if they cancel, so it might try again later
            // printingRef.current.delete(orderToPrint.id);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-lg"
        >
          Cancel Print
        </button>
      </div>
      <ThermalReceipt order={orderToPrint} />
    </div>
  );
}