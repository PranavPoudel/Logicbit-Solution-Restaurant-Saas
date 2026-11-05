// app/admin/layout.tsx
'use client';
import { usePathname } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import AdminAuthGuard from './components/AdminAuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/admin/login') {
    return <main>{children}</main>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-[#F7F7F5]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}