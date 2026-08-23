// app/(customer)/layout.tsx
import { CustomerHeader } from "@/components/layout/customer-header";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7]">
      <CustomerHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
