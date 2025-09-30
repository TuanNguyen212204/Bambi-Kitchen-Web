import type { LoginPayload, RegisterPayload } from "@models/account";



export interface ValidationResult {
  isValid: boolean;
  error?: string;
}


export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;
  return emailRegex.test(email);
};


export const isValidPassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: "Vui lòng nhập mật khẩu" };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
  }
  
  return { isValid: true };
};

export const validateLoginPayload = (payload: Partial<LoginPayload>): ValidationResult => {
  if (!payload.mail?.trim()) {
    return { isValid: false, error: "Vui lòng nhập email" };
  }
  
  if (!isValidEmail(payload.mail)) {
    return { isValid: false, error: "Email không hợp lệ" };
  }
  
  const passwordValidation = isValidPassword(payload.pass || "");
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }
  
  return { isValid: true };
};


export const validateRegisterPayload = (payload: Partial<RegisterPayload>): ValidationResult => {
  if (!payload.name?.trim()) {
    return { isValid: false, error: "Vui lòng nhập tên" };
  }
  
  if (!payload.mail?.trim()) {
    return { isValid: false, error: "Vui lòng nhập email" };
  }
  
  if (!isValidEmail(payload.mail)) {
    return { isValid: false, error: "Email không hợp lệ" };
  }
  
  const passwordValidation = isValidPassword(payload.password || "");
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }
  
  return { isValid: true };
};

export const createLoginPayload = (email: string, password: string): LoginPayload => {
  return {
    mail: email.trim(),
    pass: password,
  };
};

export const createRegisterPayload = (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): RegisterPayload => {
  return {
    name: data.name.trim(),
    password: data.password,
    mail: data.email.trim(),
    phone: data.phone?.trim() || undefined,
  };
};
