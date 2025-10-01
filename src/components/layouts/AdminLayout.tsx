import { Outlet } from "react-router-dom";
import HeaderAdmin from "@ui/admin/HeaderAdmin";
import SidebarAdmin from "@ui/admin/SidebarAdmin";

const AdminLayout = () => {
  return (
    <div className="min-h-screen w-full flex bg-background">
      <SidebarAdmin />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderAdmin />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


