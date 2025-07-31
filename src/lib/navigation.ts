/**
 * Navigation utilities for the PM Dashboard extension
 */

import { sendMessage } from "~/types/messages"

// Track navigation history for better UX
const navigationHistory: string[] = []
const MAX_HISTORY_SIZE = 10

export const navigation = {
  /**
   * Open the dashboard in a new tab or focus existing tab
   */
  openDashboard: async (params?: { calculator?: string; widget?: string }) => {
    let url = chrome.runtime.getURL("tabs/newtab.html")

    // Add query parameters if provided
    if (params) {
      const queryParams = new URLSearchParams()
      if (params.calculator) queryParams.set("calculator", params.calculator)
      if (params.widget) queryParams.set("widget", params.widget)
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }
    }

    const tabs = await chrome.tabs.query({
      url: chrome.runtime.getURL("tabs/newtab.html*"),
    })

    if (tabs.length > 0 && tabs[0].id) {
      // Update existing tab with new URL if params provided
      if (params) {
        await chrome.tabs.update(tabs[0].id, { url, active: true })
      } else {
        await chrome.tabs.update(tabs[0].id, { active: true })
      }

      const currentWindow = await chrome.windows.getCurrent()
      if (tabs[0].windowId !== currentWindow.id) {
        await chrome.windows.update(tabs[0].windowId, { focused: true })
      }
    } else {
      await chrome.tabs.create({ url })
    }

    // Track navigation
    navigation.trackHistory("dashboard")
  },

  /**
   * Open settings page, optionally jumping to a specific section
   */
  openSettings: async (section?: string) => {
    const url = section
      ? chrome.runtime.getURL(`tabs/options.html#${section}`)
      : chrome.runtime.getURL("tabs/options.html")

    await chrome.tabs.create({ url })
    navigation.trackHistory(`settings${section ? `#${section}` : ""}`)
  },

  /**
   * Open a specific calculator in a modal or new tab
   */
  openCalculator: async (calculatorType: string) => {
    await navigation.openDashboard({ calculator: calculatorType })
  },

  /**
   * Navigate to a specific widget
   */
  focusWidget: async (widgetId: string) => {
    await navigation.openDashboard({ widget: widgetId })

    // Send message to dashboard to focus the widget
    setTimeout(() => {
      sendMessage({
        type: "FOCUS_WIDGET",
        widgetId,
      })
    }, 500) // Small delay to ensure dashboard is loaded
  },

  /**
   * Navigate within the current tab (for internal navigation)
   */
  navigateInternal: (path: string, params?: Record<string, string>) => {
    const url = new URL(window.location.href)
    url.pathname = path

    // Clear existing search params and set new ones
    url.search = ""
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    window.history.pushState({}, "", url.toString())
    window.dispatchEvent(new PopStateEvent("popstate"))
  },

  /**
   * Go back in navigation history
   */
  goBack: () => {
    if (navigationHistory.length > 1) {
      navigationHistory.pop() // Remove current
      const previous = navigationHistory[navigationHistory.length - 1]
      if (previous) {
        // Handle navigation based on the previous location
        if (previous.startsWith("settings")) {
          const section = previous.split("#")[1]
          navigation.openSettings(section)
        } else if (previous === "dashboard") {
          navigation.openDashboard()
        }
      }
    } else {
      window.history.back()
    }
  },

  /**
   * Track navigation history
   */
  trackHistory: (location: string) => {
    navigationHistory.push(location)
    if (navigationHistory.length > MAX_HISTORY_SIZE) {
      navigationHistory.shift()
    }
  },

  /**
   * Get current navigation history
   */
  getHistory: () => [...navigationHistory],

  /**
   * Clear navigation history
   */
  clearHistory: () => {
    navigationHistory.length = 0
  },
}
