/**
 * Message type definitions for Chrome extension messaging
 * Uses discriminated unions for type-safe message handling
 */

import type {
  AbTestResult,
  FeedItem,
  FeedMetadata,
  FeedSource,
  JiraTicket,
  MarketSize,
  PaginationInfo,
  RiceScore,
  RoiCalculation,
  UserSettings,
} from "./index"

// ========== Request Types ==========

/**
 * All possible message requests using discriminated unions
 */
export type MessageRequest =
  // Feed operations
  | { type: "FETCH_FEED"; feed: FeedSource; force?: boolean }
  | { type: "GET_FEED_ITEMS"; source: FeedSource; limit?: number; offset?: number }
  | { type: "REFRESH_ALL_FEEDS" }
  | { type: "GET_FEED_METADATA"; source: FeedSource }

  // Settings operations
  | { type: "GET_SETTINGS" }
  | { type: "UPDATE_SETTINGS"; data: Partial<UserSettings> }
  | { type: "RESET_SETTINGS" }

  // Calculator operations
  | { type: "SAVE_CALCULATION"; calculatorType: CalculatorType; data: CalculatorData }
  | { type: "GET_CALCULATION_HISTORY"; calculatorType: CalculatorType; limit?: number }
  | { type: "DELETE_CALCULATION"; calculatorType: CalculatorType; id: string }

  // Jira specific
  | { type: "REFRESH_JIRA"; projectKey: string }
  | { type: "GET_JIRA_PROJECTS" }
  | { type: "SEARCH_JIRA"; query: string }

  // Web clipper
  | { type: "SAVE_CLIP"; data: ClipData }
  | { type: "GET_CLIPS"; limit?: number; tags?: string[] }
  | { type: "DELETE_CLIP"; id: string }

  // Cache operations
  | { type: "CLEAR_CACHE"; cacheType: CacheType }
  | { type: "GET_CACHE_SIZE" }

  // Dashboard operations
  | { type: "SAVE_DASHBOARD_LAYOUT"; layout: unknown }
  | { type: "GET_DASHBOARD_LAYOUT" }
  | { type: "RESET_DASHBOARD_LAYOUT" }

/**
 * Calculator types
 */
export type CalculatorType = "rice" | "roi" | "tam" | "abTest"

/**
 * Calculator data union type
 */
export type CalculatorData = RiceScore | RoiCalculation | MarketSize | AbTestResult

/**
 * Cache types that can be cleared
 */
export type CacheType = "feeds" | "calculations" | "clips" | "all"

// ========== Response Types ==========

/**
 * Generic response wrapper
 */
export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

/**
 * Specific response types for each request
 */
export type MessageResponses = {
  // Feed responses
  FETCH_FEED: MessageResponse<{ itemsCount: number; metadata: FeedMetadata }>
  GET_FEED_ITEMS: MessageResponse<{ items: FeedItem[]; pagination: PaginationInfo }>
  REFRESH_ALL_FEEDS: MessageResponse<{ updated: FeedSource[]; failed: FeedSource[] }>
  GET_FEED_METADATA: MessageResponse<FeedMetadata>

  // Settings responses
  GET_SETTINGS: MessageResponse<UserSettings>
  UPDATE_SETTINGS: MessageResponse<void>
  RESET_SETTINGS: MessageResponse<void>

  // Calculator responses
  SAVE_CALCULATION: MessageResponse<{ id: string }>
  GET_CALCULATION_HISTORY: MessageResponse<CalculatorData[]>
  DELETE_CALCULATION: MessageResponse<void>

  // Jira responses
  REFRESH_JIRA: MessageResponse<{ tickets: JiraTicket[] }>
  GET_JIRA_PROJECTS: MessageResponse<JiraProject[]>
  SEARCH_JIRA: MessageResponse<{ results: JiraTicket[] }>

  // Web clipper responses
  SAVE_CLIP: MessageResponse<{ clipId: string }>
  GET_CLIPS: MessageResponse<{ clips: ClipData[] }>
  DELETE_CLIP: MessageResponse<void>

  // Cache responses
  CLEAR_CACHE: MessageResponse<{ cleared: string[] }>
  GET_CACHE_SIZE: MessageResponse<{ sizeInBytes: number; breakdown: Record<string, number> }>

  // Dashboard responses
  SAVE_DASHBOARD_LAYOUT: MessageResponse<void>
  GET_DASHBOARD_LAYOUT: MessageResponse<unknown>
  RESET_DASHBOARD_LAYOUT: MessageResponse<void>
}

// ========== Additional Types ==========

/**
 * Web clip data structure
 */
export interface ClipData {
  id?: string // Generated on save
  url: string
  title: string
  content: string
  selection?: string // Selected text if any
  screenshot?: string // Base64 encoded screenshot
  favicon?: string
  tags: string[]
  timestamp: number
  domain: string
}

/**
 * Jira project information
 */
export interface JiraProject {
  key: string
  name: string
  id: string
  avatarUrl?: string
}

// ========== Type Guards ==========

/**
 * Check if an object is a valid message request
 */
export function isMessageRequest(obj: unknown): obj is MessageRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    typeof (obj as Record<string, unknown>).type === "string"
  )
}

/**
 * Check if a string is a valid feed source
 */
export function isValidFeedSource(source: string): source is FeedSource {
  return ["product-hunt", "hacker-news", "jira", "rss"].includes(source)
}

/**
 * Check if a string is a valid calculator type
 */
export function isValidCalculatorType(type: string): type is CalculatorType {
  return ["rice", "roi", "tam", "abTest"].includes(type)
}

/**
 * Check if a response is an error
 */
export function isErrorResponse<T>(response: MessageResponse<T>): boolean {
  return !response.success || response.error !== undefined
}

// ========== Helper Functions ==========

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T): MessageResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
  }
}

/**
 * Create an error response
 */
export function createErrorResponse(error: string): MessageResponse<never> {
  return {
    success: false,
    error,
    timestamp: Date.now(),
  }
}

/**
 * Send a message to the background script
 */
export async function sendMessage<K extends MessageRequest["type"]>(
  request: Extract<MessageRequest, { type: K }>
): Promise<MessageResponses[K]> {
  try {
    const response = await chrome.runtime.sendMessage(request)
    return response
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred"
    ) as MessageResponses[K]
  }
}

// ========== Constants ==========

/**
 * Message timeout in milliseconds
 */
export const MESSAGE_TIMEOUT = 30000 // 30 seconds

/**
 * Maximum retries for failed messages
 */
export const MAX_MESSAGE_RETRIES = 3

/**
 * Retry delay in milliseconds
 */
export const RETRY_DELAY = 1000 // 1 second
