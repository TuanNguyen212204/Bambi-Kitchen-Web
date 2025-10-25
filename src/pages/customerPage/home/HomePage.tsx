
import React from "react";
import { Hero, Products, TopProducts, Testimonials } from "./components";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />
      
      {/* Top Products Section */}
      <TopProducts />
      
      {/* Products Section */}
      <Products />
      
      {/* Testimonials Section */}
      <Testimonials />
    </div>
  );
};

export default HomePage;