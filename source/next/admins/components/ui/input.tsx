// components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, variant = "default", ...props }: React.ComponentProps<"input"> & { variant?: "default" | "underline" }) {
  const baseClasses = "file:text-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 bg-transparent text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
  
  const variantClasses = {
    default: cn(
      "h-12 border-2 px-5 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg",
      "placeholder:text-muted-foreground",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
    ),
    underline: cn(
      "h-12 border-0 border-b-[3px] border-[#1a1a1a] rounded-none px-0 pb-2",
      "placeholder:text-[#9CA3AF] text-[#9CA3AF] font-normal",
      "focus:border-[#1a1a1a] focus:text-[#1a1a1a]",
      "focus-visible:ring-0 focus-visible:outline-none"
    )
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Input }