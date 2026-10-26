// app/(customer)/layout.tsx
import { CustomerShell } from "@/components/layout/customer-shell";
import { CustomerHeader } from "@/components/layout/customer-header";
import { CustomerFooter } from "@/components/home/homepage-footer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerShell>
      <CustomerHeader />
      <main className="flex-1">{children}</main>
      <CustomerFooter />
    </CustomerShell>
  );
}
