import { bambiApi } from "./api-client";
import { API_ENDPOINTS } from "./endpoints";

export interface Account {
  id: number;
  name: string;
  mail: string;
  role: "ADMIN" | "STAFF" | "USER";
  phone?: string;
  active: boolean;
  createAt: string;
  updateAt: string;
}

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await bambiApi.get<Account[]>(API_ENDPOINTS.AUTH_CHECK_EMAIL, {
      skipAuth: true 
    });
    
    const accounts = response.data;
    const emailExists = accounts.some(account => 
      account.mail.toLowerCase() === email.toLowerCase()
    );
    
    return emailExists;
  } catch (error) {
    console.error("Error checking email existence:", error);
    throw new Error("Không thể kiểm tra email. Vui lòng thử lại sau.");
  }
};

export const getAccountByEmail = async (email: string): Promise<Account | null> => {
  try {
    const response = await bambiApi.get<Account[]>(API_ENDPOINTS.AUTH_CHECK_EMAIL, {
      skipAuth: true
    });
    
    const accounts = response.data;
    const account = accounts.find(acc => 
      acc.mail.toLowerCase() === email.toLowerCase()
    );
    
    return account || null;
  } catch (error) {
    console.error("Error getting account by email:", error);
    throw new Error("Không thể lấy thông tin account. Vui lòng thử lại sau.");
  }
};

export const sendConfirmationCode = async (email: string): Promise<boolean> => {
  try {
    await bambiApi.get(
      `${API_ENDPOINTS.AUTH_FORGOT_PASSWORD}?email=${encodeURIComponent(email)}`,
      { skipAuth: true }
    );
    return true;
  } catch (error) {
    console.error("Error sending confirmation code:", error);
    throw new Error("Không thể gửi mã xác nhận. Vui lòng thử lại sau.");
  }
};

export const verifyConfirmationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    await bambiApi.post(
      API_ENDPOINTS.AUTH_VERIFY_OTP,
      null,
      {
        params: { email, otp: code },
        skipAuth: true
      }
    );
    return true;
  } catch (error) {
    console.error("Error verifying confirmation code:", error);
    return false;
  }
};
