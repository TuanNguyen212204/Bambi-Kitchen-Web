import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"

export interface DishFormPayload {
  id?: number
  name: string
  description?: string
  price?: number
  imageUrl?: string
  account?: { id: number }
  dishType: "PRESET" | "CUSTOM"
  ingredients: Record<number, number>
  public?: boolean
  active?: boolean
  file?: File
}

export interface DishFormSlice {
  createOrUpdate: (payload: DishFormPayload) => Promise<void>
  saveCustomDish: (id: number, isPublic: boolean) => Promise<void>
}

export const createDishFormSlice: StateCreator<
  DishFormSlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishFormSlice
> = () => ({
  createOrUpdate: async (payload: DishFormPayload) => {
    const form = new FormData();
    if (payload.id != null) form.append("id", String(payload.id));
    form.append("name", payload.name);
    if (payload.description) form.append("description", payload.description);
    if (payload.price != null) form.append("price", String(payload.price));
    if (payload.account?.id != null) form.append("account.id", String(payload.account.id));
    form.append("dishType", payload.dishType);
    if (payload.public != null) form.append("public", String(payload.public));
    if (payload.active != null) form.append("active", String(payload.active));
    Object.entries(payload.ingredients || {}).forEach(([ingId, qty]) => {
      form.append(`ingredients[${ingId}]`, String(qty));
    });
    if (payload.file instanceof File) {
      form.append("file", payload.file);
    } else {
      const emptyFile = new File([], "empty.txt", { type: "application/octet-stream" });
      form.append("file", emptyFile);
    }
    await bambiApi.post(API_ENDPOINTS.API_DISHES, form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  saveCustomDish: async (id: number, isPublic: boolean) => {
    await bambiApi.put(API_ENDPOINTS.API_DISH_SAVE_CUSTOM, undefined, { params: { id, isPublic } });
  },
});


