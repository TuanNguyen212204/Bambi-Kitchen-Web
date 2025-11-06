import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card/card"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export interface RevenuePoint { date: string; amount: number }

interface RevenueChartProps {
  data: RevenuePoint[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="border border-solid shadow-[0px_1px_3px_#0000001a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Doanh thu theo ngày</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString("vi-VN")}
              />
              <Tooltip formatter={(v: number) => `${v.toLocaleString("vi-VN")} đ`} />
              <Area type="monotone" dataKey="amount" stroke="#ea580c" fillOpacity={1} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}


