
// app/for-restaurants/page.tsx
"use client";
import Link from "next/link";
import { Store, TrendingUp, Clock, ChevronDown } from "lucide-react";
import { theme } from "@/config/theme";

const steps = theme.content.onboardingSteps;
const faqs = theme.content.faqs;

export default function ForRestaurantsPage() {
  return (
    <div style={{ backgroundColor: theme.colors.background }}>
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
        <div
          className="inline-flex items-center gap-1.5 bg-white text-xs px-3.5 py-1.5 rounded-full mb-6"
          style={{ border: `1px solid ${theme.colors.dark}1A`, color: `${theme.colors.dark}B3` }}
        >
          <Store size={13} style={{ color: theme.colors.primary }} />
          {theme.content.forRestaurantsBadge}
        </div>
        <h1
          className="font-serif text-4xl sm:text-6xl leading-[1.1] max-w-2xl mx-auto"
          style={{ color: theme.colors.dark }}
        >
          {theme.content.forRestaurantsHeadingPlain}{" "}
          <span className="italic" style={{ color: theme.colors.primary }}>
            {theme.content.forRestaurantsHeadingEmphasis}
          </span>
        </h1>
        <p className="text-base sm:text-lg mt-6 max-w-md mx-auto font-light" style={{ color: `${theme.colors.dark}8C` }}>
          {theme.content.forRestaurantsSubtext}
        </p>
        <Link
          href="/owner/register"
          className="inline-block mt-8 text-sm font-medium px-8 py-3 rounded-full transition-colors"
          style={{ backgroundColor: theme.colors.dark, color: theme.colors.background }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.darkHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.dark)}
        >
          {theme.content.registerCtaLabel}
        </Link>
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="font-serif text-3xl text-center mb-12" style={{ color: theme.colors.dark }}>
          {theme.content.howItWorksHeading}
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div
                className="w-12 h-12 rounded-full font-serif text-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${theme.colors.primary}1A`, color: theme.colors.primary }}
              >
                {i + 1}
              </div>
              <h3 className="font-serif text-lg mb-2" style={{ color: theme.colors.dark }}>
                {step.title}
              </h3>
              <p className="text-sm" style={{ color: `${theme.colors.dark}8C` }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Why join */}
      <div className="max-w-5xl mx-auto px-5 py-16">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${theme.colors.dark}14` }}>
            <TrendingUp size={22} style={{ color: theme.colors.primary }} className="mb-3" />
            <h3 className="font-serif text-lg mb-1" style={{ color: theme.colors.dark }}>
              {theme.content.growReachTitle}
            </h3>
            <p className="text-sm" style={{ color: `${theme.colors.dark}8C` }}>
              {theme.content.growReachDescription}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${theme.colors.dark}14` }}>
            <Clock size={22} style={{ color: theme.colors.primary }} className="mb-3" />
            <h3 className="font-serif text-lg mb-1" style={{ color: theme.colors.dark }}>
              {theme.content.manageRealTimeTitle}
            </h3>
            <p className="text-sm" style={{ color: `${theme.colors.dark}8C` }}>
              {theme.content.manageRealTimeDescription}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-5 py-16">
        <h2 className="font-serif text-3xl text-center mb-10" style={{ color: theme.colors.dark }}>
          {theme.content.faqHeading}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="bg-white rounded-2xl px-5 py-4 group"
              style={{ border: `1px solid ${theme.colors.dark}14` }}
            >
              <summary
                className="flex items-center justify-between cursor-pointer font-medium text-sm list-none"
                style={{ color: theme.colors.dark }}
              >
                {faq.question}
                <ChevronDown
                  size={16}
                  className="group-open:rotate-180 transition-transform"
                  style={{ color: `${theme.colors.dark}66` }}
                />
              </summary>
              <p className="text-sm mt-3" style={{ color: `${theme.colors.dark}8C` }}>
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <h2 className="font-serif text-3xl mb-4" style={{ color: theme.colors.dark }}>
          {theme.content.readyToStartHeading}
        </h2>
        <Link
          href="/owner/register"
          className="inline-block text-sm font-medium px-8 py-3 rounded-full transition-colors"
          style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primaryHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
        >
          {theme.content.registerCtaLabel}
        </Link>
      </div>
    </div>
  );
}