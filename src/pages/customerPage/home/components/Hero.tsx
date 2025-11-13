import { Link } from "react-router-dom";
import Slider from "react-slick";
import { Layers, HeartPulse, Bot } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import BackgroundSpecialOffer from "@assets/HomePage/Background10.jpg";
import WelcomePagePic from "@assets/HomePage/WelcomePagePic.png";
import OurExpertsChefPic from "@assets/HomePage/OurExpectsChefPic.png";

const ImageList = [
  {
    id: 1,
    img: WelcomePagePic,
    title: "🍽️ Chào mừng đến với Bambi Kitchen",
    description: "Cá nhân hóa tô ăn healthy của bạn qua từng bước: cơm, protein, rau củ, canh và tráng miệng.",
    buttonText: "Khám phá quy trình",
    buttonLink: "/menu"
  },
  {
    id: 2,
    img: BackgroundSpecialOffer,
    title: "🎉 Ưu đãi dinh dưỡng",
    description: "Nhận tư vấn chế độ ăn và săn ưu đãi đặc biệt cho các combo healthy trong tháng này.",
    buttonText: "Xem Menu",
    buttonLink: "/menu"
  },
  {
    id: 3,
    img: OurExpertsChefPic,
    title: "🤖 AI đồng hành cùng bạn",
    description: "AI phân tích thành phần, tính calories và gợi ý thực đơn phù hợp cho lần đặt kế tiếp.",
    buttonText: "Tìm hiểu AI Bambi",
    buttonLink: "/about"
  },
];


const Hero = () => {
  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    cssEase: "ease-in-out",
    pauseOnHover: true,
    pauseOnFocus: true,
    dotsClass: "slick-dots custom-dots",
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Slider */}
      <div className="min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]">
        <Slider {...settings}>
          {ImageList.map((item) => (
            <div key={item.id} className="relative">
              <div className="relative w-full h-[500px] sm:h-[600px] lg:h-[700px]">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-2xl"
                />
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl"></div>
                
                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center text-white">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight drop-shadow-lg">
                        <span className="bg-gradient-to-r from-white via-orange-200 to-[#FC8A06] bg-clip-text text-transparent">
                          {item.title}
                        </span>
                      </h1>
                      <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 leading-relaxed font-semibold max-w-3xl mx-auto drop-shadow-md">
                        {item.description}
                      </p>
                      <div className="flex justify-center">
                        <Link
                          to={item.buttonLink}
                          className="inline-flex items-center justify-center bg-[#FC8A06] hover:bg-[#FD9E2F] text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl text-lg"
                        >
                          {item.buttonText}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Online Courses */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <Layers className="text-[#FC8A06] text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Cá nhân hóa từng bước</h3>
            </div>
            <p className="text-gray-700 mb-4 font-medium">
              Chọn cơm, protein, rau củ, canh và tráng miệng theo khẩu vị, hệ thống hướng dẫn từng bước rõ ràng.
            </p>
            <Link to="/menu" className="text-[#FC8A06] font-bold hover:text-[#FD9E2F] transition-colors">
              Tạo tô của bạn →
            </Link>
          </div>

          {/* Nutrition Tracking */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <HeartPulse className="text-[#FC8A06] text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Theo dõi dinh dưỡng</h3>
            </div>
            <p className="text-gray-700 mb-4 font-medium">
              Tính calories và cân bằng dưỡng chất tự động theo từng lựa chọn nguyên liệu.
            </p>
            <Link to="/about" className="text-[#FC8A06] font-bold hover:text-[#FD9E2F] transition-colors">
              Tìm hiểu thêm →
            </Link>
          </div>

          {/* AI Companion */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <Bot className="text-[#FC8A06] text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">AI đồng hành</h3>
            </div>
            <p className="text-gray-700 mb-4 font-medium">
              Nhận phân tích khẩu phần và gợi ý món ưu tiên dựa trên lịch sử đặt hàng.
            </p>
            <Link to="/about" className="text-[#FC8A06] font-bold hover:text-[#FD9E2F] transition-colors">
              Khám phá AI →
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Dots Styling */}
      <style>{`
        .custom-dots {
          bottom: 20px;
        }
        .custom-dots li button:before {
          font-size: 12px;
          color: white;
          opacity: 0.5;
        }
        .custom-dots li.slick-active button:before {
          opacity: 1;
          color: #FC8A06;
        }
      `}</style>
    </div>
  );
};

export default Hero;