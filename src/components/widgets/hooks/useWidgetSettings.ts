import { useStorage } from "@plasmohq/storage/hook"
import { useCallback } from "react"

interface UseWidgetSettingsOptions {
  defaultSettings?: Record<string, unknown>
  validate?: (settings: Record<string, unknown>) => boolean
  onChange?: (settings: Record<string, unknown>) => void
}

interface UseWidgetSettingsReturn<T = Record<string, unknown>> {
  settings: T
  updateSettings: (updates: Partial<T>) => void
  resetSettings: () => void
  isLoading: boolean
}

/**
 * Hook for managing widget-specific settings
 * Provides persistent storage and validation
 */
export function useWidgetSettings<T extends Record<string, unknown> = Record<string, unknown>>(
  widgetId: string,
  options: UseWidgetSettingsOptions = {}
): UseWidgetSettingsReturn<T> {
  const { defaultSettings = {}, validate, onChange } = options

  const storageKey = `widget-settings-${widgetId}`

  const [settings, setSettings, { isLoading }] = useStorage<T>(storageKey, defaultSettings as T)

  const updateSettings = useCallback(
    (updates: Partial<T>) => {
      const newSettings = { ...settings, ...updates } as T

      // Validate if validator is provided
      if (validate && !validate(newSettings)) {
        console.error("Invalid widget settings:", newSettings)
        return
      }

      setSettings(newSettings)
      onChange?.(newSettings)
    },
    [settings, setSettings, validate, onChange]
  )

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings as T)
    onChange?.(defaultSettings)
  }, [defaultSettings, setSettings, onChange])

  return {
    settings: settings || (defaultSettings as T),
    updateSettings,
    resetSettings,
    isLoading,
  }
}

/**
 * Common widget settings that all widgets can use
 */
export interface CommonWidgetSettings {
  customTitle?: string
  refreshInterval?: number // in minutes
  theme?: "light" | "dark" | "auto"
  compactMode?: boolean
}

/**
 * Helper hook for common widget settings
 */
export function useCommonWidgetSettings(widgetId: string) {
  return useWidgetSettings<CommonWidgetSettings>(widgetId, {
    defaultSettings: {
      refreshInterval: 15, // 15 minutes
      theme: "auto",
      compactMode: false,
    },
  })
}
