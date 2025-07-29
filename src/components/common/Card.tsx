import type { HTMLAttributes, ReactNode } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  noPadding?: boolean
  hoverable?: boolean
}

export function Card({
  title,
  description,
  children,
  footer,
  noPadding = false,
  hoverable = false,
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "bg-white rounded-lg shadow-sm border border-gray-200"
  const hoverStyles = hoverable ? "transition-shadow hover:shadow-md" : ""
  const paddingStyles = noPadding ? "" : "p-6"

  const classes = [baseStyles, hoverStyles, paddingStyles, className].filter(Boolean).join(" ")

  return (
    <div className={classes} {...props}>
      {(title || description) && (
        <div className={noPadding ? "px-6 pt-6" : ""}>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          {children && (title || description) && <div className="mt-4">{children}</div>}
        </div>
      )}

      {children && !title && !description && children}

      {footer && (
        <div
          className={`border-t border-gray-200 px-6 py-3 ${noPadding ? "" : "-mx-6 -mb-6 mt-6"}`}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

// Card sub-components for more flexible layouts
export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

export function CardFooter({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`px-6 py-3 border-t border-gray-200 ${className}`}>{children}</div>
}
