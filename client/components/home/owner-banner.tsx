// components/home/owner-banner.tsx
"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { theme } from "@/config/theme";

export function OwnerBanner() {
  return (
    <section className="max-w-6xl mx-auto px-5 pb-16">
      <div
        className="rounded-3xl px-6 py-10 sm:px-12 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
        style={{ backgroundColor: theme.colors.dark }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${theme.colors.background}1A` }}
          >
            <Store size={26} style={{ color: theme.colors.background }} />
          </div>
          <div>
            <h2
              className="font-serif text-2xl sm:text-3xl"
              style={{ color: theme.colors.background }}
            >
              Own a restaurant?
            </h2>
            <p
              className="mt-1 text-sm sm:text-base"
              style={{ color: `${theme.colors.background}B3` }}
            >
              Join LogicBit and start taking online orders today.
            </p>
          </div>
        </div>

        <Link
          href="/for-restaurants"
          className="shrink-0 text-sm font-medium px-6 py-3 rounded-full active:scale-95 transition-all duration-200"
          style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
        >
          Join LogicBit
        </Link>
      </div>
    </section>
  );
}