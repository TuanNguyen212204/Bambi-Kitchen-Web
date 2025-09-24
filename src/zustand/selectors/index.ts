import { shallow } from "zustand/shallow"
export { shallow }

export * from "@zustand/slices/auth"
export * from "@zustand/slices/kitchen"

export const selectAuthUser = (s: { user: any }) => s.user
export const selectIsAuthenticated = (s: { isAuthenticated: boolean }) => s.isAuthenticated
export const selectActiveOrders = (s: { activeOrders: any[] }) => s.activeOrders
export const selectCurrentStep = (s: { currentStep: string }) => s.currentStep

