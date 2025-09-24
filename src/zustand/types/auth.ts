// Auth-related types
export interface User {
  id: number
  name: string
  email: string
  role: "CUSTOMER" | "STAFF" | "ADMIN" 
  role_id: 4 | 3 | 1 
  avatar?: string
  created_at: string
  status: "active" | "inactive"
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  verifyAuth: () => Promise<void>
  clearError: () => void
  updateProfile: (profileData: Partial<User>) => Promise<void>
}

// API Request/Response types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: "CUSTOMER" | "STAFF" | "ADMIN"
  role_id?: 4 | 3 | 1
  avatar?: string
  status?: "active" | "inactive"
}

export interface AuthResponse {
  user: User
  token: string
  refresh_token: string
}
