import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card/card"

interface DishItem {
  id: number
  name: string
  imageUrl?: string
  usedQuantity?: number
  price?: number
}

interface TopDishesProps {
  items: DishItem[]
}

export default function TopDishes({ items }: TopDishesProps) {
  const top = (items || []).slice(0, 5)
  return (
    <Card className="border border-solid shadow-[0px_1px_3px_#0000001a] h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Món bán chạy</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {top.length === 0 ? (
            <li className="text-sm text-gray-500">Chưa có dữ liệu</li>
          ) : (
            top.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                    {d.imageUrl ? (
                      <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">No img</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{d.name}</div>
                    {typeof d.price === "number" && (
                      <div className="text-xs text-gray-500">{d.price.toLocaleString("vi-VN")} đ</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-700">{d.usedQuantity ?? 0} lượt</div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}


