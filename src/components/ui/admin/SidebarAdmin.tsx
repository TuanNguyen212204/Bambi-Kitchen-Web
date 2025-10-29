import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Carrot,
  Box,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Bell,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { PATHS } from "@/config/path";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> }
type Group = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; items: Item[] }

const groups: Group[] = [
  {
    key: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    items: [
      { to: PATHS.ADMIN, label: "Dashboard", icon: LayoutDashboard },
      { to: PATHS.ADMIN_ORDERS, label: "Đơn hàng", icon: Package },
    ],
  },
  {
    key: "dish",
    label: "Món ăn",
    icon: UtensilsCrossed,
    items: [
      { to: PATHS.ADMIN_MENU, label: "Món ăn", icon: UtensilsCrossed },
      { to: PATHS.ADMIN_DISH_CATEGORIES, label: "Danh mục món", icon: Box },
      { to: PATHS.ADMIN_DISH_TEMPLATES, label: "Mẫu tô", icon: Box },
    ],
  },
  {
    key: "ingredient",
    label: "Nguyên liệu",
    icon: Carrot,
    items: [
      { to: PATHS.ADMIN_INGREDIENT_CATEGORIES, label: "Danh mục nguyên liệu", icon: Box },
      { to: PATHS.ADMIN_INGREDIENTS, label: "Nguyên liệu", icon: Carrot },
      { to: PATHS.ADMIN_SOLD_INGREDIENTS, label: "Nguyên liệu đã bán", icon: Box },
    ],
  },
  {
    key: "user",
    label: "Người dùng",
    icon: Users,
    items: [
      { to: PATHS.ADMIN_ACCOUNTS, label: "Quản lý Tài khoản", icon: Users },
    ],
  },
  {
    key: "communication",
    label: "Giao tiếp",
    icon: Bell,
    items: [
      { to: PATHS.ADMIN_NOTIFICATIONS, label: "Thông báo", icon: Bell },
      { to: PATHS.ADMIN_FEEDBACK, label: "Feedback", icon: MessageSquare },
    ],
  },
];

const SidebarAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const initiallyOpen = useMemo(() => {
    const path = location.pathname;
    const result: Record<string, boolean> = {};
    groups.forEach((g) => {
      result[g.key] = g.items.some((it) => path.startsWith(it.to));
    });
    return result;
  }, [location.pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initiallyOpen);

  const toggleGroup = (key: string) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className={[collapsed ? "w-16" : "w-64", "relative z-40 border-r bg-white min-h-[calc(100vh-82px)] p-3 transition-all overflow-visible"].join(" ")}> 
      <div className={["flex items-center", collapsed ? "justify-center" : "justify-between", "h-10"].join(" ")}> 
        {!collapsed && (
          <div className="text-sm font-medium text-gray-700">Menu</div>
        )}
        <button
          className="p-2 rounded hover:bg-orange-50 text-gray-700"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
          title={collapsed ? "Mở rộng" : "Thu nhỏ"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-col gap-2 pt-4">
        {groups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups[group.key];
          return (
            <div key={group.key}>
              <button
                className={[
                  "w-full flex items-center",
                  collapsed ? "justify-center" : "justify-between",
                  "px-3 py-2 rounded-md hover:bg-orange-50 text-gray-800",
                ].join(" ")}
                onClick={() => (collapsed ? setCollapsed(false) : toggleGroup(group.key))}
                aria-expanded={isOpen}
              >
                <div className={["flex items-center", collapsed ? "" : "gap-3"].join(" ")}>
                  <GroupIcon className="h-5 w-5" />
                  {!collapsed && <span className="text-sm font-medium">{group.label}</span>}
                </div>
                {!collapsed && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
              </button>

              {!collapsed && isOpen && (
                <div className="mt-1 ml-2 border-l pl-2 space-y-1">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end
                      className={({ isActive }) =>
                        [
                          "group flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-orange-50 transition-colors",
                          isActive ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-700",
                        ].join(" ")
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default SidebarAdmin;


