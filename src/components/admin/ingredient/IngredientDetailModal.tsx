import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Box, DollarSign, Edit3, Image as ImageIcon, Package } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import EditIngredientModal from "./EditIngredientModal";

interface IngredientDetailModalProps {
  open: boolean;
  onClose: () => void;
  ingredient: { id: number; name: string; unit?: string; imgUrl?: string; active?: boolean; stock?: number; quantity?: number; available?: number; reserve?: number; stockStatus?: 'out'|'low'|'normal'; category?: unknown; pricePerUnit?: number } | null;
}

export function IngredientDetailModal({ 
  open, 
  onClose, 
  ingredient 
}: IngredientDetailModalProps) {
  const [ingredientDetails, setIngredientDetails] = useState<{
    id: number;
    name: string;
    unit?: string;
    imgUrl?: string;
    active?: boolean;
    stock?: number;
    quantity?: number;
    available?: number;
    reserve?: number;
    stockStatus?: 'out'|'low'|'normal';
    category?: unknown;
    pricePerUnit?: number;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadIngredientDetails = useCallback(async () => {
    if (!ingredient?.id) return;
    setIsLoading(true);
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@/utils/api");
      
      // Load ingredient details
      const ingredientRes = await bambiApi.get(API_ENDPOINTS.API_INGREDIENT_BY_ID(ingredient.id));
      setIngredientDetails(ingredientRes.data as {
        id: number;
        name: string;
        unit?: string;
        imgUrl?: string;
        active?: boolean;
        stock?: number;
        quantity?: number;
        available?: number;
        reserve?: number;
        stockStatus?: 'out'|'low'|'normal';
        category?: unknown;
        pricePerUnit?: number;
      });
    } catch (error) {
      console.error("Error loading ingredient details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [ingredient?.id]);

  useEffect(() => {
    if (open && ingredient?.id) {
      loadIngredientDetails();
    } else {
      setIngredientDetails(null);
      setIsEditing(false);
    }
  }, [open, ingredient?.id, loadIngredientDetails]);


  const getActiveBadge = (isActive: boolean) => {
    return {
      text: isActive ? "Đang hoạt động" : "Đang tắt",
      bgColor: isActive ? "bg-green-100" : "bg-red-100",
      textColor: isActive ? "text-green-600" : "text-red-600",
    };
  };

  const getStockBadge = (stockStatus?: 'out'|'low'|'normal') => {
    if (stockStatus === 'out') {
      return { text: "Hết hàng", bgColor: "bg-red-100", textColor: "text-red-600" };
    } else if (stockStatus === 'low') {
      return { text: "Sắp hết", bgColor: "bg-amber-100", textColor: "text-amber-600" };
    }
    return { text: "Bình thường", bgColor: "bg-green-100", textColor: "text-green-600" };
  };

  if (!ingredient) return null;

  const displayDetails = ingredientDetails || ingredient;
  const activeBadge = getActiveBadge(displayDetails.active ?? true);
  const stockBadge = getStockBadge(displayDetails.stockStatus);

  return (
    <>
      <Dialog open={open && !isEditing} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="relative">
                {displayDetails.imgUrl ? (
                  <img 
                    src={displayDetails.imgUrl} 
                    alt={displayDetails.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center ${displayDetails.imgUrl ? 'hidden' : ''}`}>
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${stockBadge.bgColor.replace('100', '500')}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{displayDetails.name}</h2>
                {displayDetails.unit && (
                  <p className="text-gray-600">Đơn vị: {displayDetails.unit}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Badge className={`${activeBadge.bgColor} ${activeBadge.textColor}`}>
                    {activeBadge.text}
                  </Badge>
                  <Badge className={`${stockBadge.bgColor} ${stockBadge.textColor}`}>
                    {stockBadge.text}
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
                    <label className="text-sm font-medium text-gray-700">Tên nguyên liệu</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span>{displayDetails.name}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Đơn vị</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                      <Box className="w-4 h-4 text-gray-500" />
                      <span>{displayDetails.unit || '—'}</span>
                    </div>
                  </div>
                </div>

                {displayDetails.pricePerUnit != null && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Giá mỗi đơn vị (vnđ)</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>{displayDetails.pricePerUnit.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin tồn kho</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tồn kho hiện tại (quantity)</label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-700 font-medium">
                      {(displayDetails.quantity != null ? displayDetails.quantity : (displayDetails.stock != null ? displayDetails.stock : '—'))}
                    </span>
                    {displayDetails.unit && (
                      <span className="text-gray-500 ml-2">{displayDetails.unit}</span>
                    )}
                  </div>
                </div>

                {/* Hiển thị thêm available nếu có */}
                {displayDetails.available != null && displayDetails.available !== displayDetails.quantity && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Có sẵn (available)</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-700 font-medium">{displayDetails.available}</span>
                      {displayDetails.unit && (
                        <span className="text-gray-500 ml-2">{displayDetails.unit}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Trạng thái tồn kho</label>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    {(() => {
                      const stockValue = typeof displayDetails.quantity === 'number' 
                        ? displayDetails.quantity 
                        : (typeof displayDetails.stock === 'number' ? displayDetails.stock : null)
                      return stockValue != null ? (
                        <div 
                          className={`${displayDetails.stockStatus === 'out' ? 'bg-red-600' : displayDetails.stockStatus === 'low' ? 'bg-amber-600' : 'bg-green-600'} h-full rounded-full transition-all`} 
                          style={{ width: `${Math.max(0, Math.min(100, (stockValue / 20) * 100))}%` }} 
                        />
                      ) : null
                    })()}
                  </div>
                </div>
              </div>

              {/* Category Information */}
              {displayDetails.category != null && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Danh mục</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Danh mục</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-700">
                        {typeof displayDetails.category === 'object' && displayDetails.category !== null && 'name' in displayDetails.category
                          ? String((displayDetails.category as { name?: string }).name || '—')
                          : typeof displayDetails.category === 'string' || typeof displayDetails.category === 'number'
                          ? String(displayDetails.category)
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin khác</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ID nguyên liệu</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <span className="font-mono text-sm">#{displayDetails.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">


            <div className="flex items-center gap-3">
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Chỉnh sửa thông tin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isEditing && ingredient && (
        <EditIngredientModal 
          open={true} 
          onClose={() => {
            setIsEditing(false);
            loadIngredientDetails();
          }} 
          ingredient={{
            id: ingredient.id,
            name: displayDetails.name,
            unit: displayDetails.unit,
            active: displayDetails.active,
            ingredient_category_id: typeof displayDetails.category === 'object' && displayDetails.category !== null && 'id' in displayDetails.category
              ? (displayDetails.category as { id?: number }).id
              : undefined,
            category: typeof displayDetails.category === 'object' && displayDetails.category !== null && 'id' in displayDetails.category
              ? { id: (displayDetails.category as { id?: number }).id! }
              : null,
            imgUrl: displayDetails.imgUrl,
            pricePerUnit: displayDetails.pricePerUnit,
            quantity: displayDetails.quantity,
            available: displayDetails.available,
            reserve: displayDetails.reserve,
            stock: displayDetails.stock,
          }}
        />
      )}


    </>
  );
}

export default IngredientDetailModal;

