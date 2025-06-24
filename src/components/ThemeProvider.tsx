import { useContext, useEffect } from "react"
import { ThemeProviderContext, type Theme, type ThemeProviderProps } from "./theme-context"
import { useLocalStorage } from "@/hooks/useLocalStorage"

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Clean up any corrupted localStorage entries on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedValue = window.localStorage.getItem(storageKey);
        if (storedValue && !['light', 'dark', 'system'].includes(storedValue)) {
          console.warn(`Invalid theme value "${storedValue}" found in localStorage, clearing it`);
          window.localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn('Error cleaning localStorage theme value:', error);
        // If localStorage is broken, try to clear it
        try {
          window.localStorage.removeItem(storageKey);
        } catch (clearError) {
          // Ignore if we can't clear it
        }
      }
    }
  }, [storageKey]);

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