// app/for-restaurants/page.tsx
import Link from "next/link";
import { Store, TrendingUp, Clock, ChevronDown } from "lucide-react";

const steps = [
  {
    title: "Register your restaurant",
    description: "Sign up with your restaurant details and get set up in minutes.",
  },
  {
    title: "Add your menu",
    description: "Upload dishes, prices, and photos from anywhere, anytime.",
  },
  {
    title: "Start receiving orders",
    description: "Customers across Kathmandu can now find and order from you.",
  },
];

const faqs = [
  {
    question: "How much does it cost to join?",
    answer: "Free to register — see our pricing plans once you're set up.",
  },
  {
    question: "How do I get paid?",
    answer: "Payments are settled directly to your account on a regular schedule.",
  },
  {
    question: "Can I manage my menu myself?",
    answer: "Yes, you have full control to add, edit, or remove items anytime.",
  },
];

export default function ForRestaurantsPage() {
  return (
    <div className="bg-[#FDF6EC]">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 bg-white border border-[#2B1410]/10 text-[#2B1410]/70 text-xs px-3.5 py-1.5 rounded-full mb-6">
          <Store size={13} className="text-[#C0392B]" />
          For Restaurant Owners
        </div>
        <h1 className="font-serif text-[#2B1410] text-4xl sm:text-6xl leading-[1.1] max-w-2xl mx-auto">
          The online ordering system for{" "}
          <span className="italic text-[#C0392B]">your restaurant</span>
        </h1>
        <p className="text-[#2B1410]/55 text-base sm:text-lg mt-6 max-w-md mx-auto font-light">
          Reach more customers across Kathmandu and manage every order from one dashboard.
        </p>
        <Link
          href="/owner/register"
          className="inline-block mt-8 bg-[#2B1410] text-[#FDF6EC] text-sm font-medium px-8 py-3 rounded-full hover:bg-[#3D1E17] transition-colors"
        >
          Register your restaurant
        </Link>
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="font-serif text-[#2B1410] text-3xl text-center mb-12">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#C0392B]/10 text-[#C0392B] font-serif text-xl flex items-center justify-center mx-auto mb-4">
                {i + 1}
              </div>
              <h3 className="font-serif text-lg text-[#2B1410] mb-2">{step.title}</h3>
              <p className="text-[#2B1410]/55 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why join */}
      <div className="max-w-5xl mx-auto px-5 py-16">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#2B1410]/8">
            <TrendingUp size={22} className="text-[#C0392B] mb-3" />
            <h3 className="font-serif text-lg text-[#2B1410] mb-1">Grow your reach</h3>
            <p className="text-[#2B1410]/55 text-sm">
              Get discovered by hundreds of hungry customers across the city.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#2B1410]/8">
            <Clock size={22} className="text-[#C0392B] mb-3" />
            <h3 className="font-serif text-lg text-[#2B1410] mb-1">Manage in real time</h3>
            <p className="text-[#2B1410]/55 text-sm">
              Track and fulfill orders instantly from your own dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-5 py-16">
        <h2 className="font-serif text-[#2B1410] text-3xl text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="bg-white rounded-2xl border border-[#2B1410]/8 px-5 py-4 group"
            >
              <summary className="flex items-center justify-between cursor-pointer text-[#2B1410] font-medium text-sm list-none">
                {faq.question}
                <ChevronDown
                  size={16}
                  className="text-[#2B1410]/40 group-open:rotate-180 transition-transform"
                />
              </summary>
              <p className="text-[#2B1410]/55 text-sm mt-3">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <h2 className="font-serif text-[#2B1410] text-3xl mb-4">Ready to get started?</h2>
        <Link
          href="/owner/register"
          className="inline-block bg-[#C0392B] text-[#FDF6EC] text-sm font-medium px-8 py-3 rounded-full hover:bg-[#A8301F] transition-colors"
        >
          Register your restaurant
        </Link>
      </div>
    </div>
  );
}