import { useEffect, useState } from "react"
import { Modal } from "~/components/common/Modal"
import { formatShortcut, shortcuts } from "~/hooks/useKeyboardShortcuts"

interface KeyboardShortcutsProps {
  open?: boolean
  onClose?: () => void
}

export function KeyboardShortcuts({ open: controlledOpen, onClose }: KeyboardShortcutsProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setInternalOpen(false)
    }
  }

  useEffect(() => {
    const handleShowShortcuts = () => {
      if (controlledOpen === undefined) {
        setInternalOpen(true)
      }
    }

    window.addEventListener("show-keyboard-shortcuts", handleShowShortcuts)
    return () => window.removeEventListener("show-keyboard-shortcuts", handleShowShortcuts)
  }, [controlledOpen])

  return (
    <Modal open={isOpen} onClose={handleClose} title="Keyboard Shortcuts">
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Use these keyboard shortcuts to navigate quickly through the PM Dashboard.
        </div>

        <div className="space-y-4">
          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Navigation
            </h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => ["Open Dashboard", "Open Settings"].includes(s.description))
                .map((shortcut) => (
                  <div
                    key={shortcut.key + shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {formatShortcut(shortcut)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Calculator Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Calculators
            </h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.description.includes("Calculator"))
                .map((shortcut) => (
                  <div
                    key={shortcut.key + shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {formatShortcut(shortcut)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Other Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Other</h3>
            <div className="space-y-2">
              {shortcuts
                .filter(
                  (s) =>
                    !s.description.includes("Calculator") &&
                    !["Open Dashboard", "Open Settings"].includes(s.description)
                )
                .map((shortcut) => (
                  <div
                    key={shortcut.key + shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {formatShortcut(shortcut)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-500 border-t pt-4">
          Tip: You can also configure keyboard shortcuts in your browser's extension settings.
        </div>
      </div>
    </Modal>
  )
}
