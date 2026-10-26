// components/restaurant/restaurant-card-skeleton.tsx

export const RestaurantCardSkeleton = () => (
  <div className="rounded-[28px] bg-paper p-3 pb-5 shadow-soft" aria-hidden>
    <div className="aspect-[4/3] animate-pulse rounded-[20px] bg-ink/10" />
    <div className="space-y-3 px-2 pt-4">
      <div className="h-7 w-3/5 animate-pulse rounded-xl bg-ink/10" />
      <div className="flex gap-2">
        <div className="h-8 w-20 animate-pulse rounded-full bg-ink/10" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-ink/10" />
      </div>
      <div className="h-5 w-4/5 animate-pulse rounded-xl bg-ink/10" />
      <div className="flex justify-end"><div className="h-11 w-32 animate-pulse rounded-full bg-ink/10" /></div>
    </div>
  </div>
);
