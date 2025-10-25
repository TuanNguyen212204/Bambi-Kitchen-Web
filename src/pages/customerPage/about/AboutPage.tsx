import React from "react";
import heroImg from "@assets/HomePage/WelcomePagePic.png";
import bowl1 from "@assets/HomePage/dish-2 1.png";
import chefPic from "@assets/HomePage/OurExpectsChefPic.png";
import bannerImg from "@assets/HomePage/Mask group.png";

const AboutPage: React.FC = () => {
  return (
    <div className="pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-8">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#101a24] leading-tight">
            Chúng tôi cung cấp món ăn tốt nhất cho bạn
          </h1>
          <p className="mt-5 text-[#5c6574] text-lg leading-8 max-w-xl">
            Bambi's Kitchen là nhà hàng hiện đại, chú trọng dinh dưỡng và hương
            vị. Chúng tôi chọn nguyên liệu tươi mỗi ngày và chế biến bởi đội ngũ
            đầu bếp tận tâm để bạn luôn có trải nghiệm tuyệt vời.
          </p>
          <div className="mt-6 flex gap-4">
            <a href="/menu" className="px-6 py-3 rounded-xl bg-[#0C3E2D] text-white">
              Menu
            </a>
            <a href="#chef" className="px-6 py-3 rounded-xl bg-[#ea6d27] text-white">
              Đặt tiệc
            </a>
          </div>
        </div>
        <div className="relative order-1 md:order-2 flex justify-center">
          <img src={heroImg} alt="Restaurant" className="rounded-[32px] max-w-[520px] w-full" />
          <img src={bowl1} alt="Dish" className="absolute -bottom-10 -left-6 w-40 hidden md:block" />
        </div>
      </section>

      <section className="mt-24">
        <div
          className="rounded-3xl overflow-hidden h-40 md:h-56 w-full"
          style={{
            backgroundImage: `url(${bannerImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </section>

      <section id="chef" className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center">
          <img src={chefPic} alt="Chef" className="w-[320px] md:w-[380px]" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#101a24]">Đầu bếp của chúng tôi</h2>
          <p className="mt-5 text-[#5c6574] text-lg leading-8">
            Tinh tế trong từng chi tiết, đầu bếp của chúng tôi tạo nên các món ăn
            cân bằng giữa sức khỏe và hương vị. Mỗi khẩu phần đều được tính toán
            lượng calo, protein, chất xơ... để phù hợp nhu cầu dinh dưỡng hàng ngày.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
            <div className="p-4 rounded-2xl bg-[#F6FFF9] border border-[#D7F0E5]">
              <div className="text-sm text-[#5c6574]">Sạch & Fresh</div>
              <div className="text-2xl font-semibold text-[#0C3E2D]">100%</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF7F1] border border-[#FFE1CF]">
              <div className="text-sm text-[#5c6574]">Khách hài lòng</div>
              <div className="text-2xl font-semibold text-[#ea6d27]">4.9/5</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <h3 className="text-3xl font-semibold text-[#101a24] text-center">Giá trị cốt lõi</h3>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border p-6">
            <div className="text-xl font-semibold">Tươi – Ngon – Lành</div>
            <p className="mt-3 text-[#5c6574]">Chọn lọc nguyên liệu tươi mỗi ngày từ nhà cung cấp uy tín.</p>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-xl font-semibold">Minh bạch dinh dưỡng</div>
            <p className="mt-3 text-[#5c6574]">Theo dõi calories, macros rõ ràng cho từng món ăn.</p>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-xl font-semibold">Trải nghiệm tinh tế</div>
            <p className="mt-3 text-[#5c6574]">Thiết kế hiện đại, dịch vụ nhanh và thân thiện.</p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default AboutPage;

