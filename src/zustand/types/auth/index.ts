import type { RegisterPayload } from "@models/account/user"
export interface User {
  id: number
  name: string
  email?: string
  role: "USER" | "STAFF" | "ADMIN" 
  role_id?: 4 | 3 | 1 
  avatar?: string
  created_at?: string
  status?: "active" | "inactive"
  phone?: string
}

export interface UserMeResponse {
  id: number
  name: string
  mail?: string
  phone?: string
  role: "USER" | "STAFF" | "ADMIN"
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: "USER" | "STAFF" | "ADMIN"
  role_id?: 4 | 3 | 1
  avatar?: string
  status?: "active" | "inactive"
}

export interface AuthResponse {
  user: User
  token: string
  refresh_token: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

export interface ProfileSlice {
  user: User | null
  loading: boolean
  error: string | null
  
  setUser: (user: User | null) => void
  updateUser: (patch: Partial<User>) => void
  updateProfile: (profileData: Partial<User>) => Promise<void>
  clearError: () => void
}

export interface SessionSlice {
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  user?: User | null
  // Đã đồng bộ vai trò từ /me, an toàn để điều hướng
  userHydrated?: boolean
  
  setSession: (token: string | null, refreshToken?: string | null) => void
  clearSession: () => void
  login: (phone: string, password: string) => Promise<void>
  register: (userData: RegisterRequest | RegisterPayload) => Promise<void>
  logout: () => void
  verifyAuth: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  verifyOtp: (email: string, otp: string) => Promise<boolean>
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>
}

export interface UserSlice {
  loadUserData: () => Promise<User | null>
}

export type AuthStore = SessionSlice & ProfileSlice & UserSlice

export type AuthState = AuthStore
