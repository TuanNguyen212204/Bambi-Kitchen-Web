import type { StateCreator } from "zustand"

export type BuilderStep = "RICE" | "PROTEIN" | "VEGETABLES" | "SOUP" | "DESSERT"

export type BuilderSlice = {
  currentStep: BuilderStep
  note: string
  setCurrentStep: (step: BuilderStep) => void
  setNote: (note: string) => void
}

export const createBuilderSlice: StateCreator<BuilderSlice, [], [], BuilderSlice> = (set) => ({
  currentStep: "RICE",
  note: "",
  setCurrentStep: (step) => set({ currentStep: step }),
  setNote: (note) => set({ note }),
})


