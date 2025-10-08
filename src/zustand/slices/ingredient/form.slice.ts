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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createIngredientFormSlice: StateCreator<IngredientFormSlice, [], [], IngredientFormSlice> = (_set, _get, _store) => ({
  create: async (payload) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('categoryId', payload.categoryId.toString())
      formData.append('unit', payload.unit)
      
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
      }

      await bambiApi.post<Ingredient>(API_ENDPOINTS.API_INGREDIENTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const { toast } = await import("sonner")
      toast.success("Đã thêm nguyên liệu")
    } catch {
      const { toast } = await import("sonner")
      toast.error("Thêm nguyên liệu thất bại")
    }
  },

  update: async (payload) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const formData = new FormData()
      formData.append('name', payload.name)
      
      if (payload.categoryId !== undefined) {
        formData.append('categoryId', payload.categoryId.toString())
      }
      
      if (payload.unit !== undefined) {
        formData.append('unit', payload.unit)
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
      }
      
      if (payload.active !== undefined) {
        formData.append('active', payload.active.toString())
      }
      
      if (payload.removeImage) {
        formData.append('file', "")
      }
      
      await bambiApi.put(API_ENDPOINTS.API_INGREDIENTS, formData, {
        params: { ingredient: { id: payload.id } }
      })
      
      const { toast } = await import("sonner")
      toast.success("Đã cập nhật nguyên liệu")
    } catch {
      const { toast } = await import("sonner")
      toast.error("Cập nhật nguyên liệu thất bại")
    }
  },

  remove: async (id) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.delete(API_ENDPOINTS.API_INGREDIENTS, {
        params: { ingredient: { id } }
      })
      
      const { toast } = await import("sonner")
      toast.success("Đã xóa nguyên liệu")
    } catch {
      const { toast } = await import("sonner")
      toast.error("Xóa nguyên liệu thất bại")
    }
  },
})