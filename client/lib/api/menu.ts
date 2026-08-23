// lib/api/menu.ts — Module 7: Menu (Category, MenuItem, ModifierGroup) — Owner
import { ownerApiClient } from "@/lib/api/owner-client";

// --- Categories ---
export interface CategoryInput {
  name: string;
  displayOrder?: number;
  [key: string]: unknown;
}

export const categoriesApi = {
  create: async (restaurantId: string, input: CategoryInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/categories`, input)).data,
  list: async (restaurantId: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/categories`)).data,
  get: async (restaurantId: string, id: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/categories/${id}`)).data,
  update: async (restaurantId: string, id: string, input: Partial<CategoryInput>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/categories/${id}`, input)).data,
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/categories/${id}`)).data,
};

// --- Menu Items ---
export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export const menuItemsApi = {
  // Backend's CreateMenuItemDto field is `image`, not `imageUrl` — translate
  // here so the rest of the frontend can keep using the clearer `imageUrl`
  // name consistently.
  create: async (restaurantId: string, input: MenuItemInput) => {
    const { imageUrl, ...rest } = input;
    const payload = imageUrl !== undefined ? { ...rest, image: imageUrl } : rest;
    return (await ownerApiClient.post(`/restaurants/${restaurantId}/menu-items`, payload)).data;
  },
  list: async (restaurantId: string, categoryId?: string) =>
    (
      await ownerApiClient.get(`/restaurants/${restaurantId}/menu-items`, {
        params: categoryId ? { categoryId } : undefined,
      })
    ).data,
  get: async (restaurantId: string, id: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/menu-items/${id}`)).data,
  update: async (restaurantId: string, id: string, input: Partial<MenuItemInput>) => {
    const { imageUrl, ...rest } = input;
    const payload = imageUrl !== undefined ? { ...rest, image: imageUrl } : rest;
    return (await ownerApiClient.patch(`/restaurants/${restaurantId}/menu-items/${id}`, payload))
      .data;
  },
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/menu-items/${id}`)).data,
};

// --- Modifier Groups + Options ---
export interface ModifierGroupInput {
  name: string;
  minSelect?: number;
  maxSelect?: number;
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
    (
      await ownerApiClient.post(
        `/restaurants/${restaurantId}/modifier-groups/${groupId}/options`,
        input
      )
    ).data,
  updateOption: async (
    restaurantId: string,
    groupId: string,
    optionId: string,
    input: Partial<ModifierOptionInput>
  ) =>
    (
      await ownerApiClient.patch(
        `/restaurants/${restaurantId}/modifier-groups/${groupId}/options/${optionId}`,
        input
      )
    ).data,
  removeOption: async (restaurantId: string, groupId: string, optionId: string) =>
    (
      await ownerApiClient.delete(
        `/restaurants/${restaurantId}/modifier-groups/${groupId}/options/${optionId}`
      )
    ).data,

  linkToMenuItem: async (restaurantId: string, groupId: string, menuItemId: string) =>
    (
      await ownerApiClient.post(
        `/restaurants/${restaurantId}/modifier-groups/${groupId}/menu-items/${menuItemId}`
      )
    ).data,
  unlinkFromMenuItem: async (restaurantId: string, groupId: string, menuItemId: string) =>
    (
      await ownerApiClient.delete(
        `/restaurants/${restaurantId}/modifier-groups/${groupId}/menu-items/${menuItemId}`
      )
    ).data,
};