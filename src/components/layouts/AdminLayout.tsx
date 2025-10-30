import { Outlet } from "react-router-dom";
import HeaderAdmin from "@ui/admin/HeaderAdmin";
import SidebarAdmin from "@ui/admin/SidebarAdmin";

const AdminLayout = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <HeaderAdmin />
      <div className="flex gap-3">
        <SidebarAdmin />
        <main id="admin-main" className="flex-1 pl-3 pr-3 h-[calc(100vh-82px)] overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


