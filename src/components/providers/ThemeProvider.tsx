import React, { useEffect, useMemo, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    const saved = window.localStorage.getItem(storageKey) as Theme | null
    return saved ?? defaultTheme
  })

  const resolved = useMemo(() => (theme === "system" ? getSystemTheme() : theme), [theme])

  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolved)
    try {
      window.localStorage.setItem(storageKey, theme)
    } catch {}
  }, [resolved, theme, storageKey])

  return <>{children}</>
}


