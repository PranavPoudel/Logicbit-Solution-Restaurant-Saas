'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformAuthStore } from '@/store/platform-auth-store';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  
  const setAccessToken = usePlatformAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAccessToken(token);
      setAuthorized(true);
    }
  }, [router, setAccessToken]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F5] text-gray-500">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}