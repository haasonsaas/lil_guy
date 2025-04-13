import { Moon, Sun, BookOpen, Palette, Terminal, Sparkles } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 sepia:scale-0 solarized:scale-0 hacker:scale-0 solarized-dark:scale-0 ghibli:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 sepia:scale-0 solarized:scale-0 hacker:scale-0 solarized-dark:scale-100 ghibli:scale-0" />
          <BookOpen className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-0 transition-all sepia:scale-100 solarized:scale-0 hacker:scale-0 solarized-dark:scale-0 ghibli:scale-0" />
          <Palette className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-0 transition-all solarized:scale-100 hacker:scale-0 solarized-dark:scale-0 ghibli:scale-0" />
          <Terminal className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-0 transition-all hacker:scale-100 solarized-dark:scale-0 ghibli:scale-0" />
          <Sparkles className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-0 transition-all ghibli:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("sepia")}>
          Sepia
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("solarized")}>
          Solarized Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("solarized-dark")}>
          Solarized Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("hacker")}>
          Hacker
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("ghibli")}>
          Ghibli
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 