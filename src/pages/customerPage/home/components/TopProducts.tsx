import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { bambiApi, bambiPublicApi } from "@utils/api-client";
import { API_ENDPOINTS } from "@utils/endpoints";
import TunaImg from "@assets/Menu/tuna.png";
import PorkImg from "@assets/Menu/pork.png";
import BeefImg from "@assets/Menu/beef.png";
import ShrimpsImg from "@assets/Menu/shrimps.png";
import { PATHS } from "@config/path";
import { useAuthStore } from "@zustand/stores/auth";
import { normalizeImageUrl } from "@/utils/file";

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
  const location = useLocation();
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const detailPath = PATHS.DISH_DETAIL.replace(":id", String(product.id));

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

  const servings = product.usedQuantity ?? 0;

  return (
    <div className="bg-white rounded-full shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 p-6">
      <div className="flex flex-col items-center text-center">
        <Link
          to={detailPath}
          state={{ from: location.pathname }}
          className="relative mb-4 block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 rounded-full"
        >
          <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-100 relative">
            <img
              src={product.imageUrl || getFallbackImage(idx)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
              <span className="text-white font-semibold">Hết hàng</span>
            </div>
          )}
        </Link>
        
        <div className="px-4">
          <Link
            to={detailPath}
            state={{ from: location.pathname }}
            className="text-lg font-semibold text-gray-900 mb-2 block hover:text-orange-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 rounded"
          >
            <span className="bg-gradient-to-r from-orange-600 to-[#FC8A06] bg-clip-text text-transparent">
              {product.name}
            </span>
          </Link>
          
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center mr-2">
              {renderStars(product.rating)}
            </div>
            <span className="text-sm text-gray-500">({product.rating})</span>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <span className="text-xl font-bold text-[#FC8A06]">{formatPrice(product.price)}</span>
            <span className="text-xs text-gray-500">
              {servings > 0
                ? `Đã phục vụ ${servings.toLocaleString("vi-VN")} lần`
                : "Chưa có dữ liệu phục vụ"}
            </span>
            <Link
              to={detailPath}
              state={{ from: location.pathname }}
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
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        setHasError(false);
        const client = token ? bambiApi : bambiPublicApi;
        const { data } = await client.get<ApiDish[]>(API_ENDPOINTS.API_DISHES, {
          headers: { "x-silent-error": "1" },
        });
        const items = Array.isArray(data) ? data : [];

        const normalized = items
          .filter((dish) => dish?.public === true && (dish?.active ?? true))
          .map<Product>((dish, idx) => ({
            id: dish.id ?? idx,
            name: dish.name ?? "Món ăn",
            description: dish.description ?? "Món ăn healthy tại Bambi Kitchen.",
            price: dish.price ?? 0,
            imageUrl: normalizeImageUrl(dish.imageUrl || dish.imgUrl) || "",
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
  }, [token]);

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