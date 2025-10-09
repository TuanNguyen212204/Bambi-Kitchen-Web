import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Star } from "lucide-react";
import { Button } from "@components/ui/button/index";
import { Input } from "@components/ui/input";
import { Card, CardContent } from "@components/ui/card/card";
import heroImg from "@assets/HomePage/WelcomePagePic.png";
import chefPic from "@assets/HomePage/OurExpectsChefPic.png";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitStatus("success");
    
    // Reset form after success
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setSubmitStatus("idle");
    }, 3000);
  };

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-8">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#101a24] leading-tight">
            Liên hệ với chúng tôi
          </h1>
          <p className="mt-5 text-[#5c6574] text-lg leading-8 max-w-xl">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với Bambi's Kitchen 
            để được tư vấn về menu, đặt tiệc hoặc chia sẻ phản hồi của bạn.
          </p>
          <div className="mt-6 flex gap-4">
            <a href="tel:+84901234567" className="px-6 py-3 rounded-xl bg-[#0C3E2D] text-white flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Gọi ngay
            </a>
            <a href="mailto:contact@bambikitchen.com" className="px-6 py-3 rounded-xl bg-[#ea6d27] text-white flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </a>
          </div>
        </div>
        <div className="relative order-1 md:order-2 flex justify-center">
          <img src={heroImg} alt="Contact us" className="rounded-[32px] max-w-[520px] w-full" />
          <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-lg hidden md:block">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-semibold text-[#101a24]">4.9/5</span>
              <span className="text-[#5c6574] text-sm">Khách hài lòng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="mt-24">
        <h2 className="text-3xl font-semibold text-[#101a24] text-center mb-12">Thông tin liên hệ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-[#F6FFF9] rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-[#0C3E2D]" />
              </div>
              <h3 className="text-xl font-semibold text-[#101a24] mb-2">Điện thoại</h3>
              <p className="text-[#5c6574] mb-2">Hotline: 090 123 4567</p>
              <p className="text-[#5c6574]">Hỗ trợ: 08:00 - 22:00</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-[#FFF7F1] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#ea6d27]" />
              </div>
              <h3 className="text-xl font-semibold text-[#101a24] mb-2">Email</h3>
              <p className="text-[#5c6574] mb-2">contact@bambikitchen.com</p>
              <p className="text-[#5c6574]">Phản hồi trong 24h</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-[#F6FFF9] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-[#0C3E2D]" />
              </div>
              <h3 className="text-xl font-semibold text-[#101a24] mb-2">Địa chỉ</h3>
              <p className="text-[#5c6574] mb-2">123 Đường ABC, Quận 1</p>
              <p className="text-[#5c6574]">TP. Hồ Chí Minh</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-[#101a24] text-center mb-12">Gửi tin nhắn cho chúng tôi</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <Card className="p-8">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#101a24] mb-2">
                        Họ và tên *
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="border-[#dbdbdb] rounded-lg focus:border-[#0C3E2D] focus:ring-[#0C3E2D]"
                        placeholder="Nhập họ tên của bạn"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#101a24] mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="border-[#dbdbdb] rounded-lg focus:border-[#0C3E2D] focus:ring-[#0C3E2D]"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#101a24] mb-2">
                        Số điện thoại
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="border-[#dbdbdb] rounded-lg focus:border-[#0C3E2D] focus:ring-[#0C3E2D]"
                        placeholder="090 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#101a24] mb-2">
                        Chủ đề *
                      </label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="border-[#dbdbdb] rounded-lg focus:border-[#0C3E2D] focus:ring-[#0C3E2D]"
                        placeholder="Chủ đề tin nhắn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#101a24] mb-2">
                      Nội dung tin nhắn *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full border border-[#dbdbdb] rounded-lg px-3 py-2 focus:border-[#0C3E2D] focus:ring-[#0C3E2D] focus:outline-none resize-none"
                      placeholder="Viết tin nhắn của bạn..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#0C3E2D] to-[#0C3E2D] hover:from-[#0a2f22] hover:to-[#0a2f22] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Gửi tin nhắn
                      </>
                    )}
                  </Button>

                  {submitStatus === "success" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 text-center">
                        ✅ Cảm ơn bạn! Tin nhắn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="space-y-8">
              <Card className="p-6 bg-[#F6FFF9] border-[#D7F0E5]">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-[#0C3E2D] mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-[#101a24] mb-2">Giờ mở cửa</h3>
                      <div className="space-y-1 text-[#5c6574]">
                        <p><strong>Thứ 2 - Thứ 6:</strong> 08:00 - 22:00</p>
                        <p><strong>Thứ 7 - Chủ nhật:</strong> 09:00 - 23:00</p>
                        <p><strong>Ngày lễ:</strong> 10:00 - 21:00</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 bg-[#FFF7F1] border-[#FFE1CF]">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="w-6 h-6 text-[#ea6d27] mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-[#101a24] mb-2">Hỗ trợ khách hàng</h3>
                      <div className="space-y-2 text-[#5c6574]">
                        <p>• Tư vấn menu và đặt tiệc</p>
                        <p>• Hỗ trợ đặt hàng online</p>
                        <p>• Xử lý khiếu nại và phản hồi</p>
                        <p>• Tư vấn dinh dưỡng</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <img src={chefPic} alt="Chef" className="w-48 mx-auto rounded-2xl" />
                <p className="text-[#5c6574] mt-4 text-sm">
                  Đội ngũ đầu bếp chuyên nghiệp luôn sẵn sàng tư vấn và phục vụ bạn
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mt-24">
        <h2 className="text-3xl font-semibold text-[#101a24] text-center mb-12">Câu hỏi thường gặp</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#101a24] mb-3">Tôi có thể đặt tiệc tại nhà hàng không?</h3>
              <p className="text-[#5c6574]">
                Có, chúng tôi cung cấp dịch vụ đặt tiệc cho các sự kiện đặc biệt. 
                Vui lòng liên hệ trước ít nhất 3 ngày để chúng tôi chuẩn bị tốt nhất.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#101a24] mb-3">Nhà hàng có phục vụ món chay không?</h3>
              <p className="text-[#5c6574]">
                Có, chúng tôi có menu chay phong phú với các món ăn dinh dưỡng và ngon miệng, 
                phù hợp cho mọi chế độ ăn.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#101a24] mb-3">Tôi có thể hủy đơn hàng không?</h3>
              <p className="text-[#5c6574]">
                Bạn có thể hủy đơn hàng miễn phí trong vòng 30 phút sau khi đặt. 
                Sau thời gian này, phí hủy có thể áp dụng.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#101a24] mb-3">Nhà hàng có giao hàng không?</h3>
              <p className="text-[#5c6574]">
                Hiện tại chúng tôi chỉ phục vụ tại nhà hàng và đặt tiệc tận nơi. 
                Dịch vụ giao hàng sẽ được triển khai trong thời gian tới.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
