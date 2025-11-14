// import React from "react";
import footerBg from "@assets/Footer/BackgroundGetOrPromoCodeFooterPic.png";
import logo from "@assets/logo.png";
import { Facebook, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-white py-8 mt-auto">
      {/* Newsletter Section - Full Width */}
      <div className="w-full mb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden h-72 md:h-80 flex items-center justify-center"
            style={{
              backgroundImage: `url(${footerBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative z-10 w-full px-8 flex flex-col items-center gap-4">
              <div className="text-white text-2xl md:text-3xl font-semibold text-center">
                Nhận mã giảm giá đặc biệt
                <br /> Đăng ký nhận thông tin khuyến mãi
              </div>
              <div className="w-full max-w-2xl flex bg-white rounded-xl p-1">
                <input
                  placeholder="Nhập email của bạn"
                  className="flex-1 px-4 py-3 outline-none rounded-xl"
                />
                <button className="px-6 py-3 bg-[#ea6d27] text-white rounded-xl hover:bg-[#d85e1f] transition-colors">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content - Full Width */}
      <div className="w-full px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* About & Hours */}
          <div className="space-y-4">
            <img src={logo} alt="Bambi's Kitchen Logo" className="w-44 h-24 object-contain" />
            <p className="text-[#5c6574] text-[15px] leading-7">
              Bambi's Kitchen - Nền tảng đặt món ăn thông minh. 
              Tự do tùy chỉnh món ăn theo sở thích của bạn với hệ thống nguyên liệu đa dạng.{" "}
              <a href="#" className="underline text-[#ea6d27] hover:text-[#d85e1f]">Tìm hiểu thêm</a>
            </p>
            <div>
              <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Giờ phục vụ</h3>
              <div className="text-[#5c6574] text-[15px] leading-7 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Thứ 2 - Thứ 6</span>
                  <span>7:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Thứ 7 - Chủ nhật</span>
                  <span>7:00 - 23:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ngày lễ</span>
                  <span>8:00 - 22:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Liên kết nhanh</h3>
            <div className="text-[#5c6574] text-[15px] leading-10 space-y-1">
              <a href="/menu" className="block hover:text-[#ea6d27] transition-colors">Thực đơn</a>
              <a href="/order" className="block hover:text-[#ea6d27] transition-colors">Đặt món</a>
              <a href="/customize" className="block hover:text-[#ea6d27] transition-colors">Tùy chỉnh món ăn</a>
              <a href="/about" className="block hover:text-[#ea6d27] transition-colors">Về chúng tôi</a>
              <a href="/contact" className="block hover:text-[#ea6d27] transition-colors">Liên hệ</a>
            </div>
          </div>

          {/* Popular Dishes */}
          <div>
            <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Món ăn phổ biến</h3>
            <div className="text-[#5c6574] text-[15px] leading-10 space-y-1">
              <a href="#" className="block hover:text-[#ea6d27] transition-colors">Cơm gà xé phay</a>
              <a href="#" className="block hover:text-[#ea6d27] transition-colors">Cơm cá hồi áp chảo</a>
              <a href="#" className="block hover:text-[#ea6d27] transition-colors">Bún bò Huế</a>
              <a href="#" className="block hover:text-[#ea6d27] transition-colors">Phở bò đặc biệt</a>
              <a href="#" className="block hover:text-[#ea6d27] transition-colors">Món tùy chỉnh</a>
            </div>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Theo dõi chúng tôi</h3>
            <div className="mt-2 flex gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-[39px] h-[39px] rounded-full border border-solid border-[#101a24] flex items-center justify-center hover:bg-[#ea6d27] hover:border-[#ea6d27] hover:text-white transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-[39px] h-[39px] rounded-full border border-solid border-[#101a24] flex items-center justify-center hover:bg-[#ea6d27] hover:border-[#ea6d27] hover:text-white transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-4 space-y-2 text-[#5c6574] text-[15px]">
              <div className="flex items-center gap-2">
                <span className="font-medium">Hotline:</span>
                <a href="tel:1900xxx" className="hover:text-[#ea6d27]">1900 xxxx</a>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <a href="mailto:info@bambiskitchen.com" className="hover:text-[#ea6d27]">info@bambiskitchen.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Full Width */}
      <div className="w-full px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2.5">
            <img src={logo} alt="Bambi's Kitchen Logo" className="w-14 h-10 object-contain" />
            <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-[#5c6574] text-sm md:text-base tracking-[0] leading-[29px]">
              © 2025 Bambi's Kitchen. Bản quyền thuộc về{" "}
              <span className="[font-family:'Inter-Bold',Helvetica] font-bold">
                Ếch Giáo Sư
              </span>
            </p>
          </div>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-[#5c6574] text-sm md:text-base tracking-[0] leading-[29px] flex gap-6">
            <a href="/terms" className="hover:text-[#ea6d27] transition-colors">Điều khoản dịch vụ</a>
            <a href="/privacy" className="hover:text-[#ea6d27] transition-colors">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;