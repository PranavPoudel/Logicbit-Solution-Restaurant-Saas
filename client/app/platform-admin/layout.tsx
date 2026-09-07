// app/platform-admin/layout.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { PlatformAuthGuard } from "@/components/auth/platform-auth-guard";
import { usePlatformAuthStore } from "@/store/platform-auth-store";

const NAV_ITEMS = [{ label: "Advertisements", href: "/platform-admin/advertisements" }];

function PlatformAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const staff = usePlatformAuthStore((s) => s.staff);
  const logout = usePlatformAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push("/platform-admin/login");
  }

  return (
    <div className="flex h-screen bg-[#F7F7F5]">
      <aside className="w-56 bg-neutral-950 text-white flex flex-col">
        <div className="px-5 py-5 text-sm font-semibold border-b border-neutral-800">
          Platform Admin
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className={`block px-5 py-2.5 text-sm ${pathname === item.href ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-neutral-800 text-xs text-neutral-400">
          <p className="mb-2">{staff?.name ?? "Staff"}</p>
          <button onClick={handleLogout} className="text-neutral-300 hover:text-white">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/platform-admin/login") {
    return <>{children}</>;
  }

  return (
    <PlatformAuthGuard>
      <PlatformAdminShell>{children}</PlatformAdminShell>
    </PlatformAuthGuard>
  );
}