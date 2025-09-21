export interface User {
  id: number 
  name: string 
  role: UserRole 
  create_at: string 
  update_at: string 
  status: UserStatus 
  pass: string 
  mail: string 
}

export type UserRole = 
  | "CUSTOMER"    
  | "STAFF"        
  | "ADMIN"       

export type UserStatus = 
  | "active"     
  | "inactive"   
  | "suspended"  

export interface UserProfile extends User {
  phone?: string
  address?: string
  avatar?: string
  preferences?: UserPreferences
  last_login?: string
  total_orders?: number
  average_rating?: number
}

export interface UserPreferences {
  dietary_restrictions: DietaryRestriction[]
  calorie_goal: CalorieGoal
  favorite_cuisine: CuisineType[]
  allergies: string[]
  meal_frequency: "3-meals" | "2-meals-snacks"
}

export type DietaryRestriction = 
  | "vegetarian" //Ăn chay 
  | "vegan" //Thuần chay
  | "low-carb" //Ít tinh bột
  | "diabetic"

export type CalorieGoal = 
  | "low"
  | "medium"
  | "high"

export type CuisineType = 
  | "vietnamese"
  | "asian"
  | "western"
  | "healthy"

export interface LoginPayload {
  mail: string
  pass: string
}

export interface RegisterPayload extends LoginPayload {
  name: string
  phone?: string
  accept_terms: boolean
}

export interface AuthResponse {
  user: UserProfile
  token: string
  refresh_token?: string
  expires_in: number
}

export interface UserFilter {
  role?: UserRole
  status?: UserStatus
  search?: string
  date_range?: {
    from: string
    to: string
  }
  order_by?: "created_at" | "total_orders" | "last_login"
  order_direction?: "asc" | "desc"
}