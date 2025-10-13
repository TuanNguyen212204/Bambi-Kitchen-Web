import React, { useState } from "react";
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
import ReusableModal, { ModalForm } from "@components/ui/modal/modal";
import { useAccountStore } from "@zustand/stores/account";
import { toast } from "sonner";

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { create, loading } = useAccountStore();
  const [formData, setFormData] = useState({
    name: "",
    mail: "",
    password: "",
    role: "USER" as "ADMIN" | "STAFF" | "USER",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create(formData);
      toast.success("Tạo tài khoản thành công!");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        mail: "",
        password: "",
        role: "USER",
        phone: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi tạo tài khoản");
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      mail: "",
      password: "",
      role: "USER",
      phone: "",
    });
    onOpenChange(false);
  };

  return (
    <ReusableModal
      open={open}
      onClose={handleClose}
      title="Thêm tài khoản mới"
      description="Tạo tài khoản mới cho người dùng, nhân viên hoặc quản trị viên."
      size="md"
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
          <Label htmlFor="password">Mật khẩu *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            required
            minLength={6}
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
            placeholder="Nhập số điện thoại (tùy chọn)"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </div>
      </ModalForm>
    </ReusableModal>
  );
};