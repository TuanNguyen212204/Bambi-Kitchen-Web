import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Image as ImageIcon, Edit3, Utensils, DollarSign } from "lucide-react";
import { useDishStore } from "@zustand/stores/dish";
import EditDishModal from "./EditDishModal";

interface DishDetailModalProps {
  open: boolean;
  onClose: () => void;
  dish: { id: number; name: string; price?: number; imageUrl?: string; description?: string; public?: boolean; active?: boolean } | null;
}

export function DishDetailModal({ 
  open, 
  onClose, 
  dish 
}: DishDetailModalProps) {
  const [dishDetails, setDishDetails] = useState<any>(null);
  const [recipe, setRecipe] = useState<Array<{ ingredient: { id: number; name: string; unit?: string }; quantity: number }>>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && dish?.id) {
      loadDishDetails();
    } else {
      setDishDetails(null);
      setRecipe([]);
      setIsEditing(false);
    }
  }, [open, dish?.id]);

  const loadDishDetails = async () => {
    if (!dish?.id) return;
    setIsLoading(true);
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@/utils/api");
      
      // Load dish details
      const dishRes = await bambiApi.get(API_ENDPOINTS.API_DISH_BY_ID(dish.id));
      setDishDetails(dishRes.data);
      
      // Load recipe - API trả về IngredientsGetByDishResponse hoặc array of Recipe
      try {
        const recipeRes = await bambiApi.get(API_ENDPOINTS.API_RECIPE_BY_DISH(dish.id));
        let recipeData: Array<{ ingredient: { id: number; name: string; unit?: string }; quantity: number }> = [];
        
        // Trường hợp 1: Response là array trực tiếp (array of Recipe với ingredient và quantity)
        if (Array.isArray(recipeRes.data)) {
          recipeData = recipeRes.data.map((r: any) => {
            if (r.ingredient && typeof r.quantity === 'number') {
              return {
                ingredient: {
                  id: r.ingredient.id,
                  name: r.ingredient.name || '',
                  unit: r.ingredient.unit
                },
                quantity: r.quantity
              };
            }
            return null;
          }).filter((r: any) => r !== null);
        }
        // Trường hợp 2: Response là object có ingredients array
        else if (recipeRes.data && Array.isArray(recipeRes.data.ingredients)) {
          // Nếu ingredients là array của Ingredient (không có quantity), cần lấy từ Recipe riêng
          // Hoặc có thể structure khác, tạm thời giữ nguyên
          recipeData = recipeRes.data.ingredients.map((ing: any) => ({
            ingredient: {
              id: ing.id,
              name: ing.name || '',
              unit: ing.unit
            },
            quantity: ing.quantity || 0
          }));
        }
        
        setRecipe(recipeData);
      } catch (error) {
        console.error("Error loading recipe:", error);
        setRecipe([]);
      }
    } catch (error) {
      console.error("Error loading dish details:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const getPublicBadge = (isPublic: boolean) => {
    return {
      text: isPublic ? "Công khai" : "Riêng tư",
      bgColor: isPublic ? "bg-blue-100" : "bg-gray-100",
      textColor: isPublic ? "text-blue-600" : "text-gray-600",
    };
  };

  if (!dish) return null;

  const displayDetails = dishDetails || dish;
  const publicBadge = getPublicBadge(displayDetails.public ?? true);

  return (
    <>
      <Dialog open={open && !isEditing} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="relative">
                {displayDetails.imageUrl ? (
                  <img 
                    src={displayDetails.imageUrl} 
                    alt={displayDetails.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center ${displayDetails.imageUrl ? 'hidden' : ''}`}>
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${publicBadge.bgColor.replace('100', '500')}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{displayDetails.name}</h2>
                {displayDetails.price && (
                  <p className="text-gray-600">{displayDetails.price.toLocaleString('vi-VN')} đ</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Badge className={`${publicBadge.bgColor} ${publicBadge.textColor}`}>
                    {publicBadge.text}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tên món</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                      <Utensils className="w-4 h-4 text-gray-500" />
                      <span>{displayDetails.name}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Giá (vnđ)</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>{displayDetails.price ? displayDetails.price.toLocaleString('vi-VN') : '—'}</span>
                    </div>
                  </div>
                </div>

                {displayDetails.description && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mô tả</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-700">{displayDetails.description}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Nguyên liệu</h3>
                {recipe.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <div className="divide-y">
                        {recipe.map((r, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3">
                            <div className="text-sm text-gray-800 truncate" title={r.ingredient.name}>
                              {r.ingredient.name}
                            </div>
                            <div className="text-right text-sm tabular-nums">{r.quantity}</div>
                            <div className="text-xs uppercase text-gray-500 w-14 text-right">
                              {String(r.ingredient.unit || '').toLowerCase()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-gray-500 text-center bg-gray-50 rounded-md">
                    Chưa có nguyên liệu
                  </div>
                )}
              </div>

              {/* Status Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin khác</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ID món</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <span className="font-mono text-sm">#{displayDetails.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end pt-6 border-t">
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Chỉnh sửa thông tin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isEditing && dish && (
        <EditDishModal 
          open={true} 
          onClose={() => {
            setIsEditing(false);
            loadDishDetails();
          }} 
          dish={{
            id: dish.id,
            name: displayDetails.name,
            description: displayDetails.description,
            price: displayDetails.price,
            public: displayDetails.public,
            active: displayDetails.active,
            ingredients: recipe.reduce((acc, r) => {
              acc[r.ingredient.id] = r.quantity;
              return acc;
            }, {} as Record<number, number>)
          }}
        />
      )}
    </>
  );
}

export default DishDetailModal;
