import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Switch } from "@components/ui/switch";
import { User, Mail, Phone, Save, X } from "lucide-react";
import type { StoreAccount } from "@/zustand/types/account";

interface AccountDetailModalProps {
  open: boolean;
  onClose: () => void;
  account: StoreAccount | null;
  onSave?: (updatedAccount: Partial<StoreAccount>) => Promise<void>;
  onDelete?: (accountId: number) => Promise<void>;
}

export function AccountDetailModal({ 
  open, 
  onClose, 
  account, 
  onSave, 
  onDelete 
}: AccountDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: account?.name || "",
    mail: account?.mail || "",
    phone: account?.phone || "",
    role: account?.role || "USER",
    active: account?.active !== false
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || "",
        mail: account.mail || "",
        phone: account.phone || "",
        role: account.role || "USER",
        active: account.active !== false
      });
      setIsEditing(false);
    }
  }, [account]);

  const handleSave = async () => {
    if (!account || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave({
        id: account.id,
        ...formData,
        active: formData.active
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving account:", error);
    } finally {
      setIsSaving(false);
    }
  };


  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Quản trị viên";
      case "STAFF": return "Nhân viên";
      case "USER": return "Người dùng";
      default: return role;
    }
  };

  const getStatusBadge = (active: boolean) => {
    return {
      text: active ? "Hoạt động" : "Không hoạt động",
      bgColor: active ? "bg-green-100" : "bg-red-100",
      textColor: active ? "text-green-600" : "text-red-600",
    };
  };

  if (!account) return null;

  const statusBadge = getStatusBadge(account.active !== false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${statusBadge.bgColor.replace('100', '500')}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{account.name}</h2>
              <p className="text-gray-600">{account.mail}</p>
              <Badge className={`${statusBadge.bgColor} ${statusBadge.textColor} mt-1`}>
                {statusBadge.text}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin cá nhân</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập họ và tên"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{account.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Vai trò</Label>
                {isEditing ? (
                  <Select value={formData.role} onValueChange={(value: "USER" | "STAFF" | "ADMIN") => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Người dùng</SelectItem>
                      <SelectItem value="STAFF">Nhân viên</SelectItem>
                      <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <Badge variant="secondary">{getRoleLabel(account.role)}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.mail}
                    onChange={(e) => setFormData(prev => ({ ...prev, mail: e.target.value }))}
                    placeholder="Nhập email"
                    className="pl-10"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{account.mail}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Nhập số điện thoại"
                    className="pl-10"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{account.phone || "Chưa cập nhật"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Trạng thái tài khoản</h3>
            
            <div className="space-y-2">
              <Label>Trạng thái hoạt động</Label>
              {isEditing ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <span className="text-sm text-gray-600">
                    {formData.active ? "Tài khoản đang hoạt động" : "Tài khoản bị tạm khóa"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Badge className={`${statusBadge.bgColor} ${statusBadge.textColor}`}>
                    {statusBadge.text}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>ID tài khoản</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <span className="font-mono text-sm">#{account.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end pt-6 border-t">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: account.name,
                      mail: account.mail,
                      phone: account.phone || "",
                      role: account.role,
                      active: account.active !== false
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Chỉnh sửa thông tin
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AccountDetailModal;
