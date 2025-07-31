import { useState } from "react"
import { widgetRegistry } from "~/lib/dashboard/widgetRegistry"
import type { WidgetConfig } from "~/types"
import { Button, Input, Modal, Select, Switch } from "../common"
import { useWidgetSettings } from "../widgets/hooks"

interface WidgetSettingsProps {
  widget: WidgetConfig
  open: boolean
  onClose: () => void
  onSave: (settings: Record<string, unknown>) => void
}

export function WidgetSettings({ widget, open, onClose, onSave }: WidgetSettingsProps) {
  const widgetDefinition = widgetRegistry.get(widget.type)
  const { settings, updateSettings } = useWidgetSettings(widget.id, {
    defaultSettings: widget.settings || {},
  })

  // Local state for form
  const [formData, setFormData] = useState({
    customTitle: settings.customTitle || widget.title || "",
    refreshInterval: settings.refreshInterval || 15,
    ...settings,
  })

  const handleSave = () => {
    updateSettings(formData)
    onSave(formData)
    onClose()
  }

  const handleCancel = () => {
    // Reset form to current settings
    setFormData({
      customTitle: settings.customTitle || widget.title || "",
      refreshInterval: settings.refreshInterval || 15,
      ...settings,
    })
    onClose()
  }

  if (!widgetDefinition) return null

  return (
    <Modal open={open} onClose={handleCancel} title={`${widgetDefinition.name} Settings`} size="md">
      <div className="space-y-4">
        {/* Common Settings */}
        <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">General Settings</h4>

          {/* Custom Title */}
          <div>
            <label
              htmlFor="custom-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Widget Title
            </label>
            <Input
              id="custom-title"
              type="text"
              value={formData.customTitle}
              onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
              placeholder={widgetDefinition.name}
            />
          </div>

          {/* Refresh Interval (for feed widgets) */}
          {widgetDefinition.category === "feed" && (
            <div>
              <label
                htmlFor="refresh-interval"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Refresh Interval (minutes)
              </label>
              <Select
                id="refresh-interval"
                value={formData.refreshInterval.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })
                }
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </Select>
            </div>
          )}
        </div>

        {/* Widget-Specific Settings */}
        {renderWidgetSpecificSettings(widget.type, formData, setFormData)}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Render widget-specific settings based on widget type
 */
function renderWidgetSpecificSettings(
  widgetType: string,
  formData: Record<string, unknown>,
  setFormData: (data: Record<string, unknown>) => void
) {
  switch (widgetType) {
    case "product-hunt-feed":
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Product Hunt Settings
          </h4>
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.showFeaturedOnly || false}
                onChange={(checked) => setFormData({ ...formData, showFeaturedOnly: checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show featured products only
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor="max-items"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Maximum items to display
            </label>
            <Input
              id="max-items"
              type="number"
              value={formData.maxItems || 5}
              onChange={(e) => setFormData({ ...formData, maxItems: parseInt(e.target.value) })}
              min="1"
              max="20"
            />
          </div>
        </div>
      )

    case "rice-calculator":
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Calculator Settings
          </h4>
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.autoSave || false}
                onChange={(checked) => setFormData({ ...formData, autoSave: checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-save calculations
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.showHistory || false}
                onChange={(checked) => setFormData({ ...formData, showHistory: checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show calculation history
              </span>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No additional settings available for this widget.
        </div>
      )
  }
}
