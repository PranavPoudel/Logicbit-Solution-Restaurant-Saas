// types/menu.ts
import type { CuisineLike } from "@/types/restaurant";
import type { DayHours, OpenStatus } from "@/types/hours";

export interface RestaurantDetail {
  id: string;
  name?: string;
  slug?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  avgRating?: number;
  totalReviews?: number;
  cuisines?: CuisineLike[];
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  openStatus?: OpenStatus;
  openingHours?: DayHours[] | null;
  timezone?: string;
  distanceKm?: number;
  estimatedDeliveryMinutes?: number;
  about?: string;
  primaryColor?: string;
  secondaryColor?: string;
  phone?: string;
  address?: string;
  city?: string;
  refundPolicy?: string | null;
  currencyCode?: string;
  supportsCod?: boolean;
  supportsEsewa?: boolean;
  supportsKhalti?: boolean;
  supportsCreditCard?: boolean;
  supportsIps?: boolean;
  supportsPhonePay?: boolean;
  supportsPaypay?: boolean;
}

export interface MenuItem {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  image?: string;
  isAvailable?: boolean;
  hasModifiers?: boolean;
  allergenInfo?: string;
  isFeatured?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  spiceLevel?: string;
}

export interface ModifierOption {
  id: string;
  name?: string;
  extraPrice?: number;
  allergenInfo?: string;
}

export interface ModifierGroupDetail {
  id: string;
  name?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  options?: ModifierOption[];
}

export interface MenuItemDetail extends MenuItem {
  ingredients?: string;
  spiceLevel?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  modifierGroups?: ModifierGroupDetail[];
}

export interface MenuCategory {
  id: string;
  name?: string;
  image?: string | null;
  items?: MenuItem[];
}
