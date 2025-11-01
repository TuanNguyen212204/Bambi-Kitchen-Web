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
import { Plus, Copy, Phone, Mail, UserCheck } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAccountStore } from "@zustand/stores/account";
import { AddAccountModal } from "@components/admin/account/AddAccountModal";
import { AccountDetailModal } from "@components/admin/account/AccountDetailModal";

export default function StaffManagement() {
  const currentDate = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const {
    fetchAll,
    loading,
    error,
    query,
    setQuery,
    searchByName,
    statusFilter,
    setStatusFilter,
    remove,
    update
  } = useAccountStore();

  const store = useAccountStore();
  
  // Filter only STAFF accounts
  const staffAccounts = useMemo(() => {
    const allAccounts = store.getFilteredItems();
    return allAccounts.filter(acc => acc.role === "STAFF");
  }, [store]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAccountSelect = (account: any) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
  };

  const getInitials = (name: string) => {
    if (!name) return "S";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSaveAccount = async (updatedAccount: any) => {
    try {
      if (updatedAccount.id) {
        await update({
          id: updatedAccount.id,
          name: updatedAccount.name,
          mail: updatedAccount.mail,
          role: "STAFF",
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

  const getStatusBadge = (account: any) => {
    const isActive = account.active !== false;
    return {
      text: isActive ? "Hoạt động" : "Không hoạt động",
      bgColor: isActive ? "bg-green-100" : "bg-red-100",
      textColor: isActive ? "text-green-600" : "text-red-600",
    };
  };

  const filteredStaff = useMemo(() => {
    let filtered = staffAccounts;
    
    if (query.trim()) {
      filtered = filtered.filter(acc => 
        acc.name?.toLowerCase().includes(query.toLowerCase()) ||
        acc.mail?.toLowerCase().includes(query.toLowerCase()) ||
        acc.phone?.includes(query)
      );
    }
    
    if (statusFilter === "active") {
      filtered = filtered.filter(acc => acc.active !== false);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(acc => acc.active === false);
    }
    
    return filtered;
  }, [staffAccounts, query, statusFilter]);

  return (
    <div className="space-y-6 pb-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Header */}
      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Quản lý Staff
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-gray-800" />
              <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
                Danh sách Staff
              </h2>
            </div>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 h-auto px-3 py-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                Thêm Staff mới
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm Staff
              </label>
              <Input
                placeholder="Tên, email, số điện thoại..."
                className="bg-white h-auto py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
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
          <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px] mb-4">
            Danh sách Staff ({filteredStaff.length} người)
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((account, index) => {
                const statusBadge = getStatusBadge(account);
                const initials = getInitials(account.name || "");
                
                return (
                  <Card key={index} className="bg-white border-2 border-gray-200 hover:border-orange-300 transition-all cursor-pointer" onClick={() => handleAccountSelect(account)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-semibold text-sm">
                            {initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm leading-[20px] mb-1">
                            {account.name || 'Chưa có tên'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <span className="font-medium">Mã: S{account.id?.toString().padStart(3, '0')}</span>
                            <Copy className="w-3 h-3 cursor-pointer hover:text-gray-800" onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`S${account.id?.toString().padStart(3, '0')}`);
                            }} />
                          </div>
                          {account.phone && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                              <Phone className="w-3 h-3" />
                              <span>{account.phone}</span>
                            </div>
                          )}
                          {account.mail && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{account.mail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <Badge className={`${statusBadge.bgColor} ${statusBadge.textColor} text-xs`}>
                          {statusBadge.text}
                        </Badge>
                        <span className="text-xs text-gray-500">ID: #{account.id}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredStaff.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Không có Staff nào
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <AddAccountModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          fetchAll();
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
        title="Xác nhận xóa Staff"
        itemName={accountToDelete?.name || 'Chưa có tên'}
        itemType="Staff"
      />
    </div>
  );
}

