import { redirect } from "next/navigation";

export default function StorefrontRedirect() {
  // Automatically redirect to the Banners manager
  redirect("/storefront/banners");
}