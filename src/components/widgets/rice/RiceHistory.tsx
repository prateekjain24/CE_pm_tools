import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { Button } from "~/components/common/Button"
import { Input } from "~/components/common/Input"
import { Modal } from "~/components/common/Modal"
import { getRiceScoreCategory } from "~/lib/calculators/rice"
import { exportRiceToCSV, exportRiceToJSON, exportRiceToPDF } from "~/lib/export/riceExport"
import type { RiceScore } from "~/types"

interface RiceHistoryProps {
  calculations: RiceScore[]
  onClose: () => void
  onCompare?: (calculations: RiceScore[]) => void
  onLoad?: (calculation: RiceScore) => void
  onDelete?: (id: string) => void
}

export function RiceHistory({
  calculations,
  onClose,
  onCompare,
  onLoad,
  onDelete,
}: RiceHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"date" | "score" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Filter and sort calculations
  const filteredCalculations = useMemo(() => {
    const filtered = calculations.filter(
      (calc) =>
        calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.score.toString().includes(searchQuery)
    )

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
          break
        case "score":
          comparison = a.score - b.score
          break
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
      }
      return sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }, [calculations, searchQuery, sortBy, sortOrder])

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedItems(newSelection)
  }

  const selectAll = () => {
    if (selectedItems.size === filteredCalculations.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredCalculations.map((c) => c.id)))
    }
  }

  const exportSelected = (format: "csv" | "json") => {
    const itemsToExport =
      selectedItems.size > 0
        ? calculations.filter((c) => selectedItems.has(c.id))
        : filteredCalculations

    if (format === "csv") {
      exportRiceToCSV(itemsToExport)
    } else {
      exportRiceToJSON(itemsToExport)
    }
  }

  const deleteSelected = () => {
    if (!onDelete) return
    if (!confirm(`Delete ${selectedItems.size} calculation(s)?`)) return

    selectedItems.forEach((id) => onDelete(id))
    setSelectedItems(new Set())
  }

  return (
    <Modal open={true} onClose={onClose} title="RICE Calculation History" size="xl">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search calculations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Search</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />

          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-")
                setSortBy(field as typeof sortBy)
                setSortOrder(order as typeof sortOrder)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Action Bar */}
        {selectedItems.size > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-primary-700 dark:text-primary-300">
              {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              {onCompare && selectedItems.size >= 2 && selectedItems.size <= 3 && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const itemsToCompare = calculations.filter((c) => selectedItems.has(c.id))
                    onCompare(itemsToCompare)
                  }}
                >
                  Compare
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => exportSelected("csv")}>
                Export CSV
              </Button>
              {onDelete && (
                <Button size="sm" variant="danger" onClick={deleteSelected}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Calculations List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCalculations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? "No calculations match your search" : "No calculations saved yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pb-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.size === filteredCalculations.length &&
                      filteredCalculations.length > 0
                    }
                    onChange={selectAll}
                    className="mr-2 rounded border-gray-300 dark:border-gray-600"
                  />
                  Select All
                </label>
              </div>

              <AnimatePresence>
                {filteredCalculations.map((calc, index) => {
                  const category = getRiceScoreCategory(calc.score)
                  const isSelected = selectedItems.has(calc.id)

                  return (
                    <motion.div
                      key={calc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(calc.id)}
                          className="mt-1 rounded border-gray-300 dark:border-gray-600"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {calc.name}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span>{new Date(calc.savedAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>R: {calc.reach.toLocaleString()}</span>
                                <span>•</span>
                                <span>I: {calc.impact}×</span>
                                <span>•</span>
                                <span>C: {Math.round(calc.confidence * 100)}%</span>
                                <span>•</span>
                                <span>E: {calc.effort}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div
                                  className="text-2xl font-bold"
                                  style={{
                                    color:
                                      categoryColors[category.color as keyof typeof categoryColors],
                                  }}
                                >
                                  {calc.score}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {category.label}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                {onLoad && (
                                  <button
                                    type="button"
                                    onClick={() => onLoad(calc)}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    title="Load calculation"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <title>Load</title>
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                      />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => exportRiceToPDF(calc)}
                                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                  title="Export to PDF"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <title>Export PDF</title>
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCalculations.length} calculation{filteredCalculations.length !== 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => exportSelected("json")}>
              Backup All
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Color mapping for categories
const categoryColors = {
  green: "#10b981",
  yellow: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
}
