import { useState, useEffect } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Image as ImageIcon, Edit3, Utensils, DollarSign } from "lucide-react";
import EditDishModal from "./EditDishModal";
import { useIngredientStore } from "@zustand/stores/ingredients";

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
  const [recipe, setRecipe] = useState<Array<{ 
    ingredient: { id: number; name: string; unit?: string }; 
    quantity: number;
    storedQuantity?: number;
    neededQuantity?: number;
  }>>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { items: ingredientList, fetchAll } = useIngredientStore();
  const dishIdRef = React.useRef<number | undefined>(dish?.id);
  const isLoadingRef = React.useRef(false);

  // Update ref when dish.id changes
  React.useEffect(() => {
    dishIdRef.current = dish?.id;
  }, [dish?.id]);

  // Fetch ingredients một lần khi modal mở (nếu chưa có)
  useEffect(() => {
    if (open && ingredientList.length === 0) {
      fetchAll().catch(() => {});
    }
  }, [open]); // Chỉ chạy khi modal mở, không phụ thuộc vào ingredientList để tránh infinite loop

  // Load dish details function - sử dụng useCallback để tránh recreate không cần thiết
  const loadDishDetails = React.useCallback(async () => {
    if (!dish?.id) return;
    
    // Tránh gọi nhiều lần nếu đang loading
    if (isLoadingRef.current) return;
    
    const currentDishId = dish.id;
    if (dishIdRef.current !== currentDishId) {
      dishIdRef.current = currentDishId;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@/utils/api");
      
      // Load dish details
      const dishRes = await bambiApi.get(API_ENDPOINTS.API_DISH_BY_ID(currentDishId));
      if (dishIdRef.current !== currentDishId) return; // Check lại sau khi async
      setDishDetails(dishRes.data);
      
      // Load recipe - API trả về IngredientsGetByDishResponse (API v3)
      try {
        const recipeRes = await bambiApi.get(API_ENDPOINTS.API_RECIPE_BY_DISH(currentDishId));
        if (dishIdRef.current !== currentDishId) return; // Check lại sau khi async
        
        let recipeData: Array<{ 
          ingredient: { id: number; name: string; unit?: string }; 
          quantity: number;
          storedQuantity?: number;
          neededQuantity?: number;
        }> = [];
        
        // Trường hợp 1: Response là array trực tiếp (array of Recipe với ingredient và quantity) - Legacy format
        if (Array.isArray(recipeRes.data)) {
          const validRecipes: Array<{ 
            ingredient: { id: number; name: string; unit?: string }; 
            quantity: number;
            storedQuantity?: number;
            neededQuantity?: number;
          }> = [];
          recipeRes.data.forEach((r: any) => {
            if (r.ingredient && typeof r.quantity === 'number') {
              validRecipes.push({
                ingredient: {
                  id: r.ingredient.id,
                  name: r.ingredient.name || '',
                  unit: r.ingredient.unit
                },
                quantity: r.quantity,
                storedQuantity: r.ingredient.available || r.ingredient.quantity,
                neededQuantity: r.quantity
              });
            }
          });
          recipeData = validRecipes;
        }
        // Trường hợp 2: Response là IngredientsGetByDishResponse object (API v3)
        // Theo API docs: ingredients là array of IngredientDetail
        // IngredientDetail có: id, name, storedQuantity, neededQuantity, category, imageUrl
        else if (recipeRes.data && typeof recipeRes.data === 'object' && 'ingredients' in recipeRes.data && Array.isArray((recipeRes.data as any).ingredients)) {
          const responseData = recipeRes.data as {
            ingredients?: Array<{
              id: number
              name?: string
              storedQuantity?: number
              neededQuantity?: number
              category?: {
                id?: number
                name?: string
              }
              imageUrl?: string
            }>
          }
          
          // Get current ingredientList tại thời điểm này (có thể đã được fetch)
          // Sử dụng getState() để lấy giá trị mới nhất từ store (không trigger re-render)
          const storeState = useIngredientStore.getState();
          const currentIngredientList = storeState.items || [];
          
          recipeData = (responseData.ingredients || []).map((ing: any) => {
            // Lấy unit từ allIngredients nếu có (IngredientDetail không có unit field)
            const ingredientFromStore = currentIngredientList.find(i => i.id === ing.id)
            return {
              ingredient: {
                id: ing.id,
                name: ing.name || '',
                unit: ingredientFromStore?.unit
              },
              quantity: ing.neededQuantity || 0,
              storedQuantity: ing.storedQuantity || 0,
              neededQuantity: ing.neededQuantity || 0
            };
          });
        }
        
        if (dishIdRef.current === currentDishId) {
          setRecipe(recipeData);
        }
      } catch (error) {
        console.error("Error loading recipe:", error);
        if (dishIdRef.current === currentDishId) {
          setRecipe([]);
        }
      }
    } catch (error) {
      console.error("Error loading dish details:", error);
    } finally {
      if (dishIdRef.current === currentDishId) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [dish?.id]); // Chỉ recreate khi dish.id thay đổi

  // Load dish details khi modal mở
  useEffect(() => {
    if (!open || !dish?.id) {
      setDishDetails(null);
      setRecipe([]);
      setIsEditing(false);
      isLoadingRef.current = false;
      return;
    }

    loadDishDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dish?.id]); // Chỉ chạy khi open hoặc dish.id thay đổi, không include loadDishDetails để tránh loop


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
      <Dialog
        open={open && !isEditing}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isEditing) {
            onClose();
          }
        }}
      >
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
            <DialogDescription className="sr-only">
              Chi tiết món ăn {displayDetails.name}
            </DialogDescription>
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
                        {recipe.map((r, idx) => {
                          const formatUnit = (unit?: string) => {
                            if (!unit) return "";
                            const unitUpper = unit.toUpperCase();
                            // KILOGRAM: ẩn không hiển thị gì
                            if (unitUpper === "KILOGRAM") return "";
                            // LITER: hiển thị ml
                            if (unitUpper === "LITER") return "ml";
                            const unitMap: Record<string, string> = {
                              GRAM: "g",
                              PCS: "phần",
                            };
                            return unitMap[unitUpper] || unit.toLowerCase();
                          };
                          
                          const unit = formatUnit(r.ingredient.unit);
                          const storedQty = r.storedQuantity ?? 0;
                          const neededQty = r.neededQuantity ?? r.quantity ?? 0;
                          const isLowStock = storedQty < neededQty;
                          
                          return (
                            <div key={idx} className="px-4 py-3 hover:bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-gray-800 truncate flex-1" title={r.ingredient.name}>
                                  {r.ingredient.name}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500">Cần dùng: </span>
                                  <span className="font-semibold text-gray-800">
                                    {neededQty.toLocaleString('vi-VN')} {unit}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Trong kho: </span>
                                  <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                                    {storedQty.toLocaleString('vi-VN')} {unit}
                                  </span>
                                  {isLowStock && (
                                    <Badge variant="destructive" className="ml-2 text-xs">Thiếu</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
