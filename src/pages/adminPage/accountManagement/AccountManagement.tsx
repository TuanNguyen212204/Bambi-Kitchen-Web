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
import { Users, CheckCircle, Star, Calendar, Plus, Eye, Phone, Mail, Wallet, FileText } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAccountStore } from "@zustand/stores/account";
import { AddAccountModal } from "@components/admin/account/AddAccountModal";
import { AccountDetailModal } from "@components/admin/account/AccountDetailModal";
import { MoreVertical, Trash2 as TrashIcon } from "lucide-react";
import { bambiApi, API_ENDPOINTS } from "@utils/api";
// Dùng kiểu dữ liệu theo API v3 cho Orders
type OrderV3 = {
  id: number
  createAt?: string
  totalPrice?: number
  status: string
  userId: number
  staffId?: number
  note?: string
  ranking?: number
  comment?: string
}

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
    statusFilter,
    setStatusFilter,
    remove,
    update
  } = useAccountStore();

  const store = useAccountStore();
  
  const allAccounts = useMemo(() => store.items, [store.items]);
  const userAccounts = useMemo(() => allAccounts.filter(acc => acc.role === "USER"), [allAccounts]);
  
  const filteredUserAccounts = useMemo(() => {
    let filtered = userAccounts;
    
    if (query.trim()) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.name?.toLowerCase().includes(searchQuery) ||
        acc.mail?.toLowerCase().includes(searchQuery) ||
        acc.phone?.includes(searchQuery)
      );
    }
    
    if (statusFilter === "active") {
      filtered = filtered.filter(acc => acc.active !== false);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(acc => acc.active === false);
    }
    
    return filtered;
  }, [userAccounts, query, statusFilter]);
  
  const totalUserAccounts = useMemo(() => userAccounts.length, [userAccounts]);
  const activeUserAccounts = useMemo(() => userAccounts.filter(acc => acc.active !== false).length, [userAccounts]);
  const adminAccounts = useMemo(() => store.items.filter(acc => acc.role === "ADMIN").length, [store.items]);
  const staffAccounts = useMemo(() => store.items.filter(acc => acc.role === "STAFF").length, [store.items]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  
  // Orders state
  const [orders, setOrders] = useState<OrderV3[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderTab, setSelectedOrderTab] = useState<"unpaid" | "paid">("unpaid");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  type OrderDetailV3 = { id: number; dish?: { id: number; name?: string }; totalCalories?: number; notes?: string; size?: string }
  const [orderDetails, setOrderDetails] = useState<OrderDetailV3[]>([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [payments, setPayments] = useState<Array<{ orderId: number; amount?: number; paymentMethod?: string; status?: string; createdAt?: string; transactionId?: string }>>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  useEffect(() => {
    fetchAll();
    fetchStats();
  }, [fetchAll, fetchStats]);

  // Fetch orders when account is selected
  useEffect(() => {
    if (selectedAccount?.id) {
      fetchOrdersByAccountId(selectedAccount.id);
      fetchPaymentsByAccountId(selectedAccount.id);
    } else {
      setOrders([]);
      setPayments([]);
    }
  }, [selectedAccount]);

  const fetchOrdersByAccountId = async (accountId: number) => {
    setLoadingOrders(true);
    try {
      const response = await bambiApi.get<OrderV3[]>(API_ENDPOINTS.API_ORDERS_BY_USER(accountId));
      setOrders(response.data || []);
      setSelectedOrderId(null);
      setOrderDetails([]);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }; 

  const fetchOrderDetails = async (orderId: number) => {
    setLoadingOrderDetails(true);
    try {
      const response = await bambiApi.get<OrderDetailV3[]>(
        API_ENDPOINTS.API_ORDER_DETAILS_BY_ORDER(orderId)
      );
      setOrderDetails(response.data || []);
    } catch (error) {
      setOrderDetails([]);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const fetchPaymentsByAccountId = async (accountId: number) => {
    setLoadingPayments(true)
    try {
      const res = await bambiApi.get<Array<{ orderId: number; amount: number; paymentMethod: string; status: string; createdAt: string; transactionId?: string }>>(
        API_ENDPOINTS.API_PAYMENTS_BY_ACCOUNT(accountId)
      )
      setPayments(res.data || [])
    } catch {
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  const statsData = [
    {
      title: "Tổng khách hàng",
      value: totalUserAccounts.toString(),
      subtitle: `+${Math.floor(totalUserAccounts * 0.1)} khách hàng mới tháng này`,
      icon: Users,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Khách hàng hoạt động",
      value: activeUserAccounts.toString(),
      subtitle: `${totalUserAccounts > 0 ? Math.round((activeUserAccounts / totalUserAccounts) * 100) : 0}% tổng khách hàng`,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Quản trị viên",
      value: adminAccounts.toString(),
      subtitle: `${staffAccounts} nhân viên, ${userAccounts.length} người dùng`,
      icon: Star,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      subtitleColor: "text-gray-600",
    },
    {
      title: "Tỷ lệ hoạt động",
      value: `${totalUserAccounts > 0 ? Math.round((activeUserAccounts / totalUserAccounts) * 100) : 0}%`,
      subtitle: "Tăng 5% so với tháng trước",
      icon: Calendar,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-500",
      subtitleColor: "text-green-600",
    },
  ];

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

  const handleAccountSelect = (account: any) => {
    setSelectedAccount(account);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return "N/A";
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const statusStr = status as string;
    const statusMap: Record<string, string> = {
      PENDING: "Chờ xử lý",
      COMPLETED: "Hoàn thành",
      PAID: "Đã thanh toán",
      CANCELLED: "Đã hủy",
      pending: "Chờ xử lý",
      completed: "Hoàn thành",
      paid: "Đã thanh toán",
      cancelled: "Đã hủy",
      confirmed: "Đã xác nhận",
      preparing: "Đang chuẩn bị",
      ready: "Sẵn sàng",
      delivered: "Đã giao",
      refunded: "Đã hoàn tiền",
    };
    return statusMap[statusStr] || statusStr;
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    const statusStr = (status: string) => String(status).toLowerCase();
    
    if (selectedOrderTab === "unpaid") {
      filtered = filtered.filter(order => {
        const s = statusStr(order.status);
        return s !== "completed" && s !== "paid";
      });
    } else {
      filtered = filtered.filter(order => {
        const s = statusStr(order.status);
        return s === "completed" || s === "paid";
      });
    }
    
    // Filter by search query
    if (orderSearchQuery.trim()) {
      const term = orderSearchQuery.toLowerCase()
      filtered = filtered.filter(order => 
        order.id.toString().includes(term) ||
        String(order.status).toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [orders, selectedOrderTab, orderSearchQuery]);

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
            Quản lý khách hàng
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section>
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

      {/* Main Management Section with Two Columns */}
      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Quản lý khách hàng
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm tài khoản
              </label>
              <Input
                placeholder="Tên, email, số điện thoại..."
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm h-auto py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (query.trim()) {
                      searchByName(query.trim());
                    } else {
                      fetchAll();
                    }
                  }
                }}
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

        {/* Two Column Layout: Sidebar (Left) + Content (Right) */}
        <div className="flex">
          {/* Left Sidebar: User Accounts List */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col" style={{ height: "600px", maxHeight: "calc(100vh - 300px)" }}>
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-700" />
                <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm">
                  Danh sách khách hàng ({filteredUserAccounts.length})
                </h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 300px)" }}>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUserAccounts.map((account, index) => {
                    const isSelected = selectedAccount?.id === account.id;
                    const initials = getInitials(account.name || "");
                    const avatarColor = isSelected ? "bg-green-500" : "bg-blue-500";
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleAccountSelect(account)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? "border-green-400 bg-green-50" 
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-semibold text-xs">
                              {initials}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-xs leading-[18px] mb-1">
                              {account.name || 'Chưa có tên'}
                            </h3>
                            {account.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mb-0.5">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{account.phone}</span>
                              </div>
                            )}
                            {account.mail && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{account.mail}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="relative">
                              <button
                                className="w-6 h-6 rounded hover:bg-black/10 flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const menu = (e.currentTarget.nextSibling as HTMLElement);
                                  if (menu) menu.classList.toggle('hidden');
                                }}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              <div className="absolute right-0 mt-1 bg-white border rounded shadow hidden z-10 min-w-[120px]">
                                <button
                                  className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetail(account);
                                  }}
                                >
                                  <Eye className="w-4 h-4" /> Xem chi tiết
                                </button>
                                <button 
                                  className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteModal(account);
                                  }}
                                >
                                  <TrashIcon className="w-4 h-4 text-red-600" /> Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredUserAccounts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {query.trim() ? "Không tìm thấy khách hàng" : "Không có khách hàng nào"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Content: Orders */}
          <div className="flex-1 bg-white flex flex-col min-h-0" style={{ height: "600px", maxHeight: "calc(100vh - 300px)" }}>
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-gray-700" />
                <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm">
                  Lịch sử thanh toán
                </h3>
              </div>
              {/* Switch Toggle for Payment Status */}
              <div className="mb-3">
                <div className="relative inline-flex rounded-lg bg-gray-100 p-1 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setSelectedOrderTab("unpaid")}
                    className={`relative px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      selectedOrderTab === "unpaid"
                        ? "bg-white text-blue-700 shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Chưa thanh toán
                  </button>
                  <button
                    onClick={() => setSelectedOrderTab("paid")}
                    className={`relative px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      selectedOrderTab === "paid"
                        ? "bg-white text-blue-700 shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Đã thanh toán
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm kiếm thanh toán..."
                  className="flex-1 bg-white h-auto py-1.5 text-xs"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 p-4 min-h-0">
              {!selectedAccount ? (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Vui lòng chọn khách hàng để xem lịch sử thanh toán</p>
                </div>
              ) : loadingOrders ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Không có đơn hàng nào</p>
                </div>
              ) : (
                  <div className="flex gap-4 min-h-0 h-full">
                  {/* Left: Danh sách đơn hàng */}
                    <div className="w-1/2 flex flex-col min-h-0">
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {filteredOrders.map((order) => {
                      const isActive = selectedOrderId === order.id
                      return (
                    <div
                      key={order.id}
                          onClick={() => {
                            setSelectedOrderId(order.id)
                            fetchOrderDetails(order.id)
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isActive ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                              Mã: P-{order.userId}-B{order.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                            <span>Ngày: {formatDate(order.createAt || "")}</span>
                      </div>
                          {typeof order.totalPrice === 'number' && (
                        <div className="text-sm font-semibold text-gray-800 mb-2">
                              Tổng tiền: {formatCurrency(order.totalPrice)}
                        </div>
                      )}
                      <div className="flex gap-2 items-center">
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            (String(order.status).toLowerCase() === "completed" || String(order.status).toLowerCase() === "paid")
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                          </div>
                        </div>
                      )
                      })}
                      </div>
                  </div>

                    {/* Right: Chi tiết đơn hàng */}
                    <div className="w-1/2 flex flex-col min-h-0">
                    {!selectedOrderId ? (
                      <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">
                        <p className="text-sm">Chọn một đơn hàng để xem chi tiết</p>
                      </div>
                    ) : loadingOrderDetails ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3 pl-2">
                        {/* Thông tin chung đơn hàng */}
                        {(() => {
                          const current = orders.find(o => o.id === selectedOrderId)
                          if (!current) return null
                          const statusStr = String(current.status)
                          const note = current.note
                          const ranking = current.ranking
                          const comment = current.comment
                          const created = current.createAt
                          const total = current.totalPrice
                          return (
                            <div className="p-4 bg-white border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-800">Chi tiết đơn hàng #{current.id}</h4>
                                <Badge className={`text-xs px-2 py-1 ${
                                  (statusStr.toLowerCase() === "completed" || statusStr.toLowerCase() === "paid")
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}>{getOrderStatusLabel(statusStr)}</Badge>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">Ngày: {formatDate(created || "")}</div>
                              {typeof total === 'number' && (
                                <div className="text-sm font-medium text-gray-800 mb-2">Tổng tiền: {formatCurrency(total)}</div>
                              )}
                              {note && (
                                <div className="text-sm text-gray-700"><span className="font-medium">Ghi chú:</span> {note}</div>
                              )}
                              {(ranking || comment) && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <div className="font-medium">Feedback khách hàng</div>
                                  {ranking ? <div>Đánh giá: {ranking}/5</div> : null}
                                  {comment ? <div>Bình luận: {comment}</div> : null}
                      </div>
                        )}
                      </div>
                          )
                        })()}

                        {/* Danh sách chi tiết món */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Món trong đơn</h5>
                          {orderDetails.length === 0 ? (
                            <div className="text-xs text-gray-500">Không có chi tiết món</div>
                          ) : (
                            <div className="space-y-2">
                              {orderDetails.map((d: OrderDetailV3) => (
                                <div key={d.id} className="p-3 border border-gray-100 rounded-md">
                                  <div className="text-sm font-medium text-gray-800">{d.dish?.name || `Món #${d.dish?.id || ''}`}</div>
                                  <div className="text-xs text-gray-600">Size: {d.size || 'N/A'}</div>
                                  {d.notes && <div className="text-xs text-gray-700">Ghi chú: {d.notes}</div>}
                                  {typeof d.totalCalories === 'number' && (
                                    <div className="text-xs text-gray-600">Calories: {d.totalCalories}</div>
                                  )}
                    </div>
                  ))}
                            </div>
                          )}
                        </div>
                        {/* Thông tin thanh toán */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Thông tin thanh toán</h5>
                          {loadingPayments ? (
                            <div className="flex justify-center items-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                          ) : (
                            (() => {
                              const p = payments.find(x => x.orderId === selectedOrderId)
                              if (!p) return <div className="text-xs text-gray-500">Chưa có thông tin thanh toán</div>
                              return (
                                <div className="text-sm text-gray-700 space-y-1">
                                  <div><span className="font-medium">Phương thức:</span> {p.paymentMethod || 'N/A'}</div>
                                  <div><span className="font-medium">Trạng thái:</span> {p.status || 'N/A'}</div>
                                  <div><span className="font-medium">Số tiền:</span> {typeof p.amount === 'number' ? formatCurrency(p.amount) : 'N/A'}</div>
                                  {p.transactionId && <div><span className="font-medium">Mã giao dịch:</span> {p.transactionId}</div>}
                                  {p.createdAt && <div><span className="font-medium">Thời gian:</span> {new Date(p.createdAt).toLocaleString('vi-VN')}</div>}
                                </div>
                              )
                            })()
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
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