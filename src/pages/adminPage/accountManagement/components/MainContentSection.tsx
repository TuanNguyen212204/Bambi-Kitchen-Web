import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Users, CheckCircle, Star, Calendar, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccountStore } from "@zustand/stores/account";
import { accountSelectors } from "@zustand/selectors/account";
import { AddAccountModal } from "@components/admin/account/AddAccountModal";
import { EditAccountModal } from "@components/admin/account/EditAccountModal";
import { DeleteConfirmationModal } from "@components/admin/account/DeleteConfirmationModal";

export default function MainContentSection() {
  const {
    fetchAll,
    fetchStats,
    loading,
    error,
    query,
    setQuery,
    selectedRole,
    setSelectedRole,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    remove
  } = useAccountStore();

  const accounts = useAccountStore(accountSelectors.selectFilteredAccounts);
  const totalAccounts = useAccountStore(accountSelectors.selectTotalAccounts);
  const activeAccounts = useAccountStore(accountSelectors.selectActiveAccounts);
  const adminAccounts = useAccountStore(accountSelectors.selectAdminAccounts);
  const staffAccounts = useAccountStore(accountSelectors.selectStaffAccounts);
  const userAccounts = useAccountStore(accountSelectors.selectUserAccounts);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    fetchAll();
    fetchStats();
  }, [fetchAll, fetchStats]);

  const statsData = [
    {
      title: "Tổng tài khoản",
      value: totalAccounts.toString(),
      subtitle: `+${Math.floor(totalAccounts * 0.1)} tài khoản mới tháng này`,
      icon: Users,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Tài khoản hoạt động",
      value: activeAccounts.toString(),
      subtitle: `${Math.round((activeAccounts / totalAccounts) * 100)}% tổng tài khoản`,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Quản trị viên",
      value: adminAccounts.toString(),
      subtitle: `${staffAccounts} nhân viên, ${userAccounts} người dùng`,
      icon: Star,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      subtitleColor: "text-gray-600",
    },
    {
      title: "Tỷ lệ hoạt động",
      value: `${Math.round((activeAccounts / totalAccounts) * 100)}%`,
      subtitle: "Tăng 5% so với tháng trước",
      icon: Calendar,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-500",
      subtitleColor: "text-green-600",
    },
  ];

  const handleEdit = (account: any) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleDelete = (account: any) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedAccount) {
      try {
        await remove(selectedAccount.id);
        await fetchStats();
        setShowDeleteModal(false);
        setSelectedAccount(null);
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "STAFF":
        return "Nhân viên";
      case "USER":
        return "Người dùng";
      default:
        return role;
    }
  };

  const getStatusBadge = (account: any) => {
    const isActive = account.active !== false;
    return {
      text: isActive ? "Hoạt động" : "Không hoạt động",
      bgColor: isActive ? "bg-green-100" : "bg-red-100",
      textColor: isActive ? "text-green-600" : "text-red-600",
    };
  };

  return (
    <section className="flex-1 overflow-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="shadow-[0px_1px_3px_#0000001a]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <p className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-500 text-sm leading-[21px]">
                  {stat.title}
                </p>
                <div className={`${stat.bgColor} rounded-lg p-2`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[32px] leading-[48px] mb-2">
                {stat.value}
              </p>
              <p
                className={`[font-family:'Inter-Medium',Helvetica] font-medium ${stat.subtitleColor} text-sm leading-[21px]`}
              >
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-[0px_1px_3px_#0000001a]">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Quản lý Tài khoản
            </h2>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 h-auto"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                Thêm tài khoản mới
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm tài khoản
              </label>
              <Input
                placeholder="Tên, email, số điện thoại..."
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Vai trò
              </label>
              <Select value={selectedRole || "all"} onValueChange={(value: string) => setSelectedRole(value === "all" ? undefined : value as "ADMIN" | "STAFF" | "USER")}>
                <SelectTrigger className="bg-[#efefef]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  <SelectItem value="STAFF">Nhân viên</SelectItem>
                  <SelectItem value="USER">Người dùng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Trạng thái
              </label>
              <div className="flex gap-2">
                <Select value={statusFilter || "all"} onValueChange={(value: string) => setStatusFilter(value as "all" | "active" | "inactive")}>
                  <SelectTrigger className="bg-[#efefef] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-[0px_1px_3px_#0000001a]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Danh sách Tài khoản ({accounts.length} người)
            </h2>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={viewMode === "grid" ? "bg-orange-600 hover:bg-orange-700 h-auto" : "h-auto"}
                onClick={() => setViewMode("grid")}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-[13.3px]">
                  🔲 Grid
                </span>
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "outline"} 
                size="sm" 
                className={viewMode === "list" ? "bg-orange-600 hover:bg-orange-700 h-auto" : "h-auto"}
                onClick={() => setViewMode("list")}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-black text-[13.3px]">
                  📋 List
                </span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {accounts.map((account, index) => {
                const statusBadge = getStatusBadge(account);
                return (
                  <Card key={index} className="overflow-hidden">
                    <div className="h-[120px] bg-[linear-gradient(161deg,rgba(254,215,170,1)_0%,rgba(253,186,116,1)_100%)] flex justify-end p-3">
                      <Badge
                        className={`${statusBadge.bgColor} ${statusBadge.textColor} rounded-full h-auto`}
                      >
                        <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-xs leading-[18px]">
                          {statusBadge.text}
                        </span>
                      </Badge>
                    </div>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
                            {account.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-500 h-auto"
                          >
                            <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-xs leading-[18px]">
                              {getRoleLabel(account.role)}
                            </span>
                          </Badge>
                        </div>
                        <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[19.6px] space-y-1">
                          <p>📧 {account.mail}</p>
                          {account.phone && <p>📞 {account.phone}</p>}
                          <p>🆔 ID: {account.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-md p-2 text-center">
                          <p className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-xl leading-[30px]">
                            {account.role}
                          </p>
                          <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-xs leading-[18px]">
                            Vai trò
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2 text-center">
                          <p className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-xl leading-[30px]">
                            {statusBadge.text}
                          </p>
                          <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-xs leading-[18px]">
                            Trạng thái
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-gray-100 hover:bg-gray-200 h-auto"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-gray-700 text-xs">
                            Xem
                          </span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 h-auto"
                          onClick={() => handleEdit(account)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-xs">
                            Sửa
                          </span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-red-100 hover:bg-red-200 text-red-800 h-auto"
                          onClick={() => handleDelete(account)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[10.7px]">
                            Xóa
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddAccountModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          fetchAll();
          fetchStats();
        }}
      />
      
      <EditAccountModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        account={selectedAccount}
        onSuccess={() => {
          fetchAll();
          fetchStats();
        }}
      />
      
      <DeleteConfirmationModal 
        open={showDeleteModal} 
        onOpenChange={setShowDeleteModal}
        account={selectedAccount}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
