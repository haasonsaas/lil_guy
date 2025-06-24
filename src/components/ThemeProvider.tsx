import { useContext, useEffect } from "react"
import { ThemeProviderContext, type Theme, type ThemeProviderProps } from "./theme-context"
import { useLocalStorage } from "@/hooks/useLocalStorage"

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Use our custom hook for localStorage with cross-tab sync
  // Use string serialization since theme is already a string
  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme, {
    serialize: (value) => value,
    deserialize: (value) => value as Theme,
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}