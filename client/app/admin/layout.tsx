'use client';
import { usePathname } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import AdminAuthGuard from './components/AdminAuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  return (
    <AdminAuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AdminTopbar />
          <main style={{ padding: '1.5rem', flex: 1 }}>{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}