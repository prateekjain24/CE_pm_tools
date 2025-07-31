import { useMemo, useState } from "react"
import { Button } from "~/components/common/Button"
import { Input } from "~/components/common/Input"
import { Modal } from "~/components/common/Modal"
import { formatCurrency } from "~/lib/calculators/tam"
import type { TamCalculation } from "~/types"

interface TamHistoryProps {
  calculations: TamCalculation[]
  onLoad: (calculation: TamCalculation) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export function TamHistory({ calculations, onLoad, onClose, onDelete }: TamHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "tam" | "confidence">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Filter and sort calculations
  const filteredCalculations = useMemo(() => {
    const filtered = calculations.filter((calc) =>
      calc.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
          break
        case "tam":
          comparison = a.tam - b.tam
          break
        case "confidence":
          comparison = (a.confidence || 0) - (b.confidence || 0)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [calculations, searchQuery, sortBy, sortOrder])

  const handleSort = (field: "date" | "tam" | "confidence") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this calculation?")) {
      onDelete(id)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="TAM/SAM/SOM History" size="lg">
      <div className="space-y-4">
        {/* Search */}
        <Input
          placeholder="Search calculations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        {/* Sort controls */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Sort by:</span>
          <button
            onClick={() => handleSort("date")}
            className={`flex items-center gap-1 ${
              sortBy === "date"
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Date
            {sortBy === "date" && (
              <svg
                className={`w-3 h-3 transform ${sortOrder === "asc" ? "" : "rotate-180"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => handleSort("tam")}
            className={`flex items-center gap-1 ${
              sortBy === "tam"
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            TAM Size
            {sortBy === "tam" && (
              <svg
                className={`w-3 h-3 transform ${sortOrder === "asc" ? "" : "rotate-180"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => handleSort("confidence")}
            className={`flex items-center gap-1 ${
              sortBy === "confidence"
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Confidence
            {sortBy === "confidence" && (
              <svg
                className={`w-3 h-3 transform ${sortOrder === "asc" ? "" : "rotate-180"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            )}
          </button>
        </div>

        {/* Calculations list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCalculations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? "No calculations match your search" : "No calculations saved yet"}
            </div>
          ) : (
            filteredCalculations.map((calc) => (
              <div
                key={calc.id}
                onClick={() => onLoad(calc)}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{calc.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {calc.method === "topDown" ? "Top-Down" : "Bottom-Up"} •{" "}
                      {new Date(calc.savedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">TAM:</span>{" "}
                        <span className="font-medium">
                          {formatCurrency(calc.tam, calc.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">SAM:</span>{" "}
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(calc.sam, calc.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">SOM:</span>{" "}
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {formatCurrency(calc.som, calc.currency)}
                        </span>
                      </div>
                    </div>
                    {calc.confidence !== undefined && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Confidence: {calc.confidence}%
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(calc.id, e)}
                    className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCalculations.length} calculations
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
