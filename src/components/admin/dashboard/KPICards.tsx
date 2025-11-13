import { Card, CardContent } from "@components/ui/card/card"

interface KPICardsProps {
  metrics: Array<{ title: string; value: string | number; icon?: string }>
}

export default function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <Card key={idx} className="border border-solid shadow-[0px_1px_3px_#0000001a]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm text-gray-500 mb-1">{m.title}</div>
                <div className="text-2xl font-bold text-gray-800">{m.value}</div>
              </div>
              {m.icon ? (
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-orange-600">{m.icon}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


