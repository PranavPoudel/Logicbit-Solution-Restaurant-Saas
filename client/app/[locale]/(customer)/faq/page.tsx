// app/[locale]/(customer)/faq/page.tsx
const FAQS = [
  {
    q: "How do I place an order?",
    a: "Pick a restaurant, add dishes to your cart, then go to checkout. Confirm your address and payment method and place your order.",
  },
  {
    q: "How long does delivery take?",
    a: "Each restaurant shows its estimated delivery time on its card and page. The time can change when the kitchen is busy.",
  },
  {
    q: "Which payment methods can I use?",
    a: "It depends on the restaurant. Options can include cash on delivery, credit card, eSewa, Khalti, PhonePe, PayPay and bank transfer. You can see what a restaurant accepts in its About us section.",
  },
  {
    q: "Can I cancel my order?",
    a: "You can cancel from Order history while the restaurant has not started preparing your food. After that, please contact the restaurant.",
  },
  {
    q: "How do refunds work?",
    a: "Each restaurant has its own refund policy, shown on its page. If your order is eligible, the refund goes back to your original payment method.",
  },
  {
    q: "How do I track my order?",
    a: "Open Order history from the top menu to see the live status of your order.",
  },
  {
    q: "How do I use a coupon?",
    a: "Add your items to the cart and enter the coupon code at checkout. Some offers are applied automatically.",
  },
  {
    q: "How can I contact support?",
    a: "Email support@logicbit.com or use the Ask us chat button at the bottom right of the page.",
  },
];

export default function FaqPage() {
  return (
    <section aria-labelledby="faq" className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10">
      <h1 id="faq" className="font-display text-[40px] font-extrabold leading-tight tracking-tight md:text-[56px]">
        Questions, answered.
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink/75">
        Quick answers about ordering, delivery, payments and refunds.
      </p>
      <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
        {FAQS.map((item) => (
          <div key={item.q} className="border-t-2 border-ink/10 pt-5">
            <dt className="font-display text-2xl font-extrabold">{item.q}</dt>
            <dd className="mt-2 text-lg text-ink/80">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}