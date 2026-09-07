// components/restaurant/restaurant-card-skeleton.tsx
export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#2B1410]/8 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-[#2B1410]/5" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 bg-[#2B1410]/5 rounded w-3/4" />
        <div className="h-4 bg-[#2B1410]/5 rounded-full w-1/3 mt-1.5" />
        <div className="h-3 bg-[#2B1410]/5 rounded w-2/3 mt-2.5" />
      </div>
    </div>
  );
}