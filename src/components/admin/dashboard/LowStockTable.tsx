import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card/card"

interface LowStockItem {
  id?: number
  name?: string
  imageUrl?: string
  available?: number
  unit?: string
}

interface LowStockTableProps {
  items: LowStockItem[]
}

export default function LowStockTable({ items }: LowStockTableProps) {
  const data = (items || []).slice(0, 6)
  return (
    <Card className="border border-solid shadow-[0px_1px_3px_#0000001a] h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Nguyên liệu sắp hết</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="text-sm text-gray-500">Không có nguyên liệu nào sắp hết.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Tên</th>
                  <th className="py-2 pr-4">Còn lại</th>
                </tr>
              </thead>
              <tbody>
                {data.map((i, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                          {i.imageUrl ? (
                            <img src={i.imageUrl} alt={i.name || "ingredient"} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400">IMG</span>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">{i.name || "Nguyên liệu"}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {typeof i.available === "number" ? i.available : "-"} {i.unit || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


