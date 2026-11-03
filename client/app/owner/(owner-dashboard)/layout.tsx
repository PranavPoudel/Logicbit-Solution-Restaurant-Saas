// app/owner/(owner-dashboard)/layout.tsx
import { OwnerSidebar } from "@/components/layout/owner-sidebar";
import { OwnerTopbar } from "@/components/layout/owner-topbar";
import { OwnerCurrency } from "@/components/layout/owner-currency";
import { OwnerAuthGuard } from "@/components/auth/owner-auth-guard";
import { OrderPrintListener } from "@/components/print/OrderPrintListener";
import { SubscriptionUpgradeBanner } from "@/components/ui/subscription-upgrade-banner";
import { SubscriptionLock } from "@/components/ui/subscription-lock";

export default function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnerAuthGuard>
      <div className="flex h-screen bg-[#F7F7F5] overflow-hidden">
        <OwnerSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <OwnerTopbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <OwnerCurrency>
              <SubscriptionUpgradeBanner />
              <SubscriptionLock>{children}</SubscriptionLock>
            </OwnerCurrency>
          </main>
        </div>
      </div>

      {/* Global listener for auto-printing new orders */}
      <OrderPrintListener />
    </OwnerAuthGuard>
  );
}