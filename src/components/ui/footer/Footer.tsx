import React from "react";
import { Facebook, Instagram } from "lucide-react";
import logo from "@assets/logo.png";
import footerBg from "@assets/Footer/BackgroundGetOrPromoCodeFooterPic.png";

const Footer = () => {
  return (
    <footer className="bg-white py-8 px-6 mt-auto">
      <div className="max-w-[1163px] mx-auto mb-10">
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
              Get on Promo Code by
              <br /> Subscribing To our Newsletter
            </div>
            <div className="w-full max-w-2xl flex bg-white rounded-xl p-1">
              <input
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 outline-none rounded-xl"
              />
              <button className="px-6 py-3 bg-[#ea6d27] text-white rounded-xl">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1163px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:pl-4">
        <div className="space-y-4 md:ml-4">
          <img src={logo} alt="Bambi's Kitchen Logo" className="w-44 h-24 object-contain" />
          <p className="text-[#5c6574] text-[15px] leading-7">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore.{" "}
            <a href="#" className="underline">Learn more</a>
          </p>
          <div>
            <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Opening Hours</h3>
            <div className="text-[#5c6574] text-[15px] leading-7 flex flex-wrap md:flex-nowrap justify-between gap-6 md:gap-16">
              <div className="w-full md:w-[260px] space-y-1">
                <div className="whitespace-nowrap">Monday - Friday</div>
                <div className="whitespace-nowrap">8:00 am to 9:00 pm</div>
              </div>
              <div className="w-full md:w-[260px] space-y-1">
                <div className="whitespace-nowrap">Saturday</div>
                <div className="whitespace-nowrap">8:00 am to 9:00 pm</div>
              </div>
              <div className="w-full md:w-[260px] space-y-1">
                <div className="whitespace-nowrap">Sunday</div>
                <div className="uppercase whitespace-nowrap">Closed</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Navigation</h3>
          <div className="text-[#5c6574] text-[15px] leading-10">
            <div>Menu</div>
            <div>About us</div>
            <div>Contact us</div>
            <div>Main dishes</div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Dishes</h3>
          <div className="text-[#5c6574] text-[15px] leading-10">
            <div>Fish & Veggies</div>
            <div>Tofu Chili</div>
            <div>Egg & Cucumber</div>
            <div>Lumpia w/Suace</div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-[#101a24] text-xs leading-10 tracking-[0.5px] uppercase">Follow Us</h3>
          <div className="mt-2 flex gap-4">
            <div className="w-[39px] h-[39px] rounded-full border border-solid border-[#101a24] flex items-center justify-center">
              <Facebook className="w-4 h-4" />
            </div>
            <div className="w-[39px] h-[39px] rounded-full border border-solid border-[#101a24] flex items-center justify-center">
              <Instagram className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1163px] mx-auto mt-8 flex justify-between items-center border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-2.5">
          <img src={logo} alt="Bambi's Kitchen Logo" className="w-14 h-10 object-contain" />
          <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-[#5c6574] text-base tracking-[0] leading-[29px]">
            2025 Restaurants. All Right Reserved. Designed by{" "}
            <span className="[font-family:'Inter-Bold',Helvetica] font-bold">
              Ếch Giáo Sư
            </span>
          </p>
        </div>
        <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-[#5c6574] text-base tracking-[0] leading-[29px]">
          Terms of Service&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Privacy Policy
        </div>
      </div>
    </footer>
  );
};

export default Footer;