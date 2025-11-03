import React, { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Switch } from "@components/ui/switch";
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal";
import { useAccountStore } from "@zustand/stores/account";
import { toast } from "sonner";

interface EditAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any;
  onSuccess: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  open,
  onOpenChange,
  account,
  onSuccess,
}) => {
  const { update, loading } = useAccountStore();
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    mail: "",
    role: "USER" as "ADMIN" | "STAFF" | "USER",
    phone: "",
    active: true,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        id: account.id,
        name: account.name || "",
        mail: account.mail || "",
        role: account.role || "USER",
        phone: account.phone || "",
        active: account.active !== false,
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update(formData);
      toast.success("Cập nhật tài khoản thành công!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Có lỗi xảy ra khi cập nhật tài khoản");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!account) return null;

  return (
    <ReusableModal
      open={open}
      onClose={handleClose}
      title="Chỉnh sửa tài khoản"
      description={`Cập nhật thông tin tài khoản: ${account.name}`}
      size="md"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={undefined}
          confirmText="Cập nhật"
          cancelText="Hủy"
          loading={loading}
        />
      }
    >
      <ModalForm onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Tên đầy đủ *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nhập tên đầy đủ"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mail">Email *</Label>
          <Input
            id="mail"
            type="email"
            value={formData.mail}
            onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
            placeholder="Nhập email"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Vai trò *</Label>
          <Select
            value={formData.role}
            onValueChange={(value: "ADMIN" | "STAFF" | "USER") =>
              setFormData({ ...formData, role: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">Người dùng</SelectItem>
              <SelectItem value="STAFF">Nhân viên</SelectItem>
              <SelectItem value="ADMIN">Quản trị viên</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Nhập số điện thoại"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
          <Label htmlFor="active">Tài khoản hoạt động</Label>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </div>
      </ModalForm>
    </ReusableModal>
  );
};
