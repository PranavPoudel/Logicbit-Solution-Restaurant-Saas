"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatformAuthStore } from "@/store/platform-auth-store";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  
  const { accessToken, setAccessToken } = usePlatformAuthStore((state) => ({
    accessToken: state.accessToken,
    setAccessToken: state.setAccessToken
  }));

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");

    if (!accessToken && !storedToken) {
      router.replace("/admin/login");
    } else {
      if (!accessToken && storedToken) {
        setAccessToken(storedToken);
      }
      setIsAuthorizing(false);
    }
  }, [accessToken, router, setAccessToken]);

  if (isAuthorizing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F5]">
        <div className="text-gray-500 animate-pulse text-sm font-medium">
          Verifying session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}