import { Link } from "react-router-dom";
import Slider from "react-slick";
import { BookOpen, User, Shield } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ImageList = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80",
    title: "🍽️ Chào mừng đến với Bambi Kitchen",
    description: "Khám phá những món ăn ngon nhất với nguyên liệu tươi ngon và chế biến cẩn thận",
    buttonText: "Xem Menu",
    buttonLink: "/menu"
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80",
    title: "🎉 Ưu đãi đặc biệt",
    description: "Giảm giá 20% cho tất cả món ăn trong tháng này. Đặt hàng ngay để không bỏ lỡ!",
    buttonText: "Xem Menu",
    buttonLink: "/menu"
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80",
    title: "🚚 Giao hàng miễn phí",
    description: "Miễn phí giao hàng cho đơn hàng từ 200.000đ. Đặt hàng ngay hôm nay!",
    buttonText: "Xem Menu",
    buttonLink: "/menu"
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
                <BookOpen className="text-[#FC8A06] text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Món ăn đa dạng</h3>
            </div>
            <p className="text-gray-700 mb-4 font-medium">Từ pizza Ý đến sushi Nhật, chúng tôi có tất cả những gì bạn cần</p>
            <Link to="/menu" className="text-[#FC8A06] font-bold hover:text-[#FD9E2F] transition-colors">
              Xem menu →
            </Link>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <Shield className="text-[#FC8A06] text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Chất lượng cao</h3>
            </div>
            <p className="text-gray-700 mb-4 font-medium">Nguyên liệu tươi ngon, chế biến cẩn thận</p>
            <Link to="/about" className="text-[#FC8A06] font-bold hover:text-[#FD9E2F] transition-colors">
              Tìm hiểu thêm →
            </Link>
          </div>

          {/* Expert Consultation */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <User className="text-[#FC8A06] text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Giao hàng nhanh</h3>
            </div>
            <p className="text-gray-700 mb-4 font-medium">Đặt hàng và nhận món ăn trong vòng 30 phút</p>
            <Link to="/contact" className="text-[#FC8A06] font-bold hover:text-[#FD9E2F] transition-colors">
              Liên hệ ngay →
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