import type { ReactNode } from "react"

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info"
type BadgeSize = "sm" | "md" | "lg"

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  rounded?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-800",
  primary: "bg-primary-100 text-primary-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  rounded = false,
  className = "",
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium"
  const roundedStyles = rounded ? "rounded-full" : "rounded"

  const classes = [baseStyles, variantStyles[variant], sizeStyles[size], roundedStyles, className]
    .filter(Boolean)
    .join(" ")

  return <span className={classes}>{children}</span>
}

// Dot Badge for indicators
interface DotBadgeProps {
  color?: "gray" | "red" | "yellow" | "green" | "blue" | "primary"
  size?: "sm" | "md" | "lg"
  pulse?: boolean
  className?: string
}

const dotColorStyles: Record<NonNullable<DotBadgeProps["color"]>, string> = {
  gray: "bg-gray-400",
  red: "bg-red-400",
  yellow: "bg-yellow-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  primary: "bg-primary-400",
}

const dotSizeStyles: Record<NonNullable<DotBadgeProps["size"]>, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
}

export function DotBadge({
  color = "gray",
  size = "md",
  pulse = false,
  className = "",
}: DotBadgeProps) {
  const baseStyles = "inline-flex rounded-full"
  const pulseStyles = pulse ? "animate-pulse" : ""

  const classes = [baseStyles, dotColorStyles[color], dotSizeStyles[size], pulseStyles, className]
    .filter(Boolean)
    .join(" ")

  return (
    <span className="relative inline-flex">
      <span className={classes} />
      {pulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${dotColorStyles[color]} opacity-75 animate-ping`}
        />
      )}
    </span>
  )
}
