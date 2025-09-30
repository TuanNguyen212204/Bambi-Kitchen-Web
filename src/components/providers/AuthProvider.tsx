import React, { useEffect } from "react"
import { useAuthStore } from "@zustand/stores/auth"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { verifyAuth, user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      verifyAuth()
    }
  }, [user, verifyAuth])

  return <>{children}</>
}


