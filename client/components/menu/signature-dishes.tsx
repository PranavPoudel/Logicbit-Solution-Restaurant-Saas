// components/menu/signature-dishes.tsx
"use client";

import { theme } from "@/config/theme";

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
      <h3 className="font-serif text-lg mb-3" style={{ color: theme.colors.dark }}>
        {theme.content.signatureDishesHeading}
      </h3>
      <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {mockDishes.map((dish) => (
          <div key={dish.id} className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: `${theme.colors.primary}1A`,
                border: `1px solid ${theme.colors.primary}33`,
              }}
            >
              {dish.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-lg" style={{ color: theme.colors.primary }}>
                  {dish.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-xs font-medium" style={{ color: `${theme.colors.dark}B3` }}>
              {dish.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}