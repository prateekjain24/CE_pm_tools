import { useCallback, useEffect } from "react"
import { navigation } from "~/lib/navigation"

interface ShortcutDefinition {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

// Define all keyboard shortcuts
const shortcuts: ShortcutDefinition[] = [
  {
    key: "d",
    ctrl: true,
    shift: true,
    description: "Open Dashboard",
    action: () => navigation.openDashboard(),
  },
  {
    key: "r",
    ctrl: true,
    shift: true,
    description: "Quick RICE Calculator",
    action: () => navigation.openCalculator("rice-calculator"),
  },
  {
    key: "t",
    ctrl: true,
    shift: true,
    description: "Quick TAM Calculator",
    action: () => navigation.openCalculator("tam-calculator"),
  },
  {
    key: "s",
    ctrl: true,
    shift: true,
    description: "Open Settings",
    action: () => navigation.openSettings(),
  },
  {
    key: "k",
    ctrl: true,
    description: "Command Palette",
    action: () => {
      // TODO: Implement command palette
      console.log("Command palette not yet implemented")
    },
  },
  {
    key: "?",
    description: "Show Keyboard Shortcuts",
    action: () => {
      // Dispatch custom event to show shortcuts modal
      window.dispatchEvent(new CustomEvent("show-keyboard-shortcuts"))
    },
  },
]

export function useKeyboardShortcuts(enabled = true) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't handle shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey
        const altMatch = s.alt ? event.altKey : !event.altKey

        return keyMatch && ctrlMatch && shiftMatch && altMatch
      })

      if (shortcut) {
        event.preventDefault()
        shortcut.action()
      }
    },
    [enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress, enabled])

  return { shortcuts }
}

// Helper function to format shortcut for display
export function formatShortcut(shortcut: ShortcutDefinition): string {
  const parts: string[] = []

  // Use appropriate modifier key symbols based on platform
  const isMac =
    typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0

  if (shortcut.ctrl) {
    parts.push(isMac ? "⌘" : "Ctrl")
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift")
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt")
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? "" : "+")
}

// Export shortcuts for use in UI
export { shortcuts }
