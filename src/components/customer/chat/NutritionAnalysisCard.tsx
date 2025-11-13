import type { ChatMessageNutritionMetadata } from "@models/chat"

interface NutritionAnalysisCardProps {
  metadata: ChatMessageNutritionMetadata
}

const formatNumber = (value: number): string => {
  if (Number.isNaN(value)) return "0"
  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return value.toFixed(0)
  }
  return value.toFixed(1)
}

const formatUnit = (unit?: string | null): string => {
  if (!unit) return ""
  const normalized = unit.toLowerCase()
  switch (normalized) {
    case "gram":
    case "g":
      return "g"
    case "kilogram":
    case "kg":
      return "kg"
    case "milliliter":
    case "ml":
      return "ml"
    case "liter":
    case "l":
      return "l"
    case "pcs":
    case "piece":
    case "pieces":
    case "pc":
      return "pcs"
    default:
      return unit
  }
}

export default function NutritionAnalysisCard({
  metadata,
}: NutritionAnalysisCardProps) {
  const { analysis, payload, dishName, contributions, generatedAt, missingIngredients } =
    metadata

  const macroList = [
    { key: "calories", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carb", label: "Carb", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
    { key: "fiber", label: "Fiber", unit: "g" },
  ] as const

  const ingredientBreakdown =
    contributions && contributions.length > 0
      ? contributions
      : payload.ingredients

  const generatedTime = generatedAt
    ? new Date(generatedAt).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    : null

  return (
    <div className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 via-lime-500 to-amber-400 text-white px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide/relaxed opacity-80">
            Điểm dinh dưỡng
          </p>
          <p className="text-2xl font-semibold leading-tight">
            {formatNumber(analysis.score)}/10
          </p>
        </div>
        <div className="sm:text-right space-y-1">
          <p className="text-sm font-semibold line-clamp-2">
            {analysis.title || "Đánh giá tổng quan"}
          </p>
          <p className="text-xs opacity-90 italic">
            {dishName || payload.name}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {macroList.map((item) => {
            const totalValue =
              analysis.totals[item.key as keyof typeof analysis.totals] ?? 0
            return (
            <div
              key={item.key}
              className="rounded-md bg-muted px-3 py-2 text-center"
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="text-base font-semibold text-foreground">
                {formatNumber(totalValue)}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  {item.unit}
                </span>
              </p>
            </div>
            )
          })}
        </div>

        {analysis.roast && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-semibold mb-1">Nhận xét nhanh</p>
            <p className="leading-relaxed whitespace-pre-wrap">{analysis.roast}</p>
          </div>
        )}

        {ingredientBreakdown.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Chi tiết nguyên liệu
            </p>
            <div className="space-y-2">
              {ingredientBreakdown.map((ingredient, index) => (
                <div
                  key={`${ingredient.name}-${index}`}
                  className="rounded-md border border-border/60 px-3 py-2 text-sm flex flex-col gap-1 bg-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {ingredient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(Number(ingredient.amount ?? 0))}{" "}
                      {formatUnit(ingredient.unit)}
                      {ingredient.per ? ` • ${ingredient.per}` : ""}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      🔥 {formatNumber(Number(ingredient.cal ?? 0))} kcal
                    </span>
                    <span>
                      💪 {formatNumber(Number(ingredient.pro ?? 0))} g protein
                    </span>
                    <span>
                      🍚 {formatNumber(Number(ingredient.carb ?? 0))} g carb
                    </span>
                    <span>
                      🥑 {formatNumber(Number(ingredient.fat ?? 0))} g fat
                    </span>
                    <span>
                      🌿 {formatNumber(Number(ingredient.fiber ?? 0))} g fiber
                    </span>
                    {"missing" in ingredient && ingredient.missing ? (
                      <span className="text-destructive font-medium">
                        Thiếu dữ liệu dinh dưỡng
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {missingIngredients && missingIngredients.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive space-y-1">
            <p className="font-semibold text-sm">
              Chưa có dữ liệu dinh dưỡng cho:
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              {missingIngredients.map((item) => (
                <li key={item.id ?? item.name}>{item.name}</li>
              ))}
            </ul>
            <p>
              Vui lòng bổ sung Nutrition trong phần quản trị để kết quả chính xác
              hơn.
            </p>
          </div>
        )}

        {analysis.suggest && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <p className="font-semibold mb-1">Gợi ý cải thiện</p>
            <p className="leading-relaxed whitespace-pre-wrap">
              {analysis.suggest}
            </p>
          </div>
        )}

        {generatedTime && (
          <p className="text-[11px] text-muted-foreground text-right">
            Phân tích lúc {generatedTime}
          </p>
        )}
      </div>
    </div>
  )
}


