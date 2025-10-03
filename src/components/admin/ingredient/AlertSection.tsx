import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useIngredientStore } from "@zustand/stores/ingredients";
import AddIngredientModal from "@components/admin/ingredient/AddIngredientModal";
import AddCategoryModal from "@components/admin/ingredient/AddCategoryModal";

export const AlertSection = (): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)
  const [keyword, setKeyword] = useState("")
  const { categories, fetchCategories, setQuery, setSelectedCategoryId, setStatusFilter, searchByName, fetchAll } = useIngredientStore()
  useEffect(() => { fetchCategories() }, [fetchCategories])
  return (
    <Card className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg tracking-[0] leading-[27px]">
            Quản lý Nguyên liệu
          </h2>

          <div className="flex gap-2">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white h-auto px-4 py-3 rounded-md" onClick={()=> setOpen(true)}>
              <Plus className="w-3 h-4 mr-2" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm">
                Thêm nguyên liệu mới
              </span>
            </Button>
            <Button className="bg-gray-600 hover:bg-gray-700 text-white h-auto px-4 py-3 rounded-md" onClick={()=> setOpenCategory(true)}>
              <Plus className="w-3 h-4 mr-2" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm">
                Thêm danh mục
              </span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm tracking-[0] leading-[21px] mb-2 block">
              Tìm kiếm nguyên liệu
            </Label>
            <Input
              placeholder="Tên nguyên liệu, nhà cung cấp..."
              className="h-[42px] bg-white rounded-md border border-gray-300 [font-family:'Arial-Narrow',Helvetica] font-normal text-sm placeholder:text-[#757575]"
              value={keyword}
              onChange={(e)=> { setKeyword(e.target.value); setQuery(e.target.value) }}
            />
          </div>

          <div>
            <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm tracking-[0] leading-[21px] mb-2 block">
              Danh mục
            </Label>
            <select className="h-11 w-full bg-[#efefef] rounded-md border border-gray-300 px-3 [font-family:'Arial-Narrow',Helvetica] text-sm text-black" onChange={(e)=> setSelectedCategoryId(e.target.value? Number(e.target.value) : undefined)}>
              <option value="">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm tracking-[0] leading-[21px] mb-2 block">
              Trạng thái
            </Label>
            <select className="h-11 w-full bg-[#efefef] rounded-md border border-gray-300 px-3 [font-family:'Arial-Narrow',Helvetica] text-sm text-black" onChange={(e)=> setStatusFilter((e.target.value as 'all' | 'active' | 'inactive') || 'all')}>
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngừng</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white h-auto px-6 py-3 rounded-md" onClick={()=> {
            const kw = keyword.trim()
            if (kw) searchByName(kw); else fetchAll()
          }}>
            <Search className="w-4 h-4 mr-2" />
            <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm">
              Tìm kiếm
            </span>
          </Button>
        </div>
      </CardContent>
      <AddIngredientModal open={open} onClose={()=> setOpen(false)} />
      <AddCategoryModal open={openCategory} onClose={()=> setOpenCategory(false)} />
    </Card>
  );
};

export default AlertSection;



