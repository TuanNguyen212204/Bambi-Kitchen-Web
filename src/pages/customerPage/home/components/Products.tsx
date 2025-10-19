import React from "react";
import { Link } from "react-router-dom";
// Import local images
import TunaImg from "@assets/Menu/tuna.png";
import PorkImg from "@assets/Menu/pork.png";
import BeefImg from "@assets/Menu/beef.png";
import ShrimpsImg from "@assets/Menu/shrimps.png";
import VibrantImg from "@assets/Menu/vibrant.png";

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  rating: number;
  isAvailable: boolean;
}

interface ProductProps {
  products?: Product[];
}

// Mock data
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Cá Ngừ Tươi",
    description: "Cá ngừ tươi ngon với cơm sushi và wasabi đặc biệt",
    price: 250000,
    imageUrl: TunaImg,
    category: "Sushi",
    rating: 4.8,
    isAvailable: true
  },
  {
    id: "2",
    name: "Thịt Heo Nướng",
    description: "Thịt heo nướng thơm ngon với sốt đặc biệt và rau củ tươi",
    price: 180000,
    imageUrl: PorkImg,
    category: "BBQ",
    rating: 4.9,
    isAvailable: true
  },
  {
    id: "3",
    name: "Bò Wagyu Premium",
    description: "Thịt bò Wagyu cao cấp với sốt truffle và rau củ hữu cơ",
    price: 320000,
    imageUrl: BeefImg,
    category: "Premium",
    rating: 4.9,
    isAvailable: true
  },
  {
    id: "4",
    name: "Tôm Hùm Tươi",
    description: "Tôm hùm tươi sống với sốt bơ tỏi và rau củ tươi",
    price: 280000,
    imageUrl: ShrimpsImg,
    category: "Seafood",
    rating: 4.7,
    isAvailable: true
  }
];

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative">
      <div className="relative mb-4">
        <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-2 right-2 bg-gray-800 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
          {formatPrice(product.price)}
        </div>
      </div>
      
      <div className="px-4">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{product.name}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
};

const Products: React.FC<ProductProps> = ({ products = mockProducts }) => {
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
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;