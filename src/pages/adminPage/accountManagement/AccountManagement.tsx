import { Card, CardContent } from "@components/ui/card/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { DeleteConfirmationModal } from "@components/ui/modal/DeleteConfirmationModal";
import { Users, CheckCircle, Star, Calendar, Plus, Eye } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAccountStore } from "@zustand/stores/account";
import { AddAccountModal } from "@components/admin/account/AddAccountModal";
import { AccountDetailModal } from "@components/admin/account/AccountDetailModal";
import { MoreVertical, Trash2 as TrashIcon, User as UserIcon } from "lucide-react";

export default function AccountManagement() {
  const currentDate = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const {
    fetchAll,
    fetchStats,
    loading,
    error,
    query,
    setQuery,
    searchByName,
    selectedRole,
    setSelectedRole,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    remove,
    update
  } = useAccountStore();

  const store = useAccountStore();
  
  const accounts = useMemo(() => store.getFilteredItems(), [store]);
  const totalAccounts = useMemo(() => store.items.length, [store.items]);
  const activeAccounts = useMemo(() => store.items.filter(acc => acc.active !== false).length, [store.items]);
  const adminAccounts = useMemo(() => store.items.filter(acc => acc.role === "ADMIN").length, [store.items]);
  const staffAccounts = useMemo(() => store.items.filter(acc => acc.role === "STAFF").length, [store.items]);
  const userAccounts = useMemo(() => store.items.filter(acc => acc.role === "USER").length, [store.items]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);

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
      subtitle: `${totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0}% tổng tài khoản`,
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
      value: `${totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0}%`,
      subtitle: "Tăng 5% so với tháng trước",
      icon: Calendar,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-500",
      subtitleColor: "text-green-600",
    },
  ];

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

  const handleViewDetail = (account: any) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
  };

  const handleSaveAccount = async (updatedAccount: any) => {
    try {
      if (updatedAccount.id) {
        await update({
          id: updatedAccount.id,
          name: updatedAccount.name,
          mail: updatedAccount.mail,
          role: updatedAccount.role,
          active: updatedAccount.active
        });
      }
    } catch (error) {
      console.error("Error saving account:", error);
      throw error;
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    try {
      await remove(accountId);
      await fetchAll();
      setShowDeleteModal(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const openDeleteModal = (account: any) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Quản lý Tài khoản
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="border border-solid shadow-[0px_1px_3px_#0000001a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-500 text-sm leading-[21px] mb-4">
                      {stat.title}
                    </div>
                    <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[32px] leading-[48px] mb-2">
                      {stat.value}
                    </div>
                    <div className={`[font-family:'Inter-Medium',Helvetica] font-medium text-sm leading-[21px] ${stat.subtitleColor}`}>
                      {stat.subtitle}
                    </div>
                  </div>
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
          <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Quản lý Tài khoản
            </h2>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 h-auto px-3 py-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                Thêm tài khoản mới
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm tài khoản
              </label>
              <Input
                placeholder="Tên, email, số điện thoại..."
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm h-auto py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Vai trò
              </label>
              <Select value={selectedRole || "all"} onValueChange={(value: string) => setSelectedRole(value === "all" ? undefined : value as "ADMIN" | "STAFF" | "USER")}>
                <SelectTrigger className="bg-white h-auto py-2">
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
              <Select value={statusFilter || "all"} onValueChange={(value: string) => setStatusFilter(value as "all" | "active" | "inactive")}>
                <SelectTrigger className="bg-white h-auto py-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm
              </label>
                          <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700 h-auto py-2"
                            onClick={() => {
                              if (query.trim()) {
                                searchByName(query.trim());
                              } else {
                                fetchAll();
                              }
                            }}
                          >
                            <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                              Tìm kiếm
                            </span>
                          </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Danh sách Tài khoản ({totalAccounts} người)
            </h3>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={`h-auto ${viewMode === "grid" ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-white text-black hover:bg-gray-50"} border border-solid px-3 py-2`}
                onClick={() => setViewMode("grid")}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">
                  🔲 Grid
                </span>
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "outline"} 
                size="sm" 
                className={`h-auto ${viewMode === "list" ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-white text-black hover:bg-gray-50"} border-gray-300 px-3 py-2`}
                onClick={() => setViewMode("list")}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">
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
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "grid grid-cols-1 gap-3"}>
              {accounts.map((account, index) => {
                const statusBadge = getStatusBadge(account);
                return (
                  <Card key={index} className="bg-white border-2 border-gray-200">
                    <CardContent className="p-6 space-y-4">
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                          <UserIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                          account.active !== false ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm leading-[20px] mb-1 line-clamp-2" title={account.name}>
                                          {account.name || 'Chưa có tên'}
                                        </h3>
                                        <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-xs leading-[16px] opacity-75 line-clamp-2" title={account.mail}>
                                          {account.mail || 'Chưa có email'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <div className="relative">
                                        <button
                                          className="w-8 h-8 rounded hover:bg-black/10 flex items-center justify-center"
                                          onClick={(e) => {
                                            const menu = (e.currentTarget.nextSibling as HTMLElement);
                                            if (menu) menu.classList.toggle('hidden');
                                          }}
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                        <div className="absolute right-0 mt-1 bg-white border rounded shadow hidden z-10 min-w-[120px]">
                                          <button
                                            className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap"
                                            onClick={() => handleViewDetail(account)}
                                          >
                                            <Eye className="w-4 h-4" /> Xem chi tiết
                                          </button>
                                          <button 
                                            className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap" 
                                            onClick={() => openDeleteModal(account)}
                                          >
                                            <TrashIcon className="w-4 h-4 text-red-600" /> Xóa
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-700">Trạng thái</span>
                          <Badge className={`${statusBadge.bgColor} ${statusBadge.textColor} text-xs`}>
                            {statusBadge.text}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-700">ID tài khoản</span>
                          <span className="text-sm text-gray-700">#{account.id}</span>
                        </div>
                        {account.phone && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-700">Điện thoại</span>
                            <span className="text-sm text-gray-700">{account.phone}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-700">Vai trò</span>
                          <Badge variant="secondary" className="bg-[#0000001a] hover:bg-[#0000001a] px-3 py-1">
                            <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-gray-700 text-sm text-center">
                              {getRoleLabel(account.role)}
                            </span>
                          </Badge>
                        </div>
                      </div>


                                  <div className="bg-[#0000001a] rounded-md p-3 space-y-2">
                                    <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-sm">
                                      Thông tin bổ sung
                                    </h4>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-700 text-xs opacity-80">Ngày tạo:</span>
                                        <span className="[font-family:'Inter-Regular',Helvetica] text-gray-700 text-xs opacity-80 truncate ml-2">N/A</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-700 text-xs opacity-80">Lần đăng nhập cuối:</span>
                                        <span className="[font-family:'Inter-Regular',Helvetica] text-gray-700 text-xs opacity-80 truncate ml-2">N/A</span>
                                      </div>
                                    </div>
                                  </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AddAccountModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          fetchAll();
          fetchStats();
        }}
      />
      
      <AccountDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
      />

      <DeleteConfirmationModal
        open={showDeleteModal && !!accountToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setAccountToDelete(null);
        }}
        onConfirm={async () => {
          if (accountToDelete?.id) {
            try {
              await handleDeleteAccount(accountToDelete.id);
              setShowDeleteModal(false);
              setAccountToDelete(null);
            } catch (error) {
              console.error("Error deleting account:", error);
            }
          }
        }}
        title="Xác nhận xóa tài khoản"
        itemName={accountToDelete?.name || 'Chưa có tên'}
        itemType="tài khoản"
      />
    </div>
  );
}