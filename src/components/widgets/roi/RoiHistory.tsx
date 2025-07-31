import { useState } from "react"
import { Button } from "~/components/common/Button"
import { Modal } from "~/components/common/Modal"
import { formatCurrency, getRoiCategory } from "~/lib/calculators/roi"
import { exportRoiToCSV, exportRoiToJSON, exportRoiToPDF } from "~/lib/export/roiExport"
import type { Currency, RoiCalculation } from "~/types"

interface RoiHistoryProps {
  calculations: RoiCalculation[]
  onClose: () => void
  onLoad: (calculation: RoiCalculation) => void
  onDelete: (id: string) => void
  currency: Currency
}

export function RoiHistory({ calculations, onClose, onLoad, onDelete, currency }: RoiHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "roi" | "npv">("date")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter and sort calculations
  const filteredCalculations = calculations
    .filter(
      (calc) =>
        calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case "roi":
          return (b.metrics?.simpleRoi || 0) - (a.metrics?.simpleRoi || 0)
        case "npv":
          return (b.metrics?.npv || 0) - (a.metrics?.npv || 0)
        default:
          return 0
      }
    })

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCalculations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCalculations.map((calc) => calc.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return

    if (confirm(`Delete ${selectedIds.size} selected calculation(s)?`)) {
      selectedIds.forEach((id) => onDelete(id))
      setSelectedIds(new Set())
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="ROI Calculation History" size="lg">
      <div className="space-y-4">
        {/* Search and Controls */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search calculations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "roi" | "npv")}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="date">Sort by Date</option>
            <option value="roi">Sort by ROI</option>
            <option value="npv">Sort by NPV</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {calculations.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedIds.size === filteredCalculations.length &&
                  filteredCalculations.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Select All ({filteredCalculations.length})</span>
            </label>

            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Delete Selected ({selectedIds.size})
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportRoiToCSV(filteredCalculations)}
                disabled={filteredCalculations.length === 0}
              >
                Export CSV
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportRoiToJSON(filteredCalculations)}
                disabled={filteredCalculations.length === 0}
              >
                Export JSON
              </Button>
            </div>
          </div>
        )}

        {/* Calculations List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCalculations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No calculations match your search." : "No calculations saved yet."}
            </div>
          ) : (
            filteredCalculations.map((calc) => (
              <CalculationCard
                key={calc.id}
                calculation={calc}
                currency={currency}
                isSelected={selectedIds.has(calc.id)}
                onSelect={(selected) => {
                  const newSelected = new Set(selectedIds)
                  if (selected) {
                    newSelected.add(calc.id)
                  } else {
                    newSelected.delete(calc.id)
                  }
                  setSelectedIds(newSelected)
                }}
                onLoad={() => onLoad(calc)}
                onDelete={() => onDelete(calc.id)}
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

interface CalculationCardProps {
  calculation: RoiCalculation
  currency: Currency
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onLoad: () => void
  onDelete: () => void
}

function CalculationCard({
  calculation,
  currency,
  isSelected,
  onSelect,
  onLoad,
  onDelete,
}: CalculationCardProps) {
  const metrics = calculation.metrics
  const roiCategory = metrics ? getRoiCategory(metrics.simpleRoi) : null

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {calculation.name}
              </h4>
              {calculation.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {calculation.description}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {new Date(calculation.savedAt).toLocaleDateString()} at{" "}
                {new Date(calculation.savedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={onLoad}>
                Load
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportRoiToPDF(calculation)}
                title="Export to PDF"
              >
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this calculation?")) {
                    onDelete()
                  }
                }}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Delete
              </Button>
            </div>
          </div>

          {metrics && (
            <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">ROI:</span>
                <span
                  className={`ml-1 font-medium ${
                    roiCategory?.color === "green"
                      ? "text-green-600 dark:text-green-400"
                      : roiCategory?.color === "red"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {metrics.simpleRoi.toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400">NPV:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(metrics.npv, currency)}
                </span>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400">IRR:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                  {metrics.irr.toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400">Payback:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                  {metrics.paybackPeriod <= calculation.timeHorizon
                    ? `${metrics.paybackPeriod.toFixed(1)}m`
                    : `>${calculation.timeHorizon}m`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
