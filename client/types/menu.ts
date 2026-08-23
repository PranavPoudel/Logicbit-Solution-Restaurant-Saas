// types/menu.ts

export interface RestaurantDetail {
  id: string;
  name?: string;
  slug?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  avgRating?: number;
  cuisines?: string[];
  isOpen?: boolean;
  distanceKm?: number;
  estimatedDeliveryMinutes?: number;
  about?: string;
  primaryColor?: string;
}

export interface MenuItem {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  hasModifiers?: boolean;
}

export interface ModifierOption {
  id: string;
  name?: string;
  extraPrice?: number;
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
  modifierGroups?: ModifierGroupDetail[];
}

export interface MenuCategory {
  id: string;
  name?: string;
  items?: MenuItem[];
}
