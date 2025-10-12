import React from "react";
import { ConfirmationModal } from "@components/ui/modal/modal";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onOpenChange,
  account,
  onConfirm,
}) => {
  if (!account) return null;

  return (
    <ConfirmationModal
      open={open}
      onClose={() => onOpenChange(false)}
      onConfirm={onConfirm}
      title="Xác nhận xóa tài khoản"
      description={`Bạn có chắc chắn muốn xóa tài khoản "${account.name}" không? Hành động này không thể hoàn tác.`}
      confirmText="Xóa tài khoản"
      cancelText="Hủy"
      variant="destructive"
    />
  );
};
