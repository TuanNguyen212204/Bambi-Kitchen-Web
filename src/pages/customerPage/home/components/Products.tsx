import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
// Import local images
import TunaImg from "@assets/Menu/tuna.png";
import PorkImg from "@assets/Menu/pork.png";
import BeefImg from "@assets/Menu/beef.png";
import ShrimpsImg from "@assets/Menu/shrimps.png";
import VibrantImg from "@assets/Menu/vibrant.png";
import { useDishStore } from "@/zustand/stores/dish";
import { useAuthStore } from "@zustand/stores/auth";
import type { DishListSlice } from "@/zustand/slices/dish/list.slice";
import { PATHS } from "@config/path";

type HomeDish = DishListSlice["items"][number]

const fallbackImages = [TunaImg, PorkImg, BeefImg, ShrimpsImg]

const getFallbackImage = (idx: number) => fallbackImages[idx % fallbackImages.length]

const ProductCard: React.FC<{ product: HomeDish; idx: number }> = ({ product, idx }) => {
  const location = useLocation();
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const detailPath = PATHS.DISH_DETAIL.replace(":id", String(product.id));

  return (
    <div className="bg-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative">
      <Link
        to={detailPath}
        state={{ from: location.pathname }}
        className="relative mb-4 block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 rounded-full"
      >
        <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl || getFallbackImage(idx)}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== getFallbackImage(idx)) {
                target.src = getFallbackImage(idx);
              }
            }}
          />
        </div>
        <div className="absolute top-2 right-2 bg-gray-800 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
          {formatPrice(product.price || 0)}
        </div>
      </Link>

      <div className="px-4">
        <Link
          to={detailPath}
          state={{ from: location.pathname }}
          className="text-xl font-bold text-gray-900 mb-3 block hover:text-orange-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 rounded"
        >
          {product.name}
        </Link>
      </div>
    </div>
  );
};

const Products: React.FC = () => {
  const { fetchAll, items, loading } = useDishStore()
  const token = useAuthStore((state) => state.token)
  const [showAll, setShowAll] = useState(false)
  const INITIAL_VISIBLE_PRODUCTS = 8

  useEffect(() => {
    fetchAll("menu")
  }, [fetchAll, token])

  const visible = useMemo(() => items.filter((d) => (d.public === true) && (d.active ?? true)), [items])
  const displayedProducts = useMemo(
    () => (showAll ? visible : visible.slice(0, INITIAL_VISIBLE_PRODUCTS)),
    [visible, showAll]
  )
  const hiddenCount = Math.max(visible.length - INITIAL_VISIBLE_PRODUCTS, 0)

  useEffect(() => {
    setShowAll(false)
  }, [visible.length])

  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-9xl">🌿</div>
        <div className="absolute top-20 right-20 text-9xl">🍃</div>
        <div className="absolute bottom-20 left-1/4 text-9xl">🌾</div>
        <div className="absolute bottom-10 right-1/4 text-9xl">🥬</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left side - Food Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-green-100 rounded-full blur-3xl opacity-30"></div>
            <div className="relative">
              <img
                src={VibrantImg}
                alt="Featured dish"
                className="w-full max-w-lg mx-auto rounded-full shadow-2xl"
              />
              {/* Decorative leaves */}
              <div className="absolute -top-10 -left-10 text-6xl animate-bounce">🌿</div>
              <div className="absolute -bottom-10 -right-10 text-6xl animate-bounce delay-150">🍃</div>
            </div>
          </div>

          {/* Right side - Text Content */}
          <div className="text-left">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Chào Mừng Đến Với Nhà Bếp Của Chúng Tôi
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Khám phá những món ăn ngon nhất được chế biến từ nguyên liệu tươi ngon, mang đến trải nghiệm ẩm thực đặc biệt cho bạn và gia đình.
            </p>
            <div className="flex gap-4">
              <Link
                to="/menu"
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Đặt món ngay nào!
              </Link>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            <div className="col-span-4 text-center text-gray-500">Đang tải món ăn...</div>
          ) : (
            displayedProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} idx={idx} />
            ))
          )}
        </div>

        {!loading && hiddenCount > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center px-6 py-3 border-2 border-orange-500 text-orange-500 font-semibold rounded-full hover:bg-orange-50 transition-colors"
            >
              {showAll ? "Thu gọn" : `Xem thêm (${hiddenCount} món)`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;