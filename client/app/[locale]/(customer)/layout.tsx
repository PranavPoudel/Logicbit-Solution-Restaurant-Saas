// app/(customer)/layout.tsx
import { CustomerHeader } from "@/components/layout/customer-header";
import { LanguageSwitcherButton } from "@/components/ui/language-switcher-button";
import { CustomerFooter } from "@/components/home/homepage-footer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7]">
      <CustomerHeader />
      <main className="flex-1">{children}</main>
      <CustomerFooter />
      <div className="fixed bottom-4 right-4 z-50">
  <LanguageSwitcherButton />
</div>
    </div>
  );
}
