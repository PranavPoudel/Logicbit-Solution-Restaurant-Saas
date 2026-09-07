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
    <aside className="w-64 shrink-0 bg-[#1B2333] text-slate-300 flex flex-col h-full">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-white/10">
        <div className="w-7 h-7 rounded-md bg-[#E3A008] flex items-center justify-center text-[#1B2333] font-bold text-sm">
          L
        </div>
        <span className="text-white font-semibold tracking-tight">
          LogicBit
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group, i) => (
          <div key={i}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                const Icon = item.icon;
                
                // Check if this is the Storefront item and should show sub-items
                const showSubItems = item.label === "Storefront" && isStorefrontActive;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon
                        size={17}
                        className={isActive ? "text-[#E3A008]" : ""}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="text-[11px] font-semibold bg-[#E3A008] text-[#1B2333] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                    
                    {/* Sub-navigation for Storefront */}
                    {showSubItems && group.subItems && (
                      <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-3">
                        {group.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          const SubIcon = subItem.icon;
                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                                  isSubActive
                                    ? "bg-white/10 text-white"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
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

      <div className="border-t border-white/10 p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
            pathname?.startsWith("/settings")
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings size={17} />
          Settings
        </Link>
      </div>
    </aside>
  );
}