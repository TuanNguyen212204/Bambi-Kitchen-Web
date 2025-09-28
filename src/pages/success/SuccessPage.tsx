import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@components/ui/card/card";
import { Button } from "@components/ui/button/index";
import { CheckCircle, Home } from "lucide-react";

interface SuccessPageProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export const SuccessPage = ({ 
  title = "Thành công!", 
  message = "Hành động đã được thực hiện thành công.",
  showHomeButton = true 
}: SuccessPageProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-orange-50">
      <Card className="max-w-md w-full mx-auto shadow-lg border-orange-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-orange-700">{title}</h1>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center leading-relaxed">
            {message}
          </p>
          
          {showHomeButton && (
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleGoHome}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg h-11 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Về trang chủ
              </Button>
              
              <Button
                variant="outline"
                asChild
                className="w-full border-orange-300 hover:bg-orange-50"
              >
                <a 
                  href="/" 
                  className="inline-flex items-center justify-center gap-2"
                >
                  Truy cập Homepage
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;
