import React, { useState, useEffect, useMemo } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { bambiApi } from "@utils/api";
import { API_ENDPOINTS } from "@utils/endpoints";

// Types
interface FeedbackDto {
  orderId: number;
  ranking: number;
  comment: string;
  accountName: string;
  accountId: number;
}

interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  location: string;
  orderDate: string;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
}

// Mock data fallback
const mockTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Nguyễn Minh Anh",
    avatar: "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=NM",
    rating: 5,
    comment: "Pizza Margherita ở đây thật tuyệt vời! Phô mai mozzarella tan chảy, cà chua tươi ngon và lớp vỏ giòn tan. Giao hàng cũng rất nhanh, chỉ 25 phút là có món ăn nóng hổi.",
    location: "Quận 1, TP.HCM",
    orderDate: "2 ngày trước"
  },
  {
    id: "2",
    name: "Trần Văn Hùng",
    avatar: "https://via.placeholder.com/100x100/10B981/FFFFFF?text=TV",
    rating: 5,
    comment: "Sushi set của Bambi Kitchen chất lượng không thua kém nhà hàng Nhật nào. Cá tươi, cơm dẻo, wasabi cay nồng. Đặc biệt là giá cả rất hợp lý so với chất lượng.",
    location: "Quận 3, TP.HCM",
    orderDate: "1 tuần trước"
  },
  {
    id: "3",
    name: "Lê Thị Mai",
    avatar: "https://via.placeholder.com/100x100/F59E0B/FFFFFF?text=LM",
    rating: 4,
    comment: "Burger Deluxe rất ngon, thịt bò mềm và thơm. Tuy nhiên giá hơi cao một chút nhưng chất lượng xứng đáng. Sẽ quay lại đặt tiếp!",
    location: "Quận 7, TP.HCM",
    orderDate: "3 ngày trước"
  },
  {
    id: "4",
    name: "Phạm Đức Minh",
    avatar: "https://via.placeholder.com/100x100/EF4444/FFFFFF?text=PH",
    rating: 5,
    comment: "Pasta Carbonara đúng chuẩn Ý! Sốt kem béo ngậy, thịt xông khói giòn tan. Nhân viên phục vụ cũng rất nhiệt tình và chu đáo.",
    location: "Quận 2, TP.HCM",
    orderDate: "5 ngày trước"
  },
  {
    id: "5",
    name: "Hoàng Thị Lan",
    avatar: "https://via.placeholder.com/100x100/8B5CF6/FFFFFF?text=HT",
    rating: 5,
    comment: "Đã thử nhiều món ở đây và đều rất ngon. Đặc biệt là sushi và pizza. Giao hàng đúng giờ, đóng gói cẩn thận. Highly recommend!",
    location: "Quận 10, TP.HCM",
    orderDate: "1 tuần trước"
  },
  {
    id: "6",
    name: "Vũ Minh Tuấn",
    avatar: "https://via.placeholder.com/100x100/06B6D4/FFFFFF?text=VT",
    rating: 4,
    comment: "Chất lượng món ăn tốt, giá cả hợp lý. Chỉ có điều đôi khi phải chờ lâu một chút vào giờ cao điểm. Nhưng nhìn chung rất hài lòng!",
    location: "Quận 5, TP.HCM",
    orderDate: "2 tuần trước"
  }
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  const renderStars = (rating: number): JSX.Element[] => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-4">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
          <p className="text-sm text-gray-500">{testimonial.location}</p>
        </div>
      </div>
      
      <div className="flex items-center mb-3">
        {renderStars(testimonial.rating)}
        <span className="ml-2 text-sm text-gray-500">({testimonial.orderDate})</span>
      </div>
      
      <div className="relative">
        <Quote className="absolute -top-2 -left-2 text-orange-200 text-2xl" />
        <p className="text-gray-700 italic pl-6">{testimonial.comment}</p>
      </div>
    </div>
  );
};

const Testimonials: React.FC<TestimonialsProps> = ({ testimonials: propTestimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState<FeedbackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 3;

  // Fetch feedbacks from API
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await bambiApi.get<FeedbackDto[]>(API_ENDPOINTS.API_ORDER_FEEDBACKS);
        const data = response.data || [];
        // Filter feedbacks with ranking > 3
        const filteredFeedbacks = data.filter((fb) => fb.ranking > 3);
        setFeedbacks(filteredFeedbacks);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // Convert FeedbackDto to Testimonial format
  const testimonials = useMemo(() => {
    if (propTestimonials) return propTestimonials;
    
    if (feedbacks.length === 0) return mockTestimonials;

    return feedbacks.map((fb, index) => ({
      id: `feedback-${fb.orderId}`,
      name: fb.accountName || "Khách hàng",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.accountName || "Khách hàng")}&background=random`,
      rating: fb.ranking,
      comment: fb.comment || "Không có nhận xét",
      location: "",
      orderDate: "Gần đây"
    }));
  }, [feedbacks, propTestimonials]);

  const nextTestimonials = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerPage >= testimonials.length ? 0 : prev + itemsPerPage
    );
  };

  const prevTestimonials = () => {
    setCurrentIndex((prev) => 
      prev - itemsPerPage < 0 ? Math.max(0, testimonials.length - itemsPerPage) : prev - itemsPerPage
    );
  };

  const currentTestimonials = testimonials.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            💬 Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hơn 10,000+ khách hàng đã tin tưởng và hài lòng với dịch vụ của Bambi Kitchen
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Đang tải đánh giá...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Buttons */}
            {testimonials.length > itemsPerPage && (
              <>
                <button
                  onClick={prevTestimonials}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <button
                  onClick={nextTestimonials}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        )}

        {/* Dots Indicator */}
        {testimonials.length > itemsPerPage && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: Math.ceil(testimonials.length / itemsPerPage) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * itemsPerPage)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === Math.floor(currentIndex / itemsPerPage)
                    ? 'bg-orange-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl font-bold text-orange-500 mb-2">10,000+</div>
            <div className="text-gray-600">Khách hàng hài lòng</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl font-bold text-orange-500 mb-2">4.8/5</div>
            <div className="text-gray-600">Đánh giá trung bình</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl font-bold text-orange-500 mb-2">25 phút</div>
            <div className="text-gray-600">Thời gian giao hàng</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
