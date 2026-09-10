// components/layout/owner-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  LayoutTemplate,
  TicketPercent,
  Megaphone,
  Star,
  Wallet,
  Users,
  Bike,
  Settings,
  Image as ImageIcon,
  FileText,
  Bell,
  CreditCard,
  type LucideIcon,
  BarChart3,
  LayoutGrid,
  Calendar, // 🆕 Added for Tables
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
  subItems?: {
    label: string;
    href: string;
    icon: LucideIcon;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { label: "Orders", href: "/orders", icon: Package },
      { label: "Menu", href: "/menu", icon: UtensilsCrossed },
      { label: "Tables", href: "/tables", icon: LayoutGrid }, 
      { label: "Reservations", href: "/reservations", icon: Calendar }, 
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      {
        label: "Storefront",
        href: "/storefront/banners",
        icon: LayoutTemplate,
      },
    ],
    subItems: [
      { label: "Banners", href: "/storefront/banners", icon: ImageIcon },
      { label: "Configuration", href: "/storefront/config", icon: FileText },
      { label: "Popups", href: "/storefront/popups", icon: Bell },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Coupons", href: "/coupons", icon: TicketPercent },
      { label: "Advertising", href: "/advertising", icon: Megaphone },
      { label: "Reviews", href: "/reviews", icon: Star },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Settlements", href: "/settlements", icon: Wallet },
      { label: "Subscription", href: "/subscriptions", icon: CreditCard },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Staff", href: "/staff", icon: Users },
      { label: "Delivery Persons", href: "/delivery-persons", icon: Bike },
    ],
  },
];

export function OwnerSidebar() {
  const pathname = usePathname();
  const isStorefrontActive = pathname?.startsWith("/storefront");

  return (
    <aside className="w-64 shrink-0 bg-[#111827] text-slate-300 flex flex-col h-full border-r border-white/5">
      {/* Logo Area */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-[#E3A008] flex items-center justify-center text-[#111827] font-bold text-base shadow-sm">
          L
        </div>
        <span className="text-white font-semibold tracking-tight text-lg">
          LogicBit
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navGroups.map((group, i) => (
          <div key={i}>
            {group.label && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                const Icon = item.icon;
                const showSubItems = item.label === "Storefront" && isStorefrontActive;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-r-md text-sm font-medium transition-all duration-200 border-l-2 ${
                        isActive
                          ? "bg-white/5 text-white border-[#E3A008]"
                          : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={isActive ? "text-[#E3A008]" : "text-slate-500"}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="text-[10px] font-bold bg-[#E3A008] text-[#111827] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>

                    {/* Sub-navigation for Storefront */}
                    {showSubItems && group.subItems && (
                      <ul className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                        {group.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          const SubIcon = subItem.icon;
                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                                  isSubActive
                                    ? "bg-white/5 text-white"
                                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                                }`}
                              >
                                <SubIcon size={14} />
                                <span>{subItem.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Settings Footer */}
      <div className="border-t border-white/5 p-3 bg-[#0F172A]/50">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-r-md text-sm font-medium transition-all duration-200 border-l-2 ${
            pathname?.startsWith("/settings")
              ? "bg-white/5 text-white border-[#E3A008]"
              : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"
          }`}
        >
          <Settings size={18} className={pathname?.startsWith("/settings") ? "text-[#E3A008]" : "text-slate-500"} />
          Settings
        </Link>
      </div>
    </aside>
  );
}