import { useState } from "react"
import { Button } from "~/components/common/Button"
import { Input } from "~/components/common/Input"
import { Select } from "~/components/common/Select"
import { formatCurrency } from "~/lib/calculators/roi"
import type { BenefitCategory, CostCategory, Currency, LineItem } from "~/types"

interface CostBenefitInputsProps {
  costs: LineItem[]
  benefits: LineItem[]
  onCostsChange: (costs: LineItem[]) => void
  onBenefitsChange: (benefits: LineItem[]) => void
  currency: Currency
  timeHorizon: number
}

export function CostBenefitInputs({
  costs,
  benefits,
  onCostsChange,
  onBenefitsChange,
  currency,
  timeHorizon,
}: CostBenefitInputsProps) {
  const [activeTab, setActiveTab] = useState<"costs" | "benefits">("costs")

  const addLineItem = (type: "costs" | "benefits") => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      category: type === "costs" ? "development" : "revenue",
      description: "",
      amount: 0,
      startMonth: 1,
      months: 1,
      isRecurring: true,
      probability: type === "benefits" ? 100 : undefined,
    }

    if (type === "costs") {
      onCostsChange([...costs, newItem])
    } else {
      onBenefitsChange([...benefits, newItem])
    }
  }

  const updateLineItem = (type: "costs" | "benefits", id: string, updates: Partial<LineItem>) => {
    if (type === "costs") {
      onCostsChange(costs.map((item) => (item.id === id ? { ...item, ...updates } : item)))
    } else {
      onBenefitsChange(benefits.map((item) => (item.id === id ? { ...item, ...updates } : item)))
    }
  }

  const removeLineItem = (type: "costs" | "benefits", id: string) => {
    if (type === "costs") {
      onCostsChange(costs.filter((item) => item.id !== id))
    } else {
      onBenefitsChange(benefits.filter((item) => item.id !== id))
    }
  }

  const calculateTotal = (items: LineItem[]) => {
    return items.reduce((total, item) => {
      const amount = item.isRecurring ? item.amount * item.months : item.amount
      const probability = item.probability ? item.probability / 100 : 1
      return total + amount * probability
    }, 0)
  }

  return (
    <div className="space-y-4">
      {/* Tab Selection */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("costs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "costs"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Costs ({costs.length})
          <span className="ml-2 text-xs text-gray-500">
            Total: {formatCurrency(calculateTotal(costs), currency)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("benefits")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "benefits"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Benefits ({benefits.length})
          <span className="ml-2 text-xs text-gray-500">
            Total: {formatCurrency(calculateTotal(benefits), currency)}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === "costs" ? (
          <LineItemList
            items={costs}
            type="costs"
            currency={currency}
            timeHorizon={timeHorizon}
            onUpdate={(id, updates) => updateLineItem("costs", id, updates)}
            onRemove={(id) => removeLineItem("costs", id)}
          />
        ) : (
          <LineItemList
            items={benefits}
            type="benefits"
            currency={currency}
            timeHorizon={timeHorizon}
            onUpdate={(id, updates) => updateLineItem("benefits", id, updates)}
            onRemove={(id) => removeLineItem("benefits", id)}
          />
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => addLineItem(activeTab)}
          className="w-full"
        >
          + Add {activeTab === "costs" ? "Cost" : "Benefit"}
        </Button>
      </div>
    </div>
  )
}

interface LineItemListProps {
  items: LineItem[]
  type: "costs" | "benefits"
  currency: Currency
  timeHorizon: number
  onUpdate: (id: string, updates: Partial<LineItem>) => void
  onRemove: (id: string) => void
}

function LineItemList({
  items,
  type,
  currency,
  timeHorizon,
  onUpdate,
  onRemove,
}: LineItemListProps) {
  const costCategories: CostCategory[] = [
    "development",
    "marketing",
    "operations",
    "infrastructure",
    "licensing",
    "other",
  ]

  const benefitCategories: BenefitCategory[] = [
    "revenue",
    "cost_savings",
    "efficiency",
    "strategic",
    "other",
  ]

  const categories = type === "costs" ? costCategories : benefitCategories

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">No {type} added yet</div>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          {type === "costs"
            ? "Add your project costs like development, infrastructure, or licensing"
            : "Add expected benefits like revenue increases or cost savings"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
        >
          {/* Description and Category */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Description"
              value={item.description}
              onChange={(e) => onUpdate(item.id, { description: e.target.value })}
              placeholder={type === "costs" ? "e.g., Software licenses" : "e.g., Increased sales"}
              required
            />
            <Select
              label="Category"
              value={item.category}
              onChange={(e) =>
                onUpdate(item.id, {
                  category: e.target.value as CostCategory | BenefitCategory,
                })
              }
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          {/* Amount and Timing */}
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={`Amount (${currency})`}
              type="number"
              value={item.amount}
              onChange={(e) => onUpdate(item.id, { amount: parseFloat(e.target.value) || 0 })}
              min={0}
              step={100}
              required
            />
            <Input
              label="Start Month"
              type="number"
              value={item.startMonth}
              onChange={(e) => onUpdate(item.id, { startMonth: parseInt(e.target.value) || 1 })}
              min={1}
              max={timeHorizon}
              helperText="1-based"
            />
            <Input
              label="Duration (months)"
              type="number"
              value={item.months}
              onChange={(e) => onUpdate(item.id, { months: parseInt(e.target.value) || 1 })}
              min={1}
              max={timeHorizon - item.startMonth + 1}
            />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.isRecurring}
                  onChange={(e) => onUpdate(item.id, { isRecurring: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Recurring {type === "costs" ? "cost" : "benefit"}</span>
              </label>

              {type === "benefits" && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`probability-${item.id}`}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    Probability:
                  </label>
                  <Input
                    id={`probability-${item.id}`}
                    type="number"
                    value={item.probability || 100}
                    onChange={(e) =>
                      onUpdate(item.id, {
                        probability: parseInt(e.target.value) || 100,
                      })
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Remove
            </Button>
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-600 dark:text-gray-400 border-t pt-2">
            Total:{" "}
            {formatCurrency(item.isRecurring ? item.amount * item.months : item.amount, currency)}
            {item.probability && item.probability < 100 && (
              <span className="ml-2">
                (Risk-adjusted:{" "}
                {formatCurrency(
                  (item.isRecurring ? item.amount * item.months : item.amount) *
                    (item.probability / 100),
                  currency
                )}
                )
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
