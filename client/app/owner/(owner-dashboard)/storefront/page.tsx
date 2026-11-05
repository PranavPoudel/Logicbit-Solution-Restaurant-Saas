//app/owner/(owner-dashboard)/storefront/page.tsx
import { redirect } from "next/navigation";

export default function StorefrontRedirect() {
  // Automatically redirect to the Banners manager
  redirect("/owner/storefront/builder");
}