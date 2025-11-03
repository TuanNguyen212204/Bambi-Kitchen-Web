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

interface OrdersResponse {
  id: number;
  createAt: string;
  status: "PENDING" | "COMPLETED" | "PAID" | "CANCELLED";
  userId: number;
  staffId?: number;
  totalPrice: number;
  ranking?: number;
  comment?: string;
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
  const [allFeedbacks, setAllFeedbacks] = useState<FeedbackDto[]>([]); // Tất cả feedback để tính stats
  const [orders, setOrders] = useState<OrdersResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 3;

  // Fetch feedbacks and orders from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch feedbacks
        const feedbackResponse = await bambiPublicApi.get<FeedbackDto[]>(API_ENDPOINTS.API_ORDER_FEEDBACKS);
        const feedbackData = feedbackResponse.data || [];
        
        // Lưu tất cả feedback để tính stats
        setAllFeedbacks(feedbackData);
        
        // Filter feedbacks with ranking > 3 để hiển thị
        const filteredFeedbacks = feedbackData.filter((fb) => (fb.ranking ?? 0) >= 3);
        setFeedbacks(filteredFeedbacks);

        // Fetch orders để tính thời gian giao hàng
        try {
          const ordersResponse = await bambiPublicApi.get<OrdersResponse[]>(API_ENDPOINTS.API_ORDERS);
          const ordersData = ordersResponse.data || [];
          // Chỉ lấy orders đã hoàn thành (COMPLETED hoặc PAID)
          const completedOrders = ordersData.filter(
            (order) => order.status === "COMPLETED" || order.status === "PAID"
          );
          setOrders(completedOrders);
        } catch (error) {
          // Nếu không fetch được orders, để mảng rỗng
          setOrders([]);
        }
      } catch (error) {
        // Silent error - chỉ set empty array, không hiển thị lỗi cho user
        setFeedbacks([]);
        setAllFeedbacks([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Convert FeedbackDto to Testimonial format
  const testimonials = useMemo(() => {
    // Nếu có propTestimonials được truyền vào, ưu tiên sử dụng
    if (propTestimonials) return propTestimonials;
    
    // Chỉ sử dụng feedback từ API, không dùng mockdata
    if (feedbacks.length === 0) return [];

    // Map feedback từ API sang format Testimonial
    return feedbacks.map((fb) => ({
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

  // Tính toán stats từ dữ liệu thực
  const stats = useMemo(() => {
    // 1. Số khách hàng hài lòng: Đếm số accountId unique có ranking > 3
    const satisfiedCustomers = new Set(
      allFeedbacks
        .filter((fb) => fb.ranking > 3)
        .map((fb) => fb.accountId)
    ).size;
    
    // Format: nếu > 1000 thì hiển thị "X,XXX+", nếu < 1000 thì hiển thị số thực
    const satisfiedCustomersDisplay = satisfiedCustomers >= 1000
      ? `${(satisfiedCustomers / 1000).toFixed(0)}K+`
      : satisfiedCustomers > 0
      ? `${satisfiedCustomers}+`
      : "0";

    // 2. Đánh giá trung bình: Tính trung bình của tất cả ranking
    const averageRating = allFeedbacks.length > 0
      ? allFeedbacks.reduce((sum, fb) => sum + fb.ranking, 0) / allFeedbacks.length
      : 0;
    const averageRatingDisplay = averageRating > 0 ? averageRating.toFixed(1) : "0.0";

    // 3. Thời gian giao hàng trung bình: Tính từ orders đã hoàn thành
    // Lưu ý: Vì API không có thời gian hoàn thành chính xác, 
    // chúng ta sử dụng giá trị ước tính mặc định
    let avgDeliveryTime = 25; // Default 25 phút nếu không có dữ liệu
    if (orders.length > 0) {
      // Với mỗi đơn hàng đã hoàn thành, ước tính thời gian giao hàng là 30 phút
      // (có thể cải thiện logic này khi backend cung cấp thời gian hoàn thành chính xác)
      const estimatedDeliveryTime = 30;
      avgDeliveryTime = estimatedDeliveryTime;
    }
    const deliveryTimeDisplay = `${avgDeliveryTime} phút`;

    return {
      satisfiedCustomers: satisfiedCustomersDisplay,
      averageRating: averageRatingDisplay,
      deliveryTime: deliveryTimeDisplay,
    };
  }, [allFeedbacks, orders]);

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
            <div className="text-3xl font-bold text-orange-500 mb-2">{stats.satisfiedCustomers}</div>
            <div className="text-gray-600">Khách hàng hài lòng</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl font-bold text-orange-500 mb-2">{stats.averageRating}/5</div>
            <div className="text-gray-600">Đánh giá trung bình</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl font-bold text-orange-500 mb-2">{stats.deliveryTime}</div>
            <div className="text-gray-600">Thời gian giao hàng</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
