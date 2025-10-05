import { Button } from "@components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ingredientName: string;
}

export default function DeleteConfirmationModal({ open, onClose, onConfirm, ingredientName }: Props) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700">
              Bạn có chắc chắn muốn xóa nguyên liệu{" "}
              <span className="font-semibold text-gray-900">"{ingredientName}"</span> không?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Tất cả dữ liệu liên quan đến nguyên liệu này sẽ bị xóa vĩnh viễn.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-4 py-2"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Xóa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
