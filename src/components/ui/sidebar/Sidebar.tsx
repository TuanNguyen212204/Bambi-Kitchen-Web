// import React from "react";
import { Button } from "@/components/ui/button";
import { Home, Utensils, History } from "lucide-react";


const Sidebar = () => {
  return (
    <aside className="fixed top-[64px] left-0 w-60 h-[calc(100vh-64px)] bg-white shadow-md z-40">
      <nav className="mt-4 space-y-1">
        <a href="/" className="flex items-center gap-3 px-4 py-2 text-[#101a24] hover:bg-[#f3f4f4] rounded-md">
          <Home size={18} /> Trang chủ
        </a>
        <a href="/order" className="flex items-center gap-3 px-4 py-2 text-[#101a24] hover:bg-[#f3f4f4] rounded-md">
          <Utensils size={18} /> Đặt món
        </a>
        <a href="/orders" className="flex items-center gap-3 px-4 py-2 text-[#101a24] hover:bg-[#f3f4f4] rounded-md">
          <History size={18} /> Lịch sử đơn
        </a>
      </nav>
      <div className="absolute bottom-4 w-full px-4">
        <Button variant="outline" className="w-full bg-[#ea6d27] text-white">
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;