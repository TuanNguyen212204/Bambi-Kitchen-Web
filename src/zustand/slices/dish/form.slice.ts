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
    const isUpdate = payload.id != null
    
    // Theo OpenAPI v3: POST dùng chung cho create & update
    // Summary: "nếu update thì gửi id, còn create thì ko cần"
    // - Update: gửi id có giá trị
    // - Create: KHÔNG gửi field id (theo đúng ghi chú)
    if (isUpdate) {
      form.append("id", String(payload.id));
    }
    // Khi create: KHÔNG gửi field id (để backend tự tạo)
    
    form.append("name", payload.name);
    if (payload.description) form.append("description", payload.description);
    if (payload.price != null) form.append("price", String(payload.price));
    
    // Theo OpenAPI: account là required field
    // Ghi chú: "Account chỉ cần gửi Id, mấy field khác để trống"
    // Backend có thể expect account.id phải có giá trị, không null
    if (payload.account?.id != null) {
      form.append("account.id", String(payload.account.id));
    } else {
      // Nếu không có account.id, có thể cần gửi rỗng hoặc để backend tự lấy từ token
      // Nhưng theo OpenAPI, account là required nên phải có
      console.warn("Account ID is missing, backend may auto-assign from JWT token");
    }
    
    form.append("dishType", payload.dishType);
    if (payload.public != null) form.append("public", String(payload.public));
    if (payload.active != null) form.append("active", String(payload.active));
    
    // Gửi map ingredients: Id Ingredient và số lượng
    Object.entries(payload.ingredients || {})
      .filter(([, qty]) => qty > 0)
      .forEach(([ingId, qty]) => {
        form.append(`ingredients[${ingId}]`, String(qty));
      });
    
    // File upload (binary)
    if (payload.file instanceof File) {
      form.append("file", payload.file);
    } else {
      const emptyFile = new File([], "empty", { type: "application/octet-stream" });
      form.append("file", emptyFile);
    }
    
    // Dùng POST cho cả create và update (theo OpenAPI v3)
    await bambiApi.post(API_ENDPOINTS.API_DISHES, form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  saveCustomDish: async (id: number, isPublic: boolean) => {
    await bambiApi.put(API_ENDPOINTS.API_DISH_SAVE_CUSTOM, undefined, { params: { id, isPublic } });
  },
});


