import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bambiPublicApi } from "@utils/api-client";
import { API_ENDPOINTS } from "@utils/endpoints";
import TunaImg from "@assets/Menu/tuna.png";
import PorkImg from "@assets/Menu/pork.png";
import BeefImg from "@assets/Menu/beef.png";
import ShrimpsImg from "@assets/Menu/shrimps.png";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  rating: number;
  isAvailable: boolean;
  usedQuantity: number;
}

interface ApiDish {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  imgUrl?: string;
  public?: boolean;
  active?: boolean;
  usedQuantity?: number;
  used?: number;
  dishType?: string;
}

const fallbackImages = [TunaImg, PorkImg, BeefImg, ShrimpsImg];
const getFallbackImage = (idx: number) => fallbackImages[idx % fallbackImages.length];

const TopProductCard: React.FC<{ product: Product; idx: number }> = ({ product, idx }) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const renderStars = (rating: number): JSX.Element[] => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }

    return stars;
  };

  return (
    <div className="bg-white rounded-full shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-100 relative">
            <img
              src={product.imageUrl || getFallbackImage(idx)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10 capitalize">
            {product.category || "Healthy"}
          </div>
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
              <span className="text-white font-semibold">Hết hàng</span>
            </div>
          )}
        </div>
        
        <div className="px-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-orange-600 to-[#FC8A06] bg-clip-text text-transparent">
              {product.name}
            </span>
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 font-medium">{product.description}</p>
          
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center mr-2">
              {renderStars(product.rating)}
            </div>
            <span className="text-sm text-gray-500">({product.rating})</span>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <span className="text-xl font-bold text-[#FC8A06]">{formatPrice(product.price)}</span>
            <span className="text-xs text-gray-500">Đã phục vụ {product.usedQuantity.toLocaleString("vi-VN")} lần</span>
            <Link
              to="/menu"
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                product.isAvailable
                  ? 'bg-[#FC8A06] hover:bg-[#FD9E2F] text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.isAvailable ? 'Đặt món ngay' : 'Hết hàng'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const TopProducts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const { data } = await bambiPublicApi.get<ApiDish[]>(API_ENDPOINTS.API_DISHES);
        const items = Array.isArray(data) ? data : [];

        const normalized = items
          .filter((dish) => dish?.public === true && (dish?.active ?? true))
          .map<Product>((dish, idx) => ({
            id: dish.id ?? idx,
            name: dish.name ?? "Món ăn",
            description: dish.description ?? "Món ăn healthy tại Bambi Kitchen.",
            price: dish.price ?? 0,
            imageUrl: dish.imageUrl || dish.imgUrl || "",
            category: dish.dishType || "healthy bowl",
            rating: 4.5,
            isAvailable: dish.active ?? true,
            usedQuantity: dish.usedQuantity ?? dish.used ?? 0
          }));

        const sorted = normalized.sort((a, b) => b.usedQuantity - a.usedQuantity).slice(0, 4);

        if (mounted) {
          setTopProducts(sorted);
          setHasError(false);
        }
      } catch (error) {
        if (mounted) {
          setTopProducts([]);
          setHasError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTopProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const products = useMemo(() => topProducts, [topProducts]);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🌟 Món ăn bán chạy
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Những món ăn được yêu thích nhất của khách hàng
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-10">Đang tải dữ liệu món bán chạy...</div>
        ) : hasError ? (
          <div className="text-center text-gray-500 py-10">
            Không thể tải dữ liệu món bán chạy. Vui lòng thử lại sau.
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Chưa có dữ liệu món bán chạy.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {products.map((product, idx) => (
              <TopProductCard key={product.id} product={product} idx={idx} />
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/menu"
            className="inline-flex items-center px-6 py-3 bg-[#FC8A06] hover:bg-[#FD9E2F] text-white font-semibold rounded-full transition-colors"
          >
            Xem tất cả món ăn
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TopProducts;