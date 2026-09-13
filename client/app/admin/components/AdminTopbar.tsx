'use client';
import { usePlatformAuthStore } from '@/store/platform-auth-store';
import { useRouter } from 'next/navigation';

export default function AdminTopbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  return (
    <header style={{ borderBottom: '1px solid #ccc', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
      <span>Platform Administration Console</span>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}