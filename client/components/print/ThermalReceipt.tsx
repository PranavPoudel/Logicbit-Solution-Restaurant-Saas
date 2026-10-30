//components/print/ThermalReceipt.tsx
'use client';
import type { ReactNode } from 'react';
import { theme } from '@/config/theme';

interface ReceiptItem {
  name?: string;
  menuItem?: { name?: string };
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
  selectedModifiers?: { name?: string; optionName?: string }[];
}

interface ReceiptOrder {
  orderNumber?: string;
  orderType?: string;
  createdAt?: string;
  restaurant?: { name?: string; address?: string | null; phone?: string | null; currencyCode?: string };
  customer?: { name?: string; phone?: string | null };
  items?: ReceiptItem[];
  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  couponCode?: string;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string | null;
}

interface ThermalReceiptProps {
  order: ReceiptOrder;
}

const amount = (value?: number) => (value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const words = (value?: string) => (value ?? '').replace(/_/g, ' ').toLowerCase();

const Rule = ({ heavy }: { heavy?: boolean }) => (
  <div aria-hidden className={`my-3 border-black ${heavy ? 'border-t-4 border-double' : 'border-t border-dashed'}`} />
);

const Row = ({ label, children, bold }: { label: ReactNode; children: ReactNode; bold?: boolean }) => (
  <div className={`flex justify-between gap-3 ${bold ? 'font-bold' : ''}`}>
    <span>{label}</span>
    <span className="text-right">{children}</span>
  </div>
);

export function ThermalReceipt({ order }: ThermalReceiptProps) {
  const currency = order.restaurant?.currencyCode || theme.content.currencyCode;
  const created = order.createdAt ? new Date(order.createdAt) : null;
  const date = created?.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = created?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div id="printable-receipt" className="mx-auto max-w-[80mm] bg-white font-mono text-black">
      <div className="px-4 pb-6 pt-6 text-[12px] leading-snug">
        <header className="text-center">
          <h1 className="text-lg font-black uppercase tracking-wider">{order.restaurant?.name || 'Restaurant'}</h1>
          {order.restaurant?.address && <p className="mt-1">{order.restaurant.address}</p>}
          {order.restaurant?.phone && <p>Tel: {order.restaurant.phone}</p>}
        </header>

        <Rule />
        <p className="text-center text-sm font-black uppercase tracking-[0.3em]">Receipt</p>
        <Rule />

        <div className="space-y-1">
          <Row label="Order #">{order.orderNumber}</Row>
          {created && <Row label="Date">{date}</Row>}
          {created && <Row label="Time">{time}</Row>}
          <Row label="Type"><span className="capitalize">{words(order.orderType)}</span></Row>
          {order.customer?.name && <Row label="Customer">{order.customer.name}</Row>}
          {order.customer?.phone && <Row label="Phone">{order.customer.phone}</Row>}
        </div>

        <Rule heavy />

        <div className="flex justify-between font-black uppercase">
          <span>Qty Item</span>
          <span>Amount</span>
        </div>
        <Rule />

        <ul className="space-y-2">
          {order.items?.map((item, idx) => (
            <li key={idx}>
              <div className="flex justify-between gap-3 font-bold">
                <span className="flex-1">{item.quantity}x {item.menuItem?.name || item.name || 'Menu Item'}</span>
                <span className="shrink-0">{amount(item.subtotal)}</span>
              </div>
              {(item.quantity ?? 1) > 1 && item.unitPrice != null && (
                <div className="pl-5 text-gray-700">@ {amount(item.unitPrice)} each</div>
              )}
              {item.selectedModifiers?.map((mod, mIdx) => (
                <div key={mIdx} className="pl-5 text-gray-700">+ {mod.optionName || mod.name}</div>
              ))}
            </li>
          ))}
        </ul>

        <Rule />

        <div className="space-y-1">
          <Row label="Subtotal">{amount(order.subtotal)}</Row>
          {(order.deliveryFee ?? 0) > 0 && <Row label="Delivery fee">{amount(order.deliveryFee)}</Row>}
          {(order.discountAmount ?? 0) > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}>-{amount(order.discountAmount)}</Row>}
        </div>

        <Rule heavy />
        <div className="flex items-baseline justify-between gap-3 text-base font-black">
          <span>TOTAL</span>
          <span>{currency} {amount(order.total)}</span>
        </div>
        <Rule heavy />

        <div className="space-y-1">
          <Row label="Payment"><span className="uppercase">{order.paymentMethod}</span></Row>
          {order.paymentStatus && <Row label="Status"><span className="capitalize">{words(order.paymentStatus)}</span></Row>}
        </div>

        {order.notes && (
          <>
            <Rule />
            <p className="font-black uppercase">Delivery instructions</p>
            <p className="mt-1 break-words">{order.notes}</p>
          </>
        )}

        <Rule />
        <footer className="text-center">
          <p className="text-sm font-black uppercase tracking-wider">Thank you!</p>
          <p className="mt-1">We hope to see you again.</p>
          <p className="mt-3 text-gray-500">Powered by {theme.brand.name}</p>
        </footer>
      </div>
    </div>
  );
}
