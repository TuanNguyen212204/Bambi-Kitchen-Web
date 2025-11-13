import type {
  DishNutritionAnalysis,
  DishNutritionIngredientInput,
  DishNutritionRequest,
  DishNutritionUnit,
} from "@models/nutrition/calculate"
import type { Nutrition } from "@models/nutrition/nutrition"
import type { NutritionIngredientContribution } from "@models/chat"
import { bambiApi } from "@utils/api"
import { API_ENDPOINTS } from "@utils/endpoints"

export class NutritionError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = "NutritionError"
  }
}

type UnitFamily = "mass" | "volume" | "count"

interface NormalizedIngredientUsage {
  id: number
  name: string
  amount: number
  unit?: string | null
}

interface DishNutritionPayloadResult {
  dishId: number
  dishName: string
  payload: DishNutritionRequest
  contributions: NutritionIngredientContribution[]
  missingIngredients: Array<{ id: number; name: string }>
}

export interface DishNutritionComputationResult
  extends DishNutritionPayloadResult {
  analysis: DishNutritionAnalysis
}

const toHttpStatus = (error: unknown): number | undefined => {
  return (error as { response?: { status?: number } })?.response?.status
}

const normalizeUnit = (unit?: string | null): DishNutritionUnit => {
  if (!unit) return "pcs"
  const normalized = unit.toString().trim().toLowerCase()
  if (["gram", "grams", "g"].includes(normalized)) return "g"
  if (["kilogram", "kilograms", "kg"].includes(normalized)) return "kg"
  if (["milliliter", "millilitre", "ml"].includes(normalized)) return "ml"
  if (["liter", "litre", "l"].includes(normalized)) return "l"
  if (["pcs", "piece", "pieces", "pc"].includes(normalized)) return "pcs"
  return "pcs"
}

const getUnitFamily = (unit: DishNutritionUnit): UnitFamily => {
  switch (unit) {
    case "g":
    case "kg":
      return "mass"
    case "ml":
    case "l":
      return "volume"
    default:
      return "count"
  }
}

const convertToBaseAmount = (
  amount: number,
  unit: DishNutritionUnit
): number => {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  switch (unit) {
    case "kg":
      return safeAmount * 1000 // grams
    case "g":
      return safeAmount
    case "l":
      return safeAmount * 1000 // milliliters
    case "ml":
      return safeAmount
    default:
      return safeAmount // pcs stays the same
  }
}

const parsePerUnit = (
  perUnit?: string | null
): { quantity: number; unit: DishNutritionUnit } | null => {
  if (!perUnit) return null
  const cleaned = perUnit.trim()
  const match = cleaned.match(/([\d.,]+)/)
  if (!match) return null
  const quantity = Number(match[1].replace(",", "."))
  if (!Number.isFinite(quantity) || quantity <= 0) return null
  const unitPart = cleaned.replace(match[1], "").trim()
  return {
    quantity,
    unit: normalizeUnit(unitPart || undefined),
  }
}

const calculateScalingRatio = (
  amount: number,
  unit: DishNutritionUnit,
  nutrition: Nutrition | null
): number => {
  if (!nutrition || !nutrition.per_unit) {
    return 1
  }
  const base = parsePerUnit(nutrition.per_unit)
  if (!base) return 1

  const ingredientFamily = getUnitFamily(unit)
  const baseFamily = getUnitFamily(base.unit)
  if (ingredientFamily !== baseFamily) {
    return 1
  }

  const ingredientAmount = convertToBaseAmount(amount, unit)
  const baseAmount = convertToBaseAmount(base.quantity, base.unit)
  if (ingredientAmount <= 0 || baseAmount <= 0) {
    return 1
  }
  return ingredientAmount / baseAmount
}

const normalizeRecipeIngredients = (
  data: unknown
): NormalizedIngredientUsage[] => {
  if (!data) return []

  if (Array.isArray(data)) {
    return data
      .map((item) => {
        const ingredient = (item as any)?.ingredient
        const quantityRaw =
          (item as any)?.quantity ??
          (item as any)?.neededQuantity ??
          (item as any)?.amount

        const id = Number(ingredient?.id ?? (item as any)?.ingredientId)
        const quantity = Number(quantityRaw)
        if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(quantity)) {
          return null
        }

        return {
          id,
          name:
            typeof ingredient?.name === "string"
              ? ingredient.name
              : typeof (item as any)?.name === "string"
              ? (item as any).name
              : `Nguyên liệu #${id}`,
          amount: Math.max(quantity, 0),
          unit:
            ingredient?.unit ??
            (item as any)?.unit ??
            ingredient?.ingredientUnit ??
            null,
        }
      })
      .filter((item): item is NormalizedIngredientUsage => item !== null)
  }

  if (typeof data === "object") {
    const ingredients = (data as any)?.ingredients
    if (Array.isArray(ingredients)) {
      return ingredients
        .map((item) => {
          const id = Number(item?.id ?? item?.ingredientId)
          const quantityRaw =
            item?.neededQuantity ?? item?.quantity ?? item?.amount
          const quantity = Number(quantityRaw)
          if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(quantity)) {
            return null
          }
          return {
            id,
            name:
              typeof item?.name === "string"
                ? item.name
                : `Nguyên liệu #${id}`,
            amount: Math.max(quantity, 0),
            unit: item?.unit ?? null,
          }
        })
        .filter((item): item is NormalizedIngredientUsage => item !== null)
    }
  }

  return []
}

const normalizeAnalysis = (data: unknown): DishNutritionAnalysis => {
  if (!data || typeof data !== "object") {
    throw new NutritionError("Phân tích dinh dưỡng trả về không hợp lệ.", data)
  }

  const record = data as Record<string, unknown>
  const totalsRaw = record.totals as Record<string, unknown>

  return {
    score: Number(record.score) || 0,
    title: typeof record.title === "string" ? record.title : "",
    roast: typeof record.roast === "string" ? record.roast : "",
    totals: {
      calories: Number(totalsRaw?.calories) || 0,
      protein: Number(totalsRaw?.protein) || 0,
      carb: Number(totalsRaw?.carb) || 0,
      fat: Number(totalsRaw?.fat) || 0,
      fiber: Number(totalsRaw?.fiber) || 0,
    },
    suggest: typeof record.suggest === "string" ? record.suggest : "",
    ...record,
  }
}

export async function prepareDishNutritionPayload(
  dishId: number
): Promise<DishNutritionPayloadResult> {
  const dishResponse = await bambiApi.get<{ id: number; name?: string }>(
    API_ENDPOINTS.API_DISH_BY_ID(dishId)
  )
  const dishName =
    dishResponse.data?.name?.trim() || `Món ăn #${dishResponse.data?.id}` || ""

  if (!dishResponse.data) {
    throw new NutritionError("Không tìm thấy thông tin món ăn.")
  }

  const recipeResponse = await bambiApi.get(API_ENDPOINTS.API_RECIPE_BY_DISH(dishId))
  const ingredients = normalizeRecipeIngredients(recipeResponse.data)

  if (ingredients.length === 0) {
    throw new NutritionError(
      "Không tìm thấy nguyên liệu nào cho món ăn để tính dinh dưỡng."
    )
  }

  const contributions: NutritionIngredientContribution[] = []
  const missingIngredients: Array<{ id: number; name: string }> = []

  await Promise.all(
    ingredients.map(async (ingredient) => {
      let nutrition: Nutrition | null = null
      try {
        const nutritionResponse = await bambiApi.get<Nutrition>(
          API_ENDPOINTS.API_NUTRITION_BY_INGREDIENT(ingredient.id)
        )
        nutrition = nutritionResponse.data ?? null
      } catch (error) {
        const status = toHttpStatus(error)
        if (status && status !== 404) {
          throw new NutritionError(
            `Không thể lấy thông tin dinh dưỡng cho nguyên liệu ${ingredient.name}.`,
            error
          )
        }
      }

      const normalizedUnit = normalizeUnit(
        ingredient.unit ?? nutrition?.ingredient?.unit
      )
      const ratio = calculateScalingRatio(
        ingredient.amount,
        normalizedUnit,
        nutrition
      )

      const baseContribution: NutritionIngredientContribution = {
        ingredientId: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount,
        unit: normalizedUnit,
        per: nutrition?.per_unit ?? `per ${normalizedUnit}`,
        cal: (nutrition?.calories ?? 0) * ratio,
        pro: (nutrition?.protein ?? 0) * ratio,
        carb: (nutrition?.carb ?? 0) * ratio,
        fat: (nutrition?.fat ?? 0) * ratio,
        fiber: (nutrition?.fiber ?? 0) * ratio,
      }

      if (!nutrition) {
        baseContribution.cal = 0
        baseContribution.pro = 0
        baseContribution.carb = 0
        baseContribution.fat = 0
        baseContribution.fiber = 0
        baseContribution.missing = true
        missingIngredients.push({ id: ingredient.id, name: ingredient.name })
      }

      contributions.push(baseContribution)
    })
  )

  const payload: DishNutritionRequest = {
    name: dishName,
    ingredients: contributions.map<DishNutritionIngredientInput>((item) => ({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      per: item.per,
      cal: item.cal,
      pro: item.pro,
      carb: item.carb,
      fat: item.fat,
      fiber: item.fiber,
    })),
  }

  return {
    dishId,
    dishName,
    payload,
    contributions,
    missingIngredients,
  }
}

export async function calculateDishNutrition(
  dishId: number,
  options?: { query?: string }
): Promise<DishNutritionComputationResult> {
  const prepared = await prepareDishNutritionPayload(dishId)

  let analysisResponse: unknown
  try {
    const response = await bambiApi.post<unknown>(
      API_ENDPOINTS.API_MAIL_CALCULATE_CALORIES,
      prepared.payload,
      {
        params: {
          q: options?.query ?? prepared.dishName ?? `Dish ${dishId}`,
        },
      }
    )
    analysisResponse = response.data
  } catch (error) {
    throw new NutritionError("Không thể tính toán dinh dưỡng món ăn.", error)
  }

  let parsedAnalysis: unknown = analysisResponse
  if (typeof analysisResponse === "string") {
    try {
      parsedAnalysis = JSON.parse(analysisResponse)
    } catch {
      // giữ nguyên string, sẽ được validate bên dưới
    }
  }

  const analysis = normalizeAnalysis(parsedAnalysis)

  return {
    ...prepared,
    analysis,
  }
}


