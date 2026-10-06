"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Star } from "lucide-react";
import { getNearbyRestaurants } from "@/lib/api/discovery";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { AppImage } from "@/components/ui/app-image";
import { cuisineList } from "@/lib/utils/cuisine";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useIsMounted } from "@/hooks/use-is-mounted";

const MAX_RESULTS = 6;

export function HeaderSearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState<DiscoveryRestaurant[] | null>(null);
  const [failed, setFailed] = useState(false);

  const mounted = useIsMounted();

  const requested = useRef(false);
  const loading = open && restaurants === null && !failed;
  useEffect(() => {
    if (!open || requested.current) return;
    requested.current = true;
    getNearbyRestaurants({ lat: 27.6766, lng: 85.3253, radiusKm: 20, limit: 50 })
      .then((res) => setRestaurants(res.data ?? []))
      .catch(() => {
        setRestaurants([]);
        setFailed(true);
      });
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEscapeKey(onClose, open);

  const q = query.trim().toLowerCase();
  const all = restaurants ?? [];
  const matches = q
    ? all.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          cuisineList(r.cuisines).some((c) => c.name.toLowerCase().includes(q))
      )
    : all;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  function goToFullResults(e?: React.FormEvent) {
    e?.preventDefault();
    onClose();
    router.push(q ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  }

  return createPortal(
      <div
        role="dialog"
        aria-label="Search"
        aria-hidden={!open}
        inert={!open}
        style={{ height: open ? "calc(100dvh - 72px)" : 0 }}
        className="fixed inset-x-0 top-[72px] z-20 overflow-hidden bg-brand-surface transition-[height] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      >
        <div className="h-[calc(100dvh-72px)] overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <form onSubmit={goToFullResults} className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/45" />
            <input
              aria-label="Search restaurants"
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants"
              className="w-full h-14 rounded-full border border-brand-dark/15 bg-white pl-11 pr-12 text-lg text-brand-dark placeholder:text-brand-dark/40 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-brand-dark/50 hover:bg-brand-dark/8 hover:text-brand-dark"
            >
              <X size={16} />
            </button>
          </form>

          <div className="mt-6">
            {loading && (
              <p className="flex items-center gap-2 py-6 justify-center text-sm text-brand-dark/50">
                <Loader2 size={16} className="animate-spin" /> Loading restaurants…
              </p>
            )}

            {!loading && failed && (
              <p className="py-6 text-center text-sm text-red-600">Couldn&apos;t load restaurants. Please try again.</p>
            )}

            {!loading && !failed && matches.length === 0 && (
              <p className="py-6 text-center text-sm text-brand-dark/50">
                {q ? `No restaurants found for "${query.trim()}".` : "No restaurants available right now."}
              </p>
            )}

            {!loading && matches.length > 0 && (
              <>
                <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-brand-dark/45">
                  {q ? "Results" : "Restaurants near you"}
                </p>
                <ul className="space-y-1">
                  {matches.slice(0, MAX_RESULTS).map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/restaurants/${r.slug ?? r.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-xl p-2 hover:bg-brand-dark/5 transition-colors"
                      >
                        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-brand-dark/8">
                          {r.coverImageUrl && (
                            <AppImage
                              sizes="64px"
                              src={r.coverImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif font-semibold text-brand-dark truncate">{r.name}</p>
                          <p className="text-xs text-brand-dark/55 truncate">
                            {cuisineList(r.cuisines).map((c) => c.name).join(" · ")}
                            {typeof r.distanceKm === "number" && ` · ${r.distanceKm.toFixed(1)} km`}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 text-xs">
                          {typeof r.avgRating === "number" && (
                            <span className="flex items-center gap-1 font-mono text-brand-dark/70">
                              <Star size={12} className="fill-brand-gold text-brand-gold" />
                              {r.avgRating.toFixed(1)}
                            </span>
                          )}
                          <span
                            className={`rounded-md px-2 py-0.5 font-mono font-bold uppercase text-[10px] ${
                              r.isOpen !== false ? "bg-brand-open-bg text-brand-open-text" : "bg-brand-dark/10 text-brand-dark/60"
                            }`}
                          >
                            {r.isOpen !== false ? "Open" : "Closed"}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                {matches.length > MAX_RESULTS && (
                  <button
                    type="button"
                    onClick={() => goToFullResults()}
                    className="mt-3 w-full rounded-full border border-brand-dark/15 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand-dark/5"
                  >
                    {`See all ${matches.length} results`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>,
    document.body
  );
}
