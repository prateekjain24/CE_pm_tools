/**
 * Navigation utilities for the PM Dashboard extension
 */

export const navigation = {
  /**
   * Open the dashboard in a new tab or focus existing tab
   */
  openDashboard: async () => {
    const tabs = await chrome.tabs.query({
      url: chrome.runtime.getURL("tabs/newtab.html"),
    })

    if (tabs.length > 0 && tabs[0].id) {
      await chrome.tabs.update(tabs[0].id, { active: true })
      const currentWindow = await chrome.windows.getCurrent()
      if (tabs[0].windowId !== currentWindow.id) {
        await chrome.windows.update(tabs[0].windowId, { focused: true })
      }
    } else {
      await chrome.tabs.create({ url: "tabs/newtab.html" })
    }
  },

  /**
   * Open settings page, optionally jumping to a specific section
   */
  openSettings: async (section?: string) => {
    const url = section
      ? chrome.runtime.getURL(`tabs/options.html#${section}`)
      : chrome.runtime.getURL("tabs/options.html")

    await chrome.tabs.create({ url })
  },

  /**
   * Open a specific calculator in a modal or new tab
   */
  openCalculator: async (calculatorType: string) => {
    // For now, open in new tab with query param
    const url = chrome.runtime.getURL(`tabs/newtab.html?calculator=${calculatorType}`)
    await chrome.tabs.create({ url })
  },

  /**
   * Navigate to a specific widget
   */
  focusWidget: async (_widgetId: string) => {
    // This will scroll to widget once we implement anchoring
    await navigation.openDashboard()
    // TODO: Implement widget focusing/scrolling
  },
}
