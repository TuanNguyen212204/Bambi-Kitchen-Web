import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import React from "react"

interface CheckoutOrderNoteSectionProps {
  orderNote: string
  onOrderNoteChange: (note: string) => void
}

export const CheckoutOrderNoteSection: React.FC<CheckoutOrderNoteSectionProps> = ({
  orderNote,
  onOrderNoteChange,
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-[#fc8a06]" />
        <h3 className="font-semibold text-black text-sm">
          Order Note
        </h3>
      </div>
      <Textarea
        value={orderNote}
        onChange={(e) => onOrderNoteChange(e.target.value)}
        className="min-h-20 bg-[#f5f5f5] border-none rounded-lg text-sm px-3 py-2"
        placeholder="Ghi chú cho đơn hàng (ví dụ: Giao trước 7h tối)"
        rows={3}
      />
    </div>
  )
}

export default CheckoutOrderNoteSection

