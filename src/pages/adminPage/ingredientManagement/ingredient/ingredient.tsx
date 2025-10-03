import { Card, CardContent } from "@components/ui/card/card";
import { AlertSection } from "@components/admin/ingredient/AlertSection";
import { NotificationSection } from "@components/admin/ingredient/NotificationSection";
import { ResourceListSection } from "@components/admin/ingredient/ResourceListSection";
import { useIngredientStore } from "@zustand/stores/ingredients";
import { useEffect } from "react";

export const AdminIngredientsPage = () => {
  const currentDate = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const { fetchAll, items } = useIngredientStore()
  useEffect(() => { fetchAll() }, [fetchAll])

  const total = items.length
  const activeCount = items.filter((i: { active?: boolean }) => i.active ?? true).length
  const lowCount = items.filter((i: { stockStatus?: string }) => i.stockStatus === 'low').length
  const outCount = items.filter((i: { stockStatus?: string }) => i.stockStatus === 'out').length

  const metricCards = [
    {
      title: "Tổng nguyên liệu",
      value: String(total),
      subtitle: total > 0 ? `+${Math.max(0, 0)} loại mới tuần này` : "",
      icon: "📦",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Đang hoạt động",
      value: String(activeCount),
      subtitle: total ? `${((activeCount / total) * 100).toFixed(1)}% đang sử dụng` : "0%",
      icon: "✅",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Sắp hết hàng",
      value: String(lowCount),
      subtitle: lowCount > 0 ? "Cần bổ sung ngay" : "",
      icon: "!",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      subtitleColor: "text-red-500",
    },
    {
      title: "Hết hàng",
      value: String(outCount),
      subtitle: outCount > 0 ? "Cần nhập khẩn cấp" : "",
      icon: "🚫",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      subtitleColor: "text-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Quản lý Thành phần
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <Card key={index} className="border border-solid shadow-[0px_1px_3px_#0000001a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-500 text-sm leading-[21px] mb-4">
                      {card.title}
                    </div>
                    <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[32px] leading-[48px] mb-2">
                      {card.value}
                    </div>
                    <div className={`[font-family:'Inter-Medium',Helvetica] font-medium text-sm leading-[21px] ${card.subtitleColor}`}>
                      {card.subtitle}
                    </div>
                  </div>
                  <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <span className={`text-xl ${card.iconColor}`}>{card.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <NotificationSection />
      <AlertSection />
      <ResourceListSection />
    </div>
  );
};

export default AdminIngredientsPage;