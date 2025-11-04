import type { StateCreator } from "zustand"
import type { IngredientFormSlice } from "@/zustand/types"
import type { Ingredient } from "@models/ingredient/ingredient"

const validateFileSize = (file: File): boolean => {
  return file.size <= 2 * 1024 * 1024
}

const validateFileType = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  return allowedTypes.includes(file.type)
}

const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      const maxWidth = 800
      const maxHeight = 600
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(resizedFile)
        } else {
          resolve(file)
        }
      }, file.type, 0.8)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

export const createIngredientFormSlice: StateCreator<IngredientFormSlice, [], [], IngredientFormSlice> = () => ({
  create: async (payload) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('categoryId', payload.categoryId.toString())
      formData.append('unit', payload.unit)
      if (payload.pricePerUnit !== undefined && payload.pricePerUnit !== null) {
        formData.append('pricePerUnit', payload.pricePerUnit.toString())
      }
      if (payload.file) {
        formData.append('file', payload.file)
      }

      const createdRes = await bambiApi.post<Ingredient>(API_ENDPOINTS.API_INGREDIENTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { useIngredientStore } = await import("@zustand/stores/ingredients")
      try {
        const id = (createdRes.data as { id?: number })?.id
        if (typeof id === 'number') {
          const current = useIngredientStore.getState().sessionCreatedIds || []
          useIngredientStore.setState({ sessionCreatedIds: Array.from(new Set([...current, id])) })
        }
      } catch { }
      await useIngredientStore.getState().fetchAll()

      const { toast } = await import("sonner")
      toast.success("Đã thêm nguyên liệu")
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Thêm nguyên liệu thất bại")
    }
  },

  update: async (payload) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const formData = new FormData()
      
      formData.append('id', String(payload.id))
      formData.append('name', payload.name ?? '')
      if (typeof payload.categoryId === 'number') formData.append('categoryId', String(payload.categoryId))
      formData.append('unit', payload.unit ?? '')
      formData.append('active', payload.active !== undefined ? String(payload.active) : '')
      if (typeof payload.available === 'number') {
        formData.append('available', String(payload.available))
      }
      if (typeof payload.quantity === 'number') {
        formData.append('quantity', String(payload.quantity))
      }
      if (typeof payload.reserve === 'number') {
        formData.append('reserve', String(payload.reserve))
      }
      // Always send pricePerUnit if it's a valid number, including 0
      if (typeof payload.pricePerUnit === 'number' && !isNaN(payload.pricePerUnit)) {
        formData.append('pricePerUnit', payload.pricePerUnit.toString())
      } else if (payload.pricePerUnit === null || payload.pricePerUnit === undefined) {
        // Explicitly send empty string or null if clearing the price
        formData.append('pricePerUnit', '')
      }

      if (payload.file) {
        if (!validateFileSize(payload.file)) {
          const { toast } = await import("sonner")
          toast.error("File quá lớn (tối đa 2MB)")
          return
        }
        
        if (!validateFileType(payload.file)) {
          const { toast } = await import("sonner")
          toast.error("Chỉ chấp nhận file JPG, JPEG, PNG")
          return
        }
        
        const resizedFile = await resizeImage(payload.file)
        formData.append('file', resizedFile)
      } else if (payload.removeImage) {
        formData.append('file', new File([], "empty", { type: "image/jpeg" }))
      } else {
        formData.append('file', new File([""], "empty", { type: "application/octet-stream" }))
      }
      
      const ingredientParams = {
        id: payload.id,
        name: payload.name,
        ...(typeof payload.categoryId === 'number' ? { categoryId: payload.categoryId } : {}),
        ...(payload.unit ? { unit: payload.unit } : {}),
        ...(typeof payload.active === 'boolean' ? { active: payload.active } : {}),
        ...(typeof payload.quantity === 'number' ? { quantity: payload.quantity } : {}),
        ...(typeof payload.available === 'number' ? { available: payload.available } : {}),
        ...(typeof payload.reserve === 'number' ? { reserve: payload.reserve } : {}),
        // Include pricePerUnit if it's a valid number (including 0), or explicitly send null/undefined
        ...(typeof payload.pricePerUnit === 'number' && !isNaN(payload.pricePerUnit) 
          ? { pricePerUnit: payload.pricePerUnit } 
          : payload.pricePerUnit === null || payload.pricePerUnit === undefined
          ? { pricePerUnit: null }
          : {}),
      }
      await bambiApi.put(API_ENDPOINTS.API_INGREDIENTS, formData, {
        params: { ingredient: ingredientParams },
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      // Refresh the ingredient list after updating
      const { useIngredientStore } = await import("@zustand/stores/ingredients")
      useIngredientStore.getState().fetchAll()
      
      if (!payload.silent) {
        const { toast } = await import("sonner")
        toast.success("Đã cập nhật nguyên liệu")
      }
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Cập nhật nguyên liệu thất bại")
    }
  },

  remove: async (id) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.delete(API_ENDPOINTS.API_INGREDIENT_BY_ID(id))
      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error("Delete failed")
      }
      
      // Optimistic update: remove from current state immediately
      const { useIngredientStore } = await import("@zustand/stores/ingredients")
      const current = useIngredientStore.getState().items
      useIngredientStore.setState({ items: current.filter(i => i.id !== id) })
      // Then refetch to be consistent with server
      useIngredientStore.getState().fetchAll()
      
      const { toast } = await import("sonner")
      toast.success("Đã xóa nguyên liệu")
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Xóa nguyên liệu thất bại")
    }
  },

  toggleActive: async (id, active) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.get(API_ENDPOINTS.API_INGREDIENT_TOGGLE_ACTIVE(id))

      const { useIngredientStore } = await import("@zustand/stores/ingredients")
      const items = useIngredientStore.getState().items
      useIngredientStore.setState({ items: items.map(i => i.id === id ? { ...i, active } : i) })
    } catch {
      const { toast } = await import("sonner")
      toast.error("Cập nhật trạng thái nguyên liệu thất bại")
    }
  },
})