// Replaced with consolidated CreateOrderModal used by Orders page
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { bambiApi, API_ENDPOINTS } from "@utils/api"
import { Search } from "lucide-react"

type Dish = { id: number; name?: string; price?: number }
type DishTemplate = { size: "S"|"M"|"L"; name?: string; priceRatio?: number; quantityRatio?: number }
// Remove verbose recipe/inventory typing in this streamlined modal version
type OrderItemDraft = { dishId?: number; name?: string; quantity?: number; size: "S"|"M"|"L" }

interface Props {
  open: boolean
  onOpenChange?: (v: boolean) => void
  onSubmit?: (payload: { accountId?: number; paymentMethod?: string; note?: string; totalPrice?: number; items: any[] }) => Promise<void>
  onClose?: () => void
  onCreated?: () => void
  initialAccountId?: number
}

export default function CreateOrderModal(props: Props) {
  // Delegate to the version colocated earlier; for simplicity re-import from pages module
  // but we duplicate logic here for standalone usage
  const { open, onOpenChange, onSubmit, onClose, onCreated, initialAccountId } = props
  const [accountId, setAccountId] = useState<number | undefined>(initialAccountId)
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined)
  const [note, setNote] = useState("")
  const [q, setQ] = useState("")
  const [dishes, setDishes] = useState<Dish[]>([])
  const [templates, setTemplates] = useState<DishTemplate[]>([])
  // inventory datasets tạm thời không dùng trong modal rút gọn
  const [items, setItems] = useState<OrderItemDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<Array<{ id: number; name?: string; mail?: string; role?: string }>>([])
  const [accountSearch, setAccountSearch] = useState("")

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const [aRes, dRes, tRes] = await Promise.all([
        bambiApi.get<any[]>(API_ENDPOINTS.API_ACCOUNTS),
        bambiApi.get<Dish[]>(API_ENDPOINTS.API_DISHES),
        bambiApi.get<DishTemplate[]>(API_ENDPOINTS.API_DISH_TEMPLATES),
      ])
      setAccounts((aRes.data || []).filter((x: any) => String(x.role).toUpperCase() === 'USER'))
      setDishes(dRes.data || [])
      setTemplates(tRes.data || [])
      // bỏ load ingredients/recipes trong phiên bản này
    })()
  }, [open])

  const filteredDishes = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return dishes
    return dishes.filter((d) => `${d.id} ${d.name ?? ""}`.toLowerCase().includes(term))
  }, [q, dishes])

  const getTemplate = (size: "S"|"M"|"L") => templates.find((t) => t.size === size)
  const calcItemPrice = (dishId?: number, size: "S"|"M"|"L" = "M") => {
    const dish = dishes.find((d) => d.id === (dishId || 0))
    const ratio = getTemplate(size)?.priceRatio ?? 1
    return (dish?.price ?? 0) * ratio
  }
  const totalPrice = useMemo(() => items.reduce((s, it) => s + (calcItemPrice(it.dishId, it.size) * (it.quantity || 1)), 0), [items, dishes, templates])

  const addDish = (dish: Dish) => {
    if (items.find((it) => it.dishId === dish.id)) return
    setItems((prev) => [...prev, { dishId: dish.id, name: dish.name, quantity: 1, size: "M" }])
  }
  const updateDish = (dishId: number, patch: Partial<OrderItemDraft>) => setItems(prev => prev.map(x => x.dishId === dishId ? { ...x, ...patch } : x))
  const removeDish = (dishId: number) => setItems(prev => prev.filter(x => x.dishId !== dishId))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = { accountId, paymentMethod, note: note || undefined, totalPrice, items: items.map(it => ({ dishId: it.dishId, name: it.name, quantity: it.quantity || 1, dishTemplate: { size: it.size }, recipe: [] })) }
      if (onSubmit) {
        await onSubmit(payload)
      } else {
        const res = await bambiApi.post(API_ENDPOINTS.API_ORDERS, payload)
        const maybeUrl = (typeof res.data === 'string') ? res.data : (res as any)?.data?.redirectUrl
        if (maybeUrl && /^https?:/i.test(maybeUrl)) {
          try { window.open(maybeUrl, '_blank', 'noopener') } catch { window.location.href = maybeUrl }
          onCreated?.(); return
        }
        onCreated?.()
      }
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange?.(v); if (!v) onClose?.() }}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader><DialogTitle>Tạo đơn hàng</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Khách hàng</label>
              <div className="relative">
                <Input value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} placeholder="Tìm khách hàng theo tên/email" className="bg-white mb-2" />
                <Select value={typeof accountId === 'number' ? String(accountId) : undefined} onValueChange={(v) => setAccountId(Number(v))}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => { const t = accountSearch.trim().toLowerCase(); return !t || `${a.name ?? ''} ${a.mail ?? ''}`.toLowerCase().includes(t) }).slice(0,50).map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name || a.mail || `User #${a.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phương thức thanh toán</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger className="bg-white"><SelectValue placeholder="Chọn phương thức" /></SelectTrigger><SelectContent><SelectItem value="CASH">Tiền mặt</SelectItem><SelectItem value="VNPAY">VNPay</SelectItem><SelectItem value="MOMO">MoMo</SelectItem></SelectContent></Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tổng tiền</label>
              <Input className="bg-gray-50" value={new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(totalPrice)} readOnly />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Ghi chú</label>
              <Input className="bg-white" value={note} onChange={(e)=> setNote(e.target.value)} placeholder="Ghi chú đơn hàng" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border border-gray-200 rounded-md bg-white">
              <div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-gray-800">Danh sách món (Menu)</div><div className="relative w-56"><Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" /><Input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="Tìm món..." className="pl-8 bg-white" /></div></div>
              <div className="max-h-72 overflow-y-auto space-y-2">{filteredDishes.map(d => (<div key={d.id} className="p-2 border border-gray-200 rounded-md flex items-center justify-between"><div><div className="text-sm font-medium text-gray-800">{d.name || `Món #${d.id}`}</div><div className="text-xs text-gray-600">Giá: {new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(d.price || 0)}</div></div><Button size="sm" onClick={()=> addDish(d)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Thêm</Button></div>))}</div>
            </div>
            <div className="p-3 border border-gray-200 rounded-md bg-white"><div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-gray-800">Món đã chọn</div></div>{items.length===0? <div className="text-xs text-gray-500">Chưa chọn món nào</div> : (<div className="space-y-2">{items.map(it => { const price = calcItemPrice(it.dishId, it.size); return (<div key={it.dishId} className="p-2 border border-gray-100 rounded-md"><div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center"><div className="text-sm font-medium text-gray-800 col-span-2">{it.name || `Món #${it.dishId}`}</div><Select value={it.size} onValueChange={v=> updateDish(it.dishId!, { size: v as any })}><SelectTrigger className="bg-white"><SelectValue placeholder="Size"/></SelectTrigger><SelectContent><SelectItem value="S">Tô S</SelectItem><SelectItem value="M">Tô M</SelectItem><SelectItem value="L">Tô L</SelectItem></SelectContent></Select><Input type="number" className="bg-white" value={it.quantity ?? 1} onChange={e=> updateDish(it.dishId!, { quantity: Number(e.target.value) })} placeholder="Số lượng" /><div className="text-xs text-gray-600">—</div><div className="text-sm font-semibold text-gray-800">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(price * (it.quantity || 1))}</div><div className="text-right"><Button variant="ghost" onClick={()=> removeDish(it.dishId!)}>Xóa</Button></div></div></div>) })}</div>)}</div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={()=> onOpenChange?.(false)}>Hủy</Button><Button onClick={handleSubmit} disabled={submitting || !paymentMethod || items.length===0} className="bg-blue-600 hover:bg-blue-700 text-white">{submitting? 'Đang tạo...' : 'Tạo đơn'}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


