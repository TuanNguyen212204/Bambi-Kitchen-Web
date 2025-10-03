import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card/card";
import { AlertTriangle } from "lucide-react";

const ingredientData = [
  { name: "Cá tươi", current: 2, total: 20, unit: "kg" },
  { name: "Thịt bò", current: 3, total: 25, unit: "kg" },
  { name: "Rau thơm", current: 1, total: 15, unit: "kg" },
];

export const NotificationSection = (): JSX.Element => {
  return (
    <section className="w-full relative">
      <div className="bg-amber-100 border border-amber-200 p-6 rounded-md">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-1" />
          <div className="flex-1">
            <div className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-amber-800 text-lg mb-4">
              Cảnh báo nguyên liệu sắp hết
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ingredientData.map((ingredient, index) => (
                <Card key={index} className="bg-white border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-800 text-base">
                        {ingredient.name}
                      </span>
                      <span className="[font-family:'Inter-Bold',Helvetica] font-bold text-red-600 text-base">
                        {ingredient.current}/{ingredient.total} {ingredient.unit}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs [font-family:'Arial-Narrow',Helvetica] h-auto px-3 py-1.5"
                      >
                        Đặt hàng
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-gray-500 hover:bg-gray-600 text-white text-xs [font-family:'Arial-Narrow',Helvetica] h-auto px-3 py-1.5"
                      >
                        Tạm ngừng
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotificationSection;



