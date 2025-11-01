import { Outlet } from "react-router-dom";
import HeaderAdmin from "@ui/admin/HeaderAdmin";
import SidebarAdmin from "@ui/admin/SidebarAdmin";

const AdminLayout = () => {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <HeaderAdmin />
      <div className="pt-[82px] relative">
        {/* Sidebar fixed */}
        <SidebarAdmin />
        {/* Main content scrollable - margin-left sẽ được điều chỉnh bằng JS nếu sidebar collapsed */}
        <main id="admin-main" className="transition-all pl-3 pr-3 pt-4 md:pt-6 min-h-[calc(100vh-82px)] overflow-y-auto" style={{ marginLeft: '256px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


