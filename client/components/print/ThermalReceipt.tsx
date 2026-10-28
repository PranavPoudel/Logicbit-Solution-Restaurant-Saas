//components/print/ThermalReceipt.tsx
'use client';
import { theme } from '@/config/theme';

interface ThermalReceiptProps {
  order: any;
}

export function ThermalReceipt({ order }: ThermalReceiptProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div id="printable-receipt" className="p-4 bg-white text-black font-mono text-sm max-w-[80mm] mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <h1 className="text-xl font-black uppercase tracking-wider">{order.restaurant?.name || 'Restaurant'}</h1>
        <p className="text-xs mt-1">{order.restaurant?.address || ''}</p>
        <p className="text-xs">{order.restaurant?.phone || ''}</p>
      </div>

      {/* Order Meta */}
      <div className="border-b border-black pb-2 mb-3 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="font-bold">Order #:</span>
          <span>{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="font-bold uppercase">{order.orderType}</span>
        </div>
        {order.customer?.name && (
          <div className="flex justify-between mt-1">
            <span>Customer:</span>
            <span>{order.customer.name} {order.customer.phone ? `(${order.customer.phone})` : ''}</span>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="border-b border-black pb-2 mb-3">
        <h2 className="text-xs font-black uppercase mb-2">Items</h2>
        {order.items?.map((item: any, idx: number) => (
          <div key={idx} className="mb-3 pb-2 border-b border-dashed border-gray-400 last:border-0 last:pb-0 last:mb-0">
            {/* Item Name & Price */}
            <div className="flex justify-between items-start font-bold text-sm">
              <span className="flex-1 pr-2">{item.quantity}x {item.menuItem?.name || item.name || 'Menu Item'}</span>
              <span className="shrink-0">NPR {item.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            
            {/* Modifiers (Indented & Subtle) - ONLY MODIFIERS, NO NOTES */}
            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
              <div className="pl-3 mt-1 text-xs text-gray-700 border-l-2 border-gray-300">
                {item.selectedModifiers.map((mod: any, mIdx: number) => (
                  <div key={mIdx}>+ {mod.optionName || mod.name}</div>
                ))}
              </div>
            )}
            {/* ✅ REMOVED: item.notes display - this is kitchen-only info */}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="text-xs space-y-1.5 mb-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>NPR {order.subtotal?.toFixed(2) || '0.00'}</span>
        </div>
        {order.deliveryFee > 0 && (
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>NPR {order.deliveryFee.toFixed(2)}</span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Discount ({order.couponCode})</span>
            <span>- NPR {order.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-base border-t-2 border-black pt-2 mt-2">
          <span>TOTAL</span>
          <span>NPR {order.total?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span>Payment:</span>
          <span className="font-bold uppercase">{order.paymentMethod}</span>
        </div>
      </div>

      {/* Order-Level Notes (Delivery Instructions) - OK to show on customer receipt */}
      {order.notes && (
        <div className="mt-3 pt-3 border-t-2 border-dashed border-black">
          <p className="text-xs font-black uppercase mb-1">Delivery Instructions:</p>
          <p className="text-sm font-bold break-words">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-6 pt-3 border-t border-black text-xs">
        <p className="font-bold">Thank you for your order!</p>
        <p className="mt-1 text-gray-500">Powered by {theme.brand.name}</p>
      </div>
    </div>
  );
}