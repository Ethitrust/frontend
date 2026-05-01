"use client"

import * as React from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const

  if (!mounted) {
    return (
      <div className="flex h-8 w-[88px] items-center justify-center rounded-full border border-border bg-secondary/50">
        <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-secondary/50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            theme === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={`Switch to ${option.label} theme`}
        >
          <option.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}
