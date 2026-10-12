export function DiscountRow({ code, amount }: { code: string; amount: number }) {
  return (
    <div className="flex justify-between text-brand-success">
      <span>{`Discount (${code})`}</span>
      <span className="font-mono">- Rs {amount}</span>
    </div>
  );
}
