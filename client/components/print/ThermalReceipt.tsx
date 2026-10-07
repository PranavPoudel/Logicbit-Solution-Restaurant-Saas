'use client';

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
      <div className="text-center border-b border-black pb-2 mb-2">
        <h1 className="text-xl font-bold uppercase">{order.restaurant?.name || 'Restaurant'}</h1>
        <p className="text-xs mt-1">{order.restaurant?.address || ''}</p>
        <p className="text-xs">{order.restaurant?.phone || ''}</p>
      </div>

      {/* Order Meta */}
      <div className="border-b border-black pb-2 mb-2 text-xs">
        <div className="flex justify-between">
          <span>Order:</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span>{order.orderType}</span>
        </div>
        {order.customer?.name && (
          <div className="flex justify-between mt-1">
            <span>Customer:</span>
            <span>{order.customer.name} {order.customer.phone ? `(${order.customer.phone})` : ''}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-b border-black pb-2 mb-2">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{item.quantity}x {item.menuItem.name}</span>
              <span>NPR {item.subtotal.toFixed(2)}</span>
            </div>
            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
              <div className="pl-4 text-xs text-gray-700">
                {item.selectedModifiers.map((mod: any, mIdx: number) => (
                  <div key={mIdx}>+ {mod.name} (NPR {mod.price})</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>NPR {order.subtotal.toFixed(2)}</span>
        </div>
        {order.deliveryFee > 0 && (
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>NPR {order.deliveryFee.toFixed(2)}</span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount ({order.couponCode})</span>
            <span>- NPR {order.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t border-black pt-1 mt-1">
          <span>TOTAL</span>
          <span>NPR {order.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Payment:</span>
          <span>{order.paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-2 border-t border-black text-xs">
        <p>Thank you for your order!</p>
        <p className="mt-1">Powered by LogicBit</p>
      </div>
    </div>
  );
}