// components/home/how-it-works.tsx
"use client";

import { Store, ShoppingBag, Bike } from "lucide-react";
import { theme } from "@/config/theme";

const STEPS = [
  {
    icon: Store,
    title: "Choose a restaurant",
    description: "Browse nearby places, search by name, or explore what's trending.",
  },
  {
    icon: ShoppingBag,
    title: "Place your order",
    description: "Pick your favourite dishes, add them to your cart and check out in seconds.",
  },
  {
    icon: Bike,
    title: "Get it delivered",
    description: "A rider brings your food hot and fresh straight to your door.",
  },
];

export function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <div className="text-center mb-10">
        <h2
          className="font-serif text-3xl sm:text-4xl"
          style={{ color: theme.colors.dark }}
        >
          How it works
        </h2>
        <p
          className="mt-2 text-sm sm:text-base"
          style={{ color: `${theme.colors.dark}8C` }}
        >
          Good food in three simple steps.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="relative bg-white rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ border: `1px solid ${theme.colors.dark}14` }}
            >
              <span
                className="absolute top-4 left-4 font-mono text-xs font-bold"
                style={{ color: `${theme.colors.dark}40` }}
              >
                0{i + 1}
              </span>
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: `${theme.colors.primary}14` }}
              >
                <Icon size={26} style={{ color: theme.colors.primary }} />
              </div>
              <h3
                className="font-serif font-semibold text-lg mt-4"
                style={{ color: theme.colors.dark }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm mt-1.5 leading-relaxed"
                style={{ color: `${theme.colors.dark}8C` }}
              >
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}