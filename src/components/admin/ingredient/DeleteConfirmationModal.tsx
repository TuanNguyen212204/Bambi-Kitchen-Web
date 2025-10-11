import { ConfirmationModal } from "@components/ui/modal/modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ingredientName: string;
}

export default function DeleteConfirmationModal({ open, onClose, onConfirm, ingredientName }: Props) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Xác nhận xóa"
      description={`Bạn có chắc chắn muốn xóa nguyên liệu "${ingredientName}" không? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.`}
      confirmText="Xóa"
      cancelText="Hủy"
      variant="destructive"
    />
  );
}
