"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/*
 * Toasts are painted entirely from theme tokens (see globals.css). Each type is a soft tint
 * of its token over the popover surface, with a stronger border and a token-coloured icon,
 * so recolouring the theme recolours the toasts. `richColors` is on so sonner reads the
 * --success-*, --error-*, --warning-* and --info-* variables below.
 */
const tint = (token: string, amount: number) =>
  `color-mix(in oklch, var(${token}) ${amount}%, var(--popover))`
const edge = (token: string) => `color-mix(in oklch, var(${token}) 35%, var(--border))`

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      // The app has a single (light) theme; don't let sonner follow the OS setting.
      theme="light"
      richColors
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-primary" />,
        warning: <TriangleAlertIcon className="size-4 text-warning" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": tint("--success", 10),
          "--success-text": "var(--foreground)",
          "--success-border": edge("--success"),
          "--info-bg": tint("--primary", 8),
          "--info-text": "var(--foreground)",
          "--info-border": edge("--primary"),
          "--warning-bg": tint("--warning", 14),
          "--warning-text": "var(--foreground)",
          "--warning-border": edge("--warning"),
          "--error-bg": tint("--destructive", 8),
          "--error-text": "var(--foreground)",
          "--error-border": edge("--destructive"),
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-lg shadow-foreground/5 font-sans",
          title: "font-medium",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
