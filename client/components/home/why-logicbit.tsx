// components/home/why-logicbit.tsx
"use client";

import { Bike, MapPin, Wallet, Receipt } from "lucide-react";
import { theme } from "@/config/theme";

const POINTS = [
  {
    icon: Bike,
    title: "Fast delivery",
    description: "Local restaurants, delivered hot and fresh to your door.",
  },
  {
    icon: MapPin,
    title: "Live order tracking",
    description: "Follow your order from the kitchen all the way to you.",
  },
  {
    icon: Wallet,
    title: "Cash on delivery",
    description: "Pay when your food arrives. No card needed.",
  },
  {
    icon: Receipt,
    title: "Fair delivery fee",
    description: "The fee depends on the distance, so you only pay for what you need.",
  },
];

export function WhyLogicBit() {
  return (
    <section className="max-w-6xl mx-auto px-5 pb-14">
      <div className="text-center mb-10">
        <h2
          className="font-serif text-3xl sm:text-4xl"
          style={{ color: theme.colors.dark }}
        >
          Why order with LogicBit
        </h2>
        <p
          className="mt-2 text-sm sm:text-base"
          style={{ color: `${theme.colors.dark}8C` }}
        >
          Simple, local and made for you.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((point) => {
          const Icon = point.icon;
          return (
            <div
              key={point.title}
              className="rounded-2xl p-6"
              style={{ backgroundColor: `${theme.colors.primary}0D` }}
            >
              <Icon size={28} style={{ color: theme.colors.primary }} />
              <h3
                className="font-serif font-semibold text-lg mt-3"
                style={{ color: theme.colors.dark }}
              >
                {point.title}
              </h3>
              <p
                className="text-sm mt-1.5 leading-relaxed"
                style={{ color: `${theme.colors.dark}8C` }}
              >
                {point.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}