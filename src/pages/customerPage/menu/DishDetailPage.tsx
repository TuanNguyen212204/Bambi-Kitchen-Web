import React, { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { BookmarkCheck, ChefHat, Flame, Loader2, ShoppingCart, Sparkles } from "lucide-react"
import { Button } from "@components/ui/button"
import { PATHS } from "@config/path"
import { bambiApi, bambiPublicApi, API_ENDPOINTS } from "@/utils/api"
import { extractErrorMessage } from "@/utils/errors"
import { useAuthStore } from "@zustand/stores/auth"
import { useIngredientStore } from "@zustand/stores/ingredients"
import type { StoreIngredient } from "@/zustand/types/ingredient"
import { toast } from "sonner"
import PresetDishModal from "@components/customer/menu/PresetDishModal"
import type { DishItem } from "@/zustand/slices/dish/list.slice"
import TunaImg from "@assets/Menu/tuna.png"
import PorkImg from "@assets/Menu/pork.png"
import BeefImg from "@assets/Menu/beef.png"
import ShrimpsImg from "@assets/Menu/shrimps.png"

interface DishResponse {
  id: number
  name: string
  description?: string
  price?: number
  imageUrl?: string
  imgUrl?: string
  public?: boolean
  active?: boolean
  usedQuantity?: number
  used?: number
  dishType?: string
  dish_category_id?: number
}

interface IngredientCategoryInfo {
  id?: number
  name?: string
}

interface IngredientSummary {
  id: number
  name: string
  quantity: number
  storedQuantity?: number
  unit?: string
  category?: IngredientCategoryInfo
  imageUrl?: string
}

const fallbackImages = [TunaImg, PorkImg, BeefImg, ShrimpsImg]

const getFallbackImage = (dishId?: number) => {
  if (!dishId) return fallbackImages[0]
  const index = dishId % fallbackImages.length
  return fallbackImages[index]
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value ?? 0)

const DishDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dishId = Number(id)

  const { isAuthenticated, token } = useAuthStore()
  const ingredientItems = useIngredientStore((state) => state.items)
  const fetchIngredients = useIngredientStore((state) => state.fetchAll)

  const [dish, setDish] = useState<DishResponse | null>(null)
  const [rawIngredientsData, setRawIngredientsData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [presetModalOpen, setPresetModalOpen] = useState(false)

  useEffect(() => {
    if (ingredientItems.length === 0) {
      fetchIngredients().catch(() => undefined)
    }
  }, [fetchIngredients, ingredientItems.length])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [dishId])

  useEffect(() => {
    if (!dishId || Number.isNaN(dishId)) {
      setError("Không tìm thấy món ăn")
      setLoading(false)
      return
    }

    let mounted = true
    const controller = new AbortController()

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const client = token ? bambiApi : bambiPublicApi
        const requestOptions = {
          signal: controller.signal,
          headers: { "x-silent-error": "1" },
        } as const
        const [dishRes, recipeRes] = await Promise.all([
          client.get<DishResponse>(API_ENDPOINTS.API_DISH_BY_ID(dishId), requestOptions),
          client.get<unknown>(API_ENDPOINTS.API_RECIPE_BY_DISH(dishId), requestOptions),
        ])

        if (!mounted) return

        setDish(dishRes.data)
        setRawIngredientsData(recipeRes.data)
      } catch (err) {
        if (!mounted) return
        const status = (err as { response?: { status?: number } })?.response?.status
        if (!token && status === 401) {
          setError("Bạn cần đăng nhập để xem chi tiết món ăn.")
          return
        }
        const message = extractErrorMessage(err) || "Không thể tải thông tin món ăn"
        setError(message)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [dishId, token])

  const ingredients = useMemo(
    () => normalizeRecipeResponse(rawIngredientsData, ingredientItems),
    [rawIngredientsData, ingredientItems],
  )

  const dishForModal: DishItem | null = useMemo(() => {
    if (!dish) return null
    return {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      imageUrl: dish.imageUrl || dish.imgUrl,
      public: dish.public,
      active: dish.active,
      usedQuantity: dish.usedQuantity ?? dish.used,
      categoryId: dish.dish_category_id,
    }
  }, [dish])

  const handleBackToMenu = () => {
    const backHref = location.state?.from || PATHS.MENU
    navigate(backHref, { replace: true })
  }

  const handleOpenPresetModal = () => {
    if (!dishForModal) return
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thêm món vào giỏ hàng", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate(PATHS.LOGIN, { state: { from: location.pathname } }),
        },
      })
      return
    }
    setPresetModalOpen(true)
  }

  const totalIngredients = ingredients.length

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
            Đang tải thông tin món ăn...
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto mt-10 p-6 text-center bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-red-600 font-semibold mb-2">Có lỗi xảy ra</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button onClick={handleBackToMenu} variant="outline" className="border-red-200 text-red-600">
              Quay lại menu
            </Button>
          </div>
        ) : dish ? (
          <>
            <section className="mt-4 bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative bg-white p-6 sm:p-8 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#f97316_0,_transparent_70%)]" />
                  <div className="relative z-10 w-full max-w-md">
                    <div className="rounded-full overflow-hidden shadow-xl border-4 border-white">
                      <img
                        src={dish.imageUrl || dish.imgUrl || getFallbackImage(dish.id)}
                        alt={dish.name}
                        className="w-full aspect-square object-cover"
                        onError={(event) => {
                          const target = event.currentTarget
                          target.src = getFallbackImage(dish.id)
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 lg:p-10 flex flex-col justify-center gap-6 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wide">
                      <ChefHat size={16} />
                      {dish.dishType === "CUSTOM" ? "Custom Bowl" : "Signature Dish"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        dish.active ?? true ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      <Flame size={16} />
                      {dish.active ?? true ? "Đang phục vụ" : "Tạm ngưng"}
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{dish.name}</h1>
                    {dish.description ? (
                      <p className="text-gray-600 leading-relaxed">{dish.description}</p>
                    ) : (
                      <p className="text-gray-500">
                        Món ăn tươi ngon với nguyên liệu được chọn lọc kỹ càng, phù hợp cho mọi thực đơn healthy.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                      <p className="text-xs text-orange-500 uppercase font-semibold">Giá hiện tại</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(dish.price)}</p>
                    </div>
                    <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                      <p className="text-xs text-orange-500 uppercase font-semibold">Phục vụ</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {(dish.usedQuantity ?? dish.used ?? 0).toLocaleString("vi-VN")} lượt
                      </p>
                    </div>
                    <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                      <p className="text-xs text-orange-500 uppercase font-semibold">Tình trạng</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {dish.public === false ? "Riêng tư" : "Công khai"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                      <p className="text-xs text-orange-500 uppercase font-semibold">Nguyên liệu</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{totalIngredients}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleOpenPresetModal}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-semibold flex items-center justify-center gap-2 rounded-2xl"
                      disabled={!dishForModal}
                    >
                      <ShoppingCart size={18} />
                      Thêm vào giỏ hàng
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleBackToMenu}
                      className="h-12 text-base font-semibold border-orange-200 text-orange-600 hover:bg-orange-50 rounded-2xl"
                    >
                      Xem thêm món khác
                    </Button>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-sm text-orange-500">
                      Vui lòng đăng nhập để thêm món vào giỏ hàng và theo dõi trạng thái đơn hàng của bạn.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-orange-500" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">Nguyên liệu & định lượng</h2>
              </div>

              {ingredients.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 border border-gray-100 rounded-3xl">
                  Chưa có thông tin nguyên liệu cho món ăn này.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ingredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="flex gap-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-orange-50 border border-orange-100 flex items-center justify-center">
                          {ingredient.imageUrl ? (
                            <img
                              src={ingredient.imageUrl}
                              alt={ingredient.name}
                              className="w-full h-full object-cover"
                              onError={(event) => {
                                const target = event.currentTarget
                                target.style.display = "none"
                              }}
                            />
                          ) : (
                            <BookmarkCheck className="text-orange-400" size={28} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-base font-semibold text-gray-900 truncate">{ingredient.name}</p>
                          {ingredient.category?.name ? (
                            <span className="text-xs font-medium text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">
                              {ingredient.category.name}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-gray-600">
                          Định lượng:{" "}
                          <span className="font-semibold text-gray-900">
                            {ingredient.quantity.toLocaleString("vi-VN")}
                            {ingredient.unit ? ` ${ingredient.unit}` : ""}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </>
        ) : null}
      </main>

      <PresetDishModal
        open={presetModalOpen}
        onClose={() => setPresetModalOpen(false)}
        dish={dishForModal}
      />
    </div>
  )
}

function normalizeRecipeResponse(data: unknown, ingredientSource: StoreIngredient[]): IngredientSummary[] {
  if (!data) return []

  const enrich = (ingredient: IngredientSummary): IngredientSummary => {
    const fromStore = ingredientSource.find((ing) => ing.id === ingredient.id)
    if (!fromStore) {
      return ingredient
    }
    return {
      ...ingredient,
      unit: ingredient.unit || fromStore.unit,
      storedQuantity:
        typeof ingredient.storedQuantity === "number"
          ? ingredient.storedQuantity
          : fromStore.available ?? fromStore.quantity,
      category:
        ingredient.category && ingredient.category.name
          ? ingredient.category
          : fromStore.category
          ? { id: fromStore.categoryId, name: fromStore.category }
          : ingredient.category,
      imageUrl: ingredient.imageUrl || fromStore.imgUrl,
    }
  }

  if (Array.isArray(data)) {
    const mapped = data
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const recipe = item as {
          ingredient?: {
            id?: number
            name?: string
            unit?: string
            available?: number
            quantity?: number
            category?: { id?: number; name?: string }
            imgUrl?: string
            imageUrl?: string
          }
          quantity?: number
        }
        if (!recipe.ingredient?.id || typeof recipe.quantity !== "number") return null
        return {
          id: recipe.ingredient.id,
          name: recipe.ingredient.name || "Nguyên liệu",
          quantity: recipe.quantity,
          storedQuantity: recipe.ingredient.available ?? recipe.ingredient.quantity,
          unit: recipe.ingredient.unit,
          category: recipe.ingredient.category,
          imageUrl: recipe.ingredient.imgUrl || recipe.ingredient.imageUrl,
        } satisfies IngredientSummary
      })
      .filter((ing): ing is IngredientSummary => Boolean(ing))

    return mapped.map(enrich)
  }

  if (typeof data === "object" && "ingredients" in data) {
    const recipeObj = data as {
      ingredients?: Array<{
        id?: number
        name?: string
        neededQuantity?: number
        storedQuantity?: number
        unit?: string
        category?: IngredientCategoryInfo
        imageUrl?: string
      }>
    }
    const ingredientList = recipeObj.ingredients ?? []
    const normalized = ingredientList
      .map((ing) => {
        if (!ing?.id || typeof ing.neededQuantity !== "number") return null
        return {
          id: ing.id,
          name: ing.name || "Nguyên liệu",
          quantity: ing.neededQuantity,
          storedQuantity: ing.storedQuantity,
          unit: ing.unit,
          category: ing.category,
          imageUrl: ing.imageUrl,
        } satisfies IngredientSummary
      })
      .filter((ing): ing is IngredientSummary => Boolean(ing))

    return normalized.map(enrich)
  }

  return []
}

export default DishDetailPage

