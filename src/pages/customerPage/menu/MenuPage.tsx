import React, { useEffect, useMemo, useState } from "react"
import { useDishStore } from "@/zustand/stores/dish"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Button } from "@components/ui/button"
import type { DishListSlice } from "@/zustand/slices/dish/list.slice"
import type { DishCategory } from "@/models/category/category"
import { useCartStore } from "@/zustand/stores/cart"
import { Plus } from "lucide-react"
import { useAuthStore } from "@zustand/stores/auth"
import { useLocation, useNavigate } from "react-router-dom"
import { PATHS } from "@config/path"
import { toast } from "sonner"

import TunaImg from "@assets/Menu/tuna.png"
import PorkImg from "@assets/Menu/pork.png"
import BeefImg from "@assets/Menu/beef.png"
import ShrimpsImg from "@assets/Menu/shrimps.png"
import BackgroundMenu from "@assets/Menu/backgroundMenu.png"
import CustomBowlModal from "./components/CustomBowlModal"

const fallbackImages = [TunaImg, PorkImg, BeefImg, ShrimpsImg]
const getFallbackImage = (idx: number) => fallbackImages[idx % fallbackImages.length]

const priceFormat = (price?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price ?? 0)

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

type MenuDish = DishListSlice["items"][number]
type LocalDishStore = {
  fetchAll: () => Promise<void>
  items: MenuDish[]
  loading: boolean
  categories: DishCategory[]
  fetchCategories?: () => Promise<void>
  query?: string
  setQuery?: (q: string) => void
  selectedCategoryId?: number
  setSelectedCategoryId?: (id?: number) => void
}

const MenuCard: React.FC<{ dish: MenuDish, idx: number }>
  = ({ dish, idx }) => {
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thêm món vào giỏ", {
        action: { label: "Đăng nhập", onClick: () => navigate(PATHS.LOGIN, { state: { from: location.pathname } }) },
      })
    return
    }
    // Convert MenuDish to Dish format for cart
    const cartDish = {
      id: dish.id,
      name: dish.name,
      price: dish.price || 0,
      imageUrl: dish.imageUrl,
      imgUrl: dish.imageUrl,
      description: dish.description,
    } as any
    addItem(cartDish, 1)
  }
  
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative">
      <div className="relative mb-4">
        <div className="w-44 h-44 rounded-full overflow-hidden bg-gray-100">
          <img src={dish.imageUrl || getFallbackImage(idx)} alt={dish.name} className="w-full h-full object-cover" />
        </div>
        <div className="absolute top-2 right-2 bg-gray-800 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
          {priceFormat(dish.price)}
        </div>
      </div>
      <div className="px-2 flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{dish.name}</h3>
        {dish.description ? (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">{dish.description}</p>
        ) : null}
      </div>
      <Button 
        onClick={handleAddToCart}
        className="w-full bg-[#ea6d27] hover:bg-[#d85f1f] text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Thêm
      </Button>
    </div>
  )
}

const MenuPage: React.FC = () => {
  const store = useDishStore() as unknown as LocalDishStore
  const { fetchAll, items, loading, categories, fetchCategories, query, setQuery, selectedCategoryId, setSelectedCategoryId } = store
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const anchors = useMemo(() => (["Signature Poké Bowls","Aloha Bowls","Make your own bowl","Drinks"] as const)
    .filter(label => (categories as DishCategory[]).some(c => c.name?.toLowerCase() === label.toLowerCase()))
    .map(label => ({ label, id: slugify(label) })), [categories])

  const [activeAnchorId, setActiveAnchorId] = useState<string | undefined>(anchors[0]?.id)
  const [showAllDishes, setShowAllDishes] = useState(false)
  const [customBowlModalOpen, setCustomBowlModalOpen] = useState(false)
  
  // Số lượng dishes hiển thị ban đầu (hầu hết nhưng không phải tất cả)
  const INITIAL_DISHES_COUNT = 12

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchCategories?.() }, [fetchCategories])

  const visible = useMemo(() => {
    // Lọc bỏ "Make your own bowl" category khỏi preset dishes
    const makeYourOwnBowlCategory = (categories as DishCategory[]).find(
      c => c.name?.toLowerCase() === "make your own bowl"
    )
    return (items as MenuDish[]).filter((d) => {
      const isPublicAndActive = (d.public === true) && (d.active ?? true)
      // Loại bỏ dishes thuộc "Make your own bowl" category
      const isNotCustomBowl = !makeYourOwnBowlCategory || d.categoryId !== makeYourOwnBowlCategory.id
      return isPublicAndActive && isNotCustomBowl
    })
  }, [items, categories])
  
  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase()
    return visible.filter((d) => {
      const byQ = !q || d.name?.toLowerCase?.().includes(q) || d.description?.toLowerCase?.().includes(q)
      const byCat = !selectedCategoryId || d.categoryId === selectedCategoryId
      return byQ && byCat
    })
  }, [visible, query, selectedCategoryId])
  

  return (
    <main className="min-h-screen bg-white">
      
      <section
        className="relative"
        style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}
      >
        <div
          className="h-[360px] md:h-[460px] bg-center bg-cover"
          style={{ backgroundImage: `url(${BackgroundMenu})` }}
        />
        <div className="absolute inset-0 pointer-events-none" />
      </section>

      
      <section className="max-w-[1200px] mx-auto px-6 py-12">
        {!isAuthenticated && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 flex items-center justify-between">
            <span>Bạn cần đăng nhập để thêm món hoặc tạo tô tùy chỉnh.</span>
            <Button
              onClick={() => navigate(PATHS.LOGIN, { state: { from: location.pathname } })}
              className="bg-[#ea6d27] hover:bg-[#d85f1f] text-white font-semibold h-8 px-3"
            >
              Đăng nhập
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tất cả món</h2>
            <p className="text-gray-500 text-sm">Lọc theo danh mục, tìm kiếm theo tên/miêu tả.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="sm:w-72 w-full">
              <Input
                value={query}
                onChange={(e) => setQuery?.(e.target.value)}
                placeholder="Tìm món theo tên..."
                className="bg-white"
              />
            </div>
            <div className="sm:w-56 w-full">
              <Select value={selectedCategoryId ? String(selectedCategoryId) : "all"} onValueChange={(v) => setSelectedCategoryId?.(v === "all" ? undefined : Number(v))}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Tất cả danh mục" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {(categories as DishCategory[] || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        
        {loading ? (
          <div className="text-center text-gray-500 py-10">Đang tải món ăn...</div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            
            <aside className="col-span-12 md:col-span-3 lg:col-span-2">
              <div className="sticky top-28 space-y-2 will-change-transform">
                <div className="text-sm font-semibold text-gray-700 mb-2">Bambi’s Menu</div>
                {anchors.map((a) => (
                  <a
                    key={a.id}
                    href={`#${a.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(a.id)
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                    }}
                    className={`block px-3 py-2 rounded transition-colors ${activeAnchorId===a.id? "bg-orange-100 text-orange-700 font-medium" : "hover:bg-orange-50 text-gray-700"}`}
                  >
                    {a.label}
                  </a>
                ))}
              </div>
            </aside>

            
            <div className="col-span-12 md:col-span-9 lg:col-span-10 space-y-12">
              {(() => {
                const catMap = new Map<number, string>()
                ;(categories as DishCategory[]).forEach(c => catMap.set(c.id, c.name))
                const grouped = new Map<string, MenuDish[]>()
                ;(filtered as MenuDish[]).forEach(d => {
                  const catName = d.categoryId ? (catMap.get(d.categoryId) || "Others") : "Others"
                  if (!grouped.has(catName)) grouped.set(catName, [])
                  grouped.get(catName)!.push(d)
                })
                const preferredOrder = ["Signature Poké Bowls","Aloha Bowls","Make your own bowl","Drinks"]
                const ordered = Array.from(grouped.keys()).sort((a,b)=>{
                  const ia = preferredOrder.indexOf(a)
                  const ib = preferredOrder.indexOf(b)
                  if (ia === -1 && ib === -1) return a.localeCompare(b)
                  if (ia === -1) return 1
                  if (ib === -1) return -1
                  return ia - ib
                })
                setTimeout(() => {
                  const observer = new IntersectionObserver((entries) => {
                    const visible = entries
                      .filter(en => en.isIntersecting)
                      .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0]
                    if (visible?.target?.id) setActiveAnchorId(visible.target.id)
                  }, { rootMargin: "-120px 0px -60% 0px", threshold: [0.1, 0.25, 0.5, 0.75] })
                  anchors.forEach(a => {
                    const el = document.getElementById(a.id)
                    if (el) observer.observe(el)
                  })
                }, 0)

                // Tính tổng số dishes từ tất cả categories
                const totalDishes = ordered.reduce((sum, cat) => sum + (grouped.get(cat)?.length || 0), 0)
                
                // Tính số dishes đã hiển thị
                let displayedCount = 0
                const shouldShowMore = !showAllDishes && totalDishes > INITIAL_DISHES_COUNT
                
                const sections = ordered.map((cat) => {
                  const dishes = grouped.get(cat) || []
                  const dishesToDisplay = shouldShowMore && displayedCount < INITIAL_DISHES_COUNT
                    ? dishes.slice(0, Math.max(0, INITIAL_DISHES_COUNT - displayedCount))
                    : shouldShowMore && displayedCount >= INITIAL_DISHES_COUNT
                    ? []
                    : dishes
                  
                  displayedCount += dishesToDisplay.length
                  
                  if (dishesToDisplay.length === 0) return null
                  
                  return (
                    <section key={cat} id={slugify(cat)} className="scroll-mt-28">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{cat}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                        {dishesToDisplay.map((dish, idx) => (
                          <MenuCard key={dish.id} dish={dish} idx={idx} />
                        ))}
                      </div>
                    </section>
                  )
                }).filter(Boolean)
                
                // Thêm nút "Xem thêm" sau section cuối cùng nếu cần
                const showMoreButton = shouldShowMore && displayedCount < totalDishes ? (
                  <div key="show-more" className="text-center mt-8">
                    <Button
                      onClick={() => setShowAllDishes(true)}
                      variant="outline"
                      className="px-6 py-2 border-2 border-orange-500 text-orange-500 hover:bg-orange-50"
                    >
                      Xem thêm ({totalDishes - displayedCount} món)
                    </Button>
                  </div>
                ) : null
                
                // Thêm phần "Make your own bowl"
                const makeYourOwnBowlSection = (
                  <section key="make-your-own-bowl" id="make-your-own-bowl" className="scroll-mt-28">
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Make your own bowl</h2>
                      <p className="text-gray-600">Build your own poke bowl! (Best consumed within an hour of preparation)</p>
                    </div>
                    <div 
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.info("Vui lòng đăng nhập để tạo tô tùy chỉnh", {
                            action: { label: "Đăng nhập", onClick: () => navigate(PATHS.LOGIN, { state: { from: location.pathname } }) },
                          })
                          return
                        }
                        setCustomBowlModalOpen(true)
                      }}
                      className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-orange-200 hover:border-orange-400"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-32 h-32 mb-4 flex items-center justify-center">
                          <svg className="w-full h-full text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase">Make your own bowl</h3>
                        <p className="text-gray-600 mb-4">Tự tạo tô poke bowl theo sở thích của bạn</p>
                        <div className="flex items-center justify-between w-full max-w-xs mt-4">
                          <span className="text-lg font-bold text-gray-900">Từ 16.500đ</span>
                          <Button className="bg-[#ea6d27] hover:bg-[#d85f1f] text-white font-semibold">
                            Tạo ngay
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                )
                
                return [...sections, showMoreButton, makeYourOwnBowlSection].filter(Boolean)
              })()}
            </div>
          </div>
        )}
      </section>
      
      <CustomBowlModal 
        open={customBowlModalOpen}
        onClose={() => setCustomBowlModalOpen(false)}
      />
    </main>
  )
}

export default MenuPage


