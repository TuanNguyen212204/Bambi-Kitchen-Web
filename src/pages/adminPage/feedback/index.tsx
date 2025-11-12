import { useEffect, useMemo, useState } from "react"
import { bambiApi, API_ENDPOINTS } from "@utils/api"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Card, CardContent } from "@components/ui/card/card"

type Feedback = { orderId: number; accountId: number; accountName?: string; ranking: number; comment?: string }

const AdminFeedbackPage = () => {
  const [all, setAll] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState("")
  const [stars, setStars] = useState<string>("all") // all | 5..1
  const [selected, setSelected] = useState<Feedback | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await bambiApi.get<Feedback[]>(API_ENDPOINTS.API_ORDER_FEEDBACKS)
        setAll(res.data || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const total = all.length
    const avg = total ? (all.reduce((s, f) => s + (f.ranking || 0), 0) / total) : 0
    const five = all.filter(f => f.ranking === 5).length
    const one = all.filter(f => f.ranking === 1).length
    return { total, avg: Number(avg.toFixed(2)), five, one }
  }, [all])

  const list = useMemo(() => {
    let data = all
    if (stars !== "all") data = data.filter(f => String(f.ranking) === stars)
    const term = q.trim().toLowerCase()
    if (!term) return data
    return data.filter(f => `${f.accountName ?? ''} ${f.comment ?? ''} ${f.orderId}`.toLowerCase().includes(term))
  }, [all, q, stars])

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Quản lý Feedback
          </h1>
        </div>
      </section>

      {/* Main Section */}
      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">Tìm kiếm</label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên khách hàng, nội dung..." className="bg-white h-auto py-2" />
            </div>
    <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">Số sao</label>
              <Select value={stars} onValueChange={setStars}>
                <SelectTrigger className="bg-white h-auto py-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {[5,4,3,2,1].map(s => <SelectItem key={s} value={String(s)}>{s} sao</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-md h-[38px]">Tìm kiếm</button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Left list */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 p-3 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {loading ? (
              <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>
            ) : list.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">Không có feedback</div>
            ) : (
              list.map((f) => (
                <Card key={`${f.orderId}-${f.accountId}`} className={`bg-white border-2 ${selected?.orderId===f.orderId && selected?.accountId===f.accountId ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <CardContent className="p-3 cursor-pointer" onClick={() => setSelected(f)}>
                    <div className="text-sm font-medium text-gray-800 mb-1">{f.accountName || `User #${f.accountId}`}</div>
                    <div className="text-xs text-gray-600 mb-1">Đơn #{f.orderId}</div>
                    <div className="text-xs">Đánh giá: {f.ranking}/5</div>
                    {f.comment && <div className="text-xs text-gray-600 line-clamp-2">{f.comment}</div>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Right detail */}
          <div className="w-2/3 p-4" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {!selected ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">Chọn một feedback để xem chi tiết</div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><span className="font-medium">Khách hàng:</span> {selected.accountName || `User #${selected.accountId}`}</div>
                    <div><span className="font-medium">Đơn hàng:</span> #{selected.orderId}</div>
                    <div><span className="font-medium">Đánh giá:</span> {selected.ranking}/5</div>
                    {selected.comment && <div><span className="font-medium">Nội dung:</span> {selected.comment}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminFeedbackPage


