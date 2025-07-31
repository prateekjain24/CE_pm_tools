import { formatShortcut } from "~/hooks/useKeyboardShortcuts"

interface ShortcutHintProps {
  shortcut: {
    key: string
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
  }
  className?: string
  size?: "sm" | "md"
}

export function ShortcutHint({ shortcut, className = "", size = "sm" }: ShortcutHintProps) {
  const formatted = formatShortcut({
    ...shortcut,
    description: "", // Not needed for display
    action: () => {}, // Not needed for display
  })

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
  }

  return (
    <span
      className={`inline-flex items-center rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono ${sizeClasses[size]} ${className}`}
    >
      {formatted}
    </span>
  )
}
