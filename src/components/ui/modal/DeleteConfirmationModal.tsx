import React from "react";
import { ConfirmationModal } from "@components/ui/modal/modal";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Xác nhận xóa",
  description,
  itemName,
  itemType = "mục"
}) => {
  const defaultDescription = description || 
    `Bạn có chắc chắn muốn xóa ${itemType}${itemName ? ` "${itemName}"` : ""} không? Hành động này không thể hoàn tác.`;

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={defaultDescription}
      confirmText={`Xóa ${itemType}`}
      cancelText="Hủy"
      variant="destructive"
    />
  );
};
