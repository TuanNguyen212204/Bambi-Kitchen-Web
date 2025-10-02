import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar/avatar";
import { User } from "lucide-react";
import logo from "@/assets/logo.png";

const HeaderAdmin = () => {
  return (
    <header className="w-full h-[82px] bg-white border-b border-orange-200 shadow-[0px_1px_3px_#0000001a] relative">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <img
            className="w-20 h-20 object-cover"
            alt="Orange and yellow kitchen food logo"
            src={logo}
          />

          <div className="flex flex-col">
            <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-xl tracking-[0] leading-[30px] whitespace-nowrap">
              Bambi's Kitchen
            </div>
            <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[0] leading-[21px] whitespace-nowrap">
              Trang quản lý nhân viên
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-800 text-sm text-right tracking-[0] leading-[21px] whitespace-nowrap">
            Xin chào, Admin
          </div>

          <Avatar className="w-8 h-8">
            <AvatarImage src="" alt="Admin" />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;


