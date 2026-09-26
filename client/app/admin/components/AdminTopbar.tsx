'use client';
import { usePlatformAuthStore } from '@/store/platform-auth-store';

export default function AdminTopbar() {
  const staff = usePlatformAuthStore((state) => state.staff);
  const logout = usePlatformAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm">
      <div className="text-gray-600 font-medium text-sm hidden sm:block">
        Platform Administration Console
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
        {staff && (
          <div className="text-sm text-gray-700 font-medium">
            {staff.name || staff.email}
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg transition-all"
        >
          Logout
        </button>
      </div>
    </header>
  );
}