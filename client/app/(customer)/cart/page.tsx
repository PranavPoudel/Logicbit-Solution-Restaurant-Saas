// app/(customer)/cart/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { CouponInput } from "@/components/cart/coupon-input";

const DELIVERY_FEE = 60; // TODO: replace with the distance-tiered fee from checkout preview

export default function CartPage() {
  const router = useRouter();
  const { items, restaurantId, subtotal } = useCartStore();
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const sub = subtotal();
  const total = Math.max(sub + DELIVERY_FEE - discount, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto text-neutral-300" size={32} />
        <p className="text-sm text-neutral-500 mt-3">Your cart is empty.</p>
        <Link
          href="/"
          className="inline-block mt-5 text-sm font-medium bg-[#17181C] text-white px-5 py-2.5 rounded-full"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-display font-semibold text-xl text-[#17181C] mb-4">Your cart</h1>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl px-4">
        {items.map((item) => (
          <CartItemRow key={item.menuItemId} item={item} />
        ))}
      </div>

      <div className="mt-4">
        <CouponInput
          restaurantId={restaurantId ?? ""}
          subtotal={sub}
          appliedCode={appliedCode}
          onApplied={(d, code) => {
            setDiscount(d);
            setAppliedCode(code);
          }}
          onRemove={() => {
            setDiscount(0);
            setAppliedCode(null);
          }}
        />
      </div>

      <div className="mt-5 bg-white border border-[#E8E7E2] rounded-2xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span className="font-mono">Rs {sub}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Delivery fee</span>
          <span className="font-mono">Rs {DELIVERY_FEE}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[#0F6B5C]">
            <span>Discount</span>
            <span className="font-mono">-Rs {discount}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-[#17181C] pt-2 border-t border-[#E8E7E2]">
          <span>Total</span>
          <span className="font-mono">Rs {total}</span>
        </div>
      </div>

      <button
        onClick={() => router.push("/checkout")}
        className="w-full mt-5 bg-[#17181C] text-white text-sm font-medium py-3.5 rounded-2xl"
      >
        Proceed to checkout — Rs {total}
      </button>
    </div>
  );
}
