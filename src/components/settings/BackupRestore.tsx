import { useState } from "react"
import { Button } from "~/components/common"
import { validateLayout } from "~/lib/storage/layoutValidator"
import { extractWidgets, prepareLayoutForStorage } from "~/lib/storage/migrations"
import type { WidgetConfig } from "~/types"

interface BackupRestoreProps {
  currentLayout: WidgetConfig[]
  onRestore: (layout: WidgetConfig[]) => void
}

export function BackupRestore({ currentLayout, onRestore }: BackupRestoreProps) {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * Export current layout to JSON file
   */
  const handleExport = () => {
    try {
      const versionedLayout = prepareLayoutForStorage(currentLayout)
      const dataStr = JSON.stringify(versionedLayout, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const fileName = `pm-dashboard-layout-${new Date().toISOString().split("T")[0]}.json`
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess("Layout exported successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`)
      setTimeout(() => setError(null), 5000)
    }
  }

  /**
   * Import layout from JSON file
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Extract widgets from imported data
      const widgets = extractWidgets(data)

      // Validate imported layout
      const validation = validateLayout(widgets)
      if (!validation.valid) {
        const errorMessages = validation.errors.map((e) => e.message).join(", ")
        throw new Error(`Invalid layout: ${errorMessages}`)
      }

      // Apply the validated layout
      onRestore(validation.sanitizedLayout || widgets)

      setSuccess("Layout imported successfully!")
      setTimeout(() => setSuccess(null), 3000)

      // Reset file input
      event.target.value = ""
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`)
      setTimeout(() => setError(null), 5000)
    } finally {
      setImporting(false)
    }
  }

  /**
   * Reset layout to factory defaults
   */
  const handleReset = () => {
    if (
      window.confirm("Are you sure you want to reset to the default layout? This cannot be undone.")
    ) {
      // The parent component should handle this by calling resetLayout from useDashboardLayout
      onRestore([])
      setSuccess("Layout reset to defaults!")
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Backup & Restore
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Export your dashboard layout to a file or import a previously saved layout.
        </p>
      </div>

      {/* Export Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Export Layout</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Save your current dashboard layout to a JSON file.
        </p>
        <Button onClick={handleExport} variant="secondary">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          Export Layout
        </Button>
      </div>

      {/* Import Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Import Layout</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Restore a previously exported dashboard layout.
        </p>
        <div>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
          <label htmlFor="import-file">
            <div className="inline-block">
              <Button
                variant="secondary"
                disabled={importing}
                onClick={(e) => e.preventDefault()} // Prevent button click, let label handle it
                className="cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {importing ? "Importing..." : "Import Layout"}
              </Button>
            </div>
          </label>
        </div>
      </div>

      {/* Reset Section */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Reset to Defaults</h4>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          This will remove all customizations and restore the original dashboard layout.
        </p>
        <Button onClick={handleReset} variant="danger">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Reset Layout
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 px-4 py-3 rounded">
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  )
}
