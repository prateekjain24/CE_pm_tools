import { Storage } from "@plasmohq/storage"
import { DEFAULT_USER_SETTINGS } from "~/types"
import type { MessageRequest, MessageResponse } from "~/types/messages"
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

      case "TEST_API_CONNECTION":
        // Test API connection
        testApiConnection(request)
          .then((result) => {
            sendResponse(createSuccessResponse(result))
          })
          .catch((error) => {
            sendResponse(createErrorResponse(error.message))
          })
        return true // Keep message channel open for async response

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

// API Connection Testing
async function testApiConnection(
  request: Extract<MessageRequest, { type: "TEST_API_CONNECTION" }>
) {
  const { service, key, metadata } = request

  try {
    switch (service) {
      case "github": {
        // Test GitHub API
        const githubResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${key}`,
            Accept: "application/vnd.github.v3+json",
          },
        })

        if (githubResponse.ok) {
          return { isValid: true, message: "GitHub connection successful" }
        } else if (githubResponse.status === 401) {
          return { isValid: false, message: "Invalid GitHub token" }
        } else {
          return { isValid: false, message: `GitHub API error: ${githubResponse.status}` }
        }
      }

      case "jira": {
        // Test Jira API
        if (!metadata?.jiraDomain || !metadata?.jiraEmail) {
          return { isValid: false, message: "Missing Jira domain or email" }
        }

        const jiraAuth = btoa(`${metadata.jiraEmail}:${key}`)
        const jiraResponse = await fetch(`${metadata.jiraDomain}/rest/api/3/myself`, {
          headers: {
            Authorization: `Basic ${jiraAuth}`,
            Accept: "application/json",
          },
        })

        if (jiraResponse.ok) {
          return { isValid: true, message: "Jira connection successful" }
        } else if (jiraResponse.status === 401) {
          return { isValid: false, message: "Invalid Jira credentials" }
        } else {
          return { isValid: false, message: `Jira API error: ${jiraResponse.status}` }
        }
      }

      case "producthunt": {
        // Test Product Hunt API
        const phResponse = await fetch("https://api.producthunt.com/v2/api/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `{ viewer { id } }`,
          }),
        })

        if (phResponse.ok) {
          const data = await phResponse.json()
          if (data.errors) {
            return { isValid: false, message: "Invalid Product Hunt token" }
          }
          return { isValid: true, message: "Product Hunt connection successful" }
        } else {
          return { isValid: false, message: `Product Hunt API error: ${phResponse.status}` }
        }
      }

      case "custom": {
        // Test custom API endpoint
        if (!metadata?.customUrl) {
          return { isValid: false, message: "Missing custom API URL" }
        }

        const customResponse = await fetch(metadata.customUrl, {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        })

        if (customResponse.ok) {
          return { isValid: true, message: "Custom API connection successful" }
        } else if (customResponse.status === 401) {
          return { isValid: false, message: "Invalid API key" }
        } else {
          return { isValid: false, message: `API error: ${customResponse.status}` }
        }
      }

      default:
        return { isValid: false, message: "Unknown service type" }
    }
  } catch (error) {
    console.error("API connection test error:", error)
    return {
      isValid: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    }
  }
}
