// components/print/KitchenTicket.tsx
'use client';

interface KitchenTicketProps {
  order: any;
}

export function KitchenTicket({ order }: KitchenTicketProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Debug: Log order data to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[KitchenTicket] Order data:', order);
  }

  return (
    <div id="printable-kitchen-ticket" className="p-6 bg-white text-black font-sans max-w-[80mm] mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center border-b-4 border-black pb-4 mb-6">
        <h1 className="text-3xl font-black uppercase tracking-widest">KITCHEN ORDER</h1>
        <p className="text-xl font-bold mt-2">#{order.orderNumber}</p>
        <p className="text-sm font-medium mt-1">{formatTime(order.createdAt)}</p>
        <div className="mt-3 inline-block bg-black text-white px-4 py-1 text-sm font-bold uppercase">
          {order.orderType}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-6">
        {order.items?.map((item: any, idx: number) => (
          <div key={idx} className="border-b-2 border-dashed border-gray-400 pb-4 last:border-0">
            {/* Item Name & Qty */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-black">{item.quantity}x</span>
              <span className="text-xl font-bold text-black uppercase">{item.menuItem?.name || item.name}</span>
            </div>
            
            {/* Modifiers */}
            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
              <div className="ml-2 mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Modifiers:</p>
                <ul className="list-disc list-inside text-sm font-medium text-gray-800">
                  {item.selectedModifiers.map((mod: any, mIdx: number) => (
                    <li key={mIdx}>{mod.optionName || mod.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 🚨 CRITICAL: Notes / Allergies  */}
            {item.notes && (
              <div className="bg-red-100 border-4 border-red-600 p-3 mt-2">
                <p className="text-xs font-black text-red-800 uppercase mb-1">⚠️ Special Instructions / Allergy:</p>
                <p className="text-lg font-black text-red-900 uppercase leading-tight break-words">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-4 border-black text-center">
        <p className="text-sm font-bold uppercase">End of Order</p>
      </div>
    </div>
  );
}