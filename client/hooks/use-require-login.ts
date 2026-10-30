import { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

const loginUrl = (pathname: string) => `/login?next=${encodeURIComponent(pathname)}`;

export function useRequireLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);

  return function requireLogin(): boolean {
    if (isAuthenticated) return true;
    router.push(loginUrl(pathname));
    return false;
  };
}

export function useRedirectToLogin(): boolean {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const hydrated = useSyncExternalStore(
    (onChange) => useCustomerAuthStore.persist.onFinishHydration(onChange),
    () => useCustomerAuthStore.persist.hasHydrated(),
    () => false
  );

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace(loginUrl(pathname));
  }, [hydrated, isAuthenticated, router, pathname]);

  return hydrated && isAuthenticated;
}
