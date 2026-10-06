import { useRouter, usePathname } from "next/navigation";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

export function useRequireLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);

  return function requireLogin(): boolean {
    if (isAuthenticated) return true;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return false;
  };
}
