import { Storage } from "@plasmohq/storage"

// Initialize storage with local area
const _storage = new Storage({ area: "local" })

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log("PM Dashboard installed:", details.reason)

  // Set default settings on first install
  if (details.reason === "install") {
    chrome.storage.sync.set({
      userSettings: {
        refreshInterval: 15,
        theme: "light",
        productHuntEnabled: true,
        hackerNewsEnabled: true,
        jiraEnabled: false,
      },
    })
  }

  // Create alarm for periodic feed updates
  chrome.alarms.create("fetch-feeds", {
    delayInMinutes: 1, // First fetch after 1 minute
    periodInMinutes: 15, // Then every 15 minutes
  })
})

// Alarm handler for periodic tasks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "fetch-feeds") {
    console.log("Fetching feeds...")
    // Feed fetching logic will be implemented in future stories
    // This will include:
    // - Fetching Product Hunt data
    // - Fetching Hacker News data
    // - Updating storage with new feed items
    // - Sending notifications for important updates
  }
})

// Message handler for communication with content scripts and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("Message received:", request.type)

  switch (request.type) {
    case "FETCH_FEED":
      // Handle feed fetch requests
      sendResponse({ success: true, message: "Feed fetch initiated" })
      break

    case "GET_SETTINGS":
      // Return current settings
      chrome.storage.sync.get(["userSettings"], (result) => {
        sendResponse({ success: true, data: result.userSettings })
      })
      return true // Keep message channel open for async response

    case "UPDATE_SETTINGS":
      // Update settings
      chrome.storage.sync.set({ userSettings: request.data }, () => {
        sendResponse({ success: true, message: "Settings updated" })
      })
      return true

    default:
      sendResponse({ success: false, error: "Unknown message type" })
  }
})

// Handle extension update
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log("Update available:", details.version)
  // Could show notification to user about available update
})
