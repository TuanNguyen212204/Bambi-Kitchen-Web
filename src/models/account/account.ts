export interface Account {
  id?: number
  name: string
  role: "ADMIN" | "STAFF" | "USER"
  createAt?: string
  updateAt?: string
  password?: string
  mail: string
  phone?: string
  active?: boolean
}

export interface AccountCreateRequest {
  name: string
  mail: string
  role: "ADMIN" | "STAFF" | "USER"
  password: string
  phone?: string
}

export interface AccountUpdateRequest {
  id: number
  name: string
  mail: string
  role?: "ADMIN" | "STAFF" | "USER"
  active?: boolean
  phone?: string
}
