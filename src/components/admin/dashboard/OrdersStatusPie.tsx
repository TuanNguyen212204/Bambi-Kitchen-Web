import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card/card"
import { Pie, PieChart, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts"

interface OrdersStatusPieProps {
  data: Array<{ name: string; value: number }>
}

const COLORS = ["#22c55e", "#06b6d4", "#eab308", "#ef4444", "#8b5cf6"]

export default function OrdersStatusPie({ data }: OrdersStatusPieProps) {
  return (
    <Card className="border border-solid shadow-[0px_1px_3px_#0000001a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Tình trạng đơn hàng</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} >
                {data.map((_, i) => (
                  <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}


