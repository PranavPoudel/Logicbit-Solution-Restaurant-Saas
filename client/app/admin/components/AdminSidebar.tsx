'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard' },
  { name: 'Staff', path: '/admin/staff' },
  { name: 'Roles', path: '/admin/roles' },
  { name: 'Cuisines', path: '/admin/cuisines' },
  { name: 'Plans', path: '/admin/subscriptions/plans' },
  { name: 'Advertisements', path: '/admin/advertisements' },
  { name: 'Settlements', path: '/admin/settlements' },
  { name: 'Revenue', path: '/admin/revenue' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
      <div className="p-6 border-b border-gray-100 flex items-center h-16">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Platform Admin</h3>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}