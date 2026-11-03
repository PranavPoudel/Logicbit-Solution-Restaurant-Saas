// lib/api/menu.ts
import { ownerApiClient } from "@/lib/api/owner-client";

// --- Categories ---
export interface CategoryInput {
  name: string; 
  nameJa?: string;
  description?: string;
  descriptionJa?: string;
  image?: string;
  displayOrder?: number;
  isFeatured?: boolean;
  isOnHomepage?: boolean;
  parentId?: string | null;
  [key: string]: unknown;
}

export const categoriesApi = {
  create: async (restaurantId: string, input: CategoryInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/categories`, input)).data,
  list: async (restaurantId: string, includeDeleted = false) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/categories`, {
      params: { includeDeleted },
    })).data,
  get: async (restaurantId: string, id: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/categories/${id}`)).data,
  update: async (restaurantId: string, id: string, input: Partial<CategoryInput>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/categories/${id}`, input)).data,
  remove: async (restaurantId: string, id: string) => // Soft delete
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/categories/${id}`)).data,
  restore: async (restaurantId: string, id: string) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/categories/${id}/restore`)).data,
  permanentDelete: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/categories/${id}/permanent`)).data,
};

// --- Menu Items ---
export interface MenuItemInput {
  name: string;
  nameJa?: string;
  description?: string;
  descriptionJa?: string;
  price: number;
  categoryId: string;
  image?: string | null; // null = remove the image
  galleryImages?: string[];
  isAvailable?: boolean;
  spiceLevel?: string;
  homepageSections?: string[];
  [key: string]: unknown;
}

export const menuItemsApi = {
  create: async (restaurantId: string, input: MenuItemInput) => {
    const { image, galleryImages, ...rest } = input;
    const payload = { ...rest, ...(image && { image }), ...(galleryImages && { galleryImages }) };
    return (await ownerApiClient.post(`/restaurants/${restaurantId}/menu-items`, payload)).data;
    },
  list: async (restaurantId: string, categoryId?: string, includeDeleted = false) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/menu-items`, {
      params: { categoryId, includeDeleted },
    })).data,
  get: async (restaurantId: string, id: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/menu-items/${id}`)).data,
  update: async (restaurantId: string, id: string, input: Partial<MenuItemInput>) => {
    const { image, galleryImages, ...rest } = input;
    const payload = { ...rest, ...(image !== undefined && { image }), ...(galleryImages !== undefined && { galleryImages }) };
    return (await ownerApiClient.patch(`/restaurants/${restaurantId}/menu-items/${id}`, payload)).data;
  },
  remove: async (restaurantId: string, id: string) => // Soft delete
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/menu-items/${id}`)).data,
  restore: async (restaurantId: string, id: string) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/menu-items/${id}/restore`)).data,
  permanentDelete: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/menu-items/${id}/permanent`)).data,
  findDuplicates: async (restaurantId: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/menu-items/duplicates`)).data,
};

// --- Modifier Groups + Options ---
export interface ModifierGroupInput {
  name: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  [key: string]: unknown;
}

export interface ModifierOptionInput {
  name: string;
  priceDelta?: number;
  [key: string]: unknown;
}

export const modifierGroupsApi = {
  create: async (restaurantId: string, input: ModifierGroupInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/modifier-groups`, input)).data,
  list: async (restaurantId: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/modifier-groups`)).data,
  get: async (restaurantId: string, id: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/modifier-groups/${id}`)).data,
  update: async (restaurantId: string, id: string, input: Partial<ModifierGroupInput>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/modifier-groups/${id}`, input)).data,
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/modifier-groups/${id}`)).data,

  addOption: async (restaurantId: string, groupId: string, input: ModifierOptionInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/modifier-groups/${groupId}/options`, input)).data,
  updateOption: async (restaurantId: string, groupId: string, optionId: string, input: Partial<ModifierOptionInput>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/modifier-groups/${groupId}/options/${optionId}`, input)).data,
  removeOption: async (restaurantId: string, groupId: string, optionId: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/modifier-groups/${groupId}/options/${optionId}`)).data,

  linkToMenuItem: async (restaurantId: string, groupId: string, menuItemId: string) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/modifier-groups/${groupId}/menu-items/${menuItemId}`)).data,
  unlinkFromMenuItem: async (restaurantId: string, groupId: string, menuItemId: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/modifier-groups/${groupId}/menu-items/${menuItemId}`)).data,
};
