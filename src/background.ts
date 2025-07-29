import { Storage } from "@plasmohq/storage"
import { DEFAULT_USER_SETTINGS } from "~/types"
import type { MessageResponse } from "~/types/messages"
import { createErrorResponse, createSuccessResponse, isMessageRequest } from "~/types/messages"

// Initialize storage with local area
const _storage = new Storage({ area: "local" })

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log("PM Dashboard installed:", details.reason)

  // Set default settings on first install
  if (details.reason === "install") {
    chrome.storage.sync.set({
      userSettings: DEFAULT_USER_SETTINGS,
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
chrome.runtime.onMessage.addListener(
  (
    request: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    // Validate request
    if (!isMessageRequest(request)) {
      sendResponse(createErrorResponse("Invalid message format"))
      return
    }

    console.log("Message received:", request.type)

    switch (request.type) {
      case "FETCH_FEED":
        // Handle feed fetch requests
        sendResponse(
          createSuccessResponse({
            itemsCount: 0,
            metadata: {
              source: request.feed,
              lastUpdated: Date.now(),
              itemCount: 0,
            },
          })
        )
        break

      case "GET_SETTINGS":
        // Return current settings
        chrome.storage.sync.get(["userSettings"], (result) => {
          sendResponse(createSuccessResponse(result.userSettings || DEFAULT_USER_SETTINGS))
        })
        return true // Keep message channel open for async response

      case "UPDATE_SETTINGS":
        // Update settings
        chrome.storage.sync.set({ userSettings: request.data }, () => {
          sendResponse(createSuccessResponse(undefined))
        })
        return true

      default:
        sendResponse(createErrorResponse("Unknown message type"))
    }
  }
)

// Handle extension update
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log("Update available:", details.version)
  // Could show notification to user about available update
})
