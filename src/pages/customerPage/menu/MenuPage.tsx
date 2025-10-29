import React, { useEffect, useMemo, useState } from "react"
import { useDishStore } from "@/zustand/stores/dish"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import type { DishListSlice } from "@/zustand/slices/dish/list.slice"
import type { DishCategory } from "@/models/category/category"

import TunaImg from "@assets/Menu/tuna.png"
import PorkImg from "@assets/Menu/pork.png"
import BeefImg from "@assets/Menu/beef.png"
import ShrimpsImg from "@assets/Menu/shrimps.png"
import BackgroundMenu from "@assets/Menu/backgroundMenu.png"

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
  = ({ dish, idx }) => (
  <div className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative">
    <div className="relative mb-4">
      <div className="w-44 h-44 rounded-full overflow-hidden bg-gray-100">
        <img src={dish.imageUrl || getFallbackImage(idx)} alt={dish.name} className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-2 right-2 bg-gray-800 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
        {priceFormat(dish.price)}
      </div>
    </div>
    <div className="px-2">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{dish.name}</h3>
      {dish.description ? (
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{dish.description}</p>
      ) : null}
    </div>
  </div>
)

const MenuPage: React.FC = () => {
  const store = useDishStore() as unknown as LocalDishStore
  const { fetchAll, items, loading, categories, fetchCategories, query, setQuery, selectedCategoryId, setSelectedCategoryId } = store

  const anchors = useMemo(() => (["Signature Poké Bowls","Aloha Bowls","Make your own bowl","Drinks"] as const)
    .filter(label => (categories as DishCategory[]).some(c => c.name?.toLowerCase() === label.toLowerCase()))
    .map(label => ({ label, id: slugify(label) })), [categories])

  const [activeAnchorId, setActiveAnchorId] = useState<string | undefined>(anchors[0]?.id)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchCategories?.() }, [fetchCategories])

  const visible = useMemo(() => (items as MenuDish[]).filter((d) => (d.public === true) && (d.active ?? true)), [items])
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

                return ordered.map((cat) => (
                  <section key={cat} id={slugify(cat)} className="scroll-mt-28">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{cat}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                      {grouped.get(cat)!.map((dish, idx) => (
                        <MenuCard key={dish.id} dish={dish} idx={idx} />
                      ))}
                    </div>
                  </section>
                ))
              })()}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default MenuPage


