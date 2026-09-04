// components/menu/signature-dishes.tsx
"use client";

interface SignatureDish {
  id: string;
  name: string;
  imageUrl?: string;
}

// PLACEHOLDER — wired to restaurant-specific "signature dishes" data
// once backend endpoint is confirmed.
const mockDishes: SignatureDish[] = [
  { id: "1", name: "Momo" },
  { id: "2", name: "Curry" },
  { id: "3", name: "Naan" },
  { id: "4", name: "Salad" },
];

export function SignatureDishes() {
  return (
    <div className="py-4">
      <h3 className="font-serif text-lg text-[#2B1410] mb-3">Signature Dishes</h3>
      <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {mockDishes.map((dish) => (
          <div key={dish.id} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#C0392B]/10 border border-[#C0392B]/20 overflow-hidden flex items-center justify-center">
              {dish.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#C0392B] font-serif text-lg">
                  {dish.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-xs text-[#2B1410]/70 font-medium">{dish.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}