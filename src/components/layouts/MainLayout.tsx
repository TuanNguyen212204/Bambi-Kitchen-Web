import { Outlet } from "react-router-dom";
import Header from "@components/ui/header/Header";
import Footer from "@components/ui/footer/Footer";
import ChatButton from "@components/customer/chat/ChatButton";

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mt-[82px] flex-1 w-full overflow-x-hidden">
        <div id="customer-main" className="max-w-[1800px] mx-auto px-0">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ChatButton />
    </div>
  );
};
export default MainLayout;