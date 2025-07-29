/**
 * Chrome storage type definitions
 * Defines the complete schema for all data stored in Chrome extension storage
 */

import type {
  AbTestResult,
  FeedMetadata,
  FeedSource,
  HackerNewsItem,
  JiraTicket,
  MarketSize,
  ProductHuntItem,
  RiceScore,
  RoiCalculation,
  RssFeedItem,
  UserSettings,
  WidgetConfig,
} from "./index"

import type { ClipData } from "./messages"

// ========== Storage Schema ==========

/**
 * Complete storage schema for the extension
 * Keys are organized by storage area (sync vs local)
 */
export interface StorageSchema {
  // ===== Sync Storage (synced across devices) =====

  /**
   * User preferences and settings
   */
  userSettings: UserSettings

  /**
   * Dashboard widget layout configuration
   */
  "dashboard-layout": WidgetConfig[]

  /**
   * User's saved RSS feed URLs
   */
  "rss-feeds": RssFeedConfig[]

  // ===== Local Storage (device-specific) =====

  /**
   * Feed item caches
   */
  "product-hunt-feed": ProductHuntItem[]
  "hacker-news-feed": HackerNewsItem[]
  "jira-feed": JiraTicket[]
  "rss-feed": RssFeedItem[]

  /**
   * Feed metadata and timestamps
   */
  "feed-metadata": Record<FeedSource, FeedMetadata>

  /**
   * Calculator history organized by type
   */
  "calculator-history": {
    rice: RiceScore[]
    roi: RoiCalculation[]
    tam: MarketSize[]
    abTest: AbTestResult[]
  }

  /**
   * Web clipper saved clips
   */
  "web-clips": ClipData[]

  /**
   * Cache management
   */
  "cache-version": number
  "cache-timestamps": Record<string, number>

  /**
   * Temporary data and state
   */
  "temp-state": {
    lastActiveTab?: string
    pendingClip?: Partial<ClipData>
    syncInProgress?: boolean
  }

  /**
   * Usage analytics (anonymous)
   */
  "usage-stats": {
    installDate: number
    lastActiveDate: number
    featureUsage: Record<string, number>
    totalCalculations: number
    totalClips: number
  }
}

// ========== Additional Types ==========

/**
 * RSS feed configuration
 */
export interface RssFeedConfig {
  id: string
  url: string
  title: string
  enabled: boolean
  addedAt: number
}

/**
 * Storage areas in Chrome
 */
export type StorageArea = "local" | "sync" | "managed"

/**
 * All storage keys
 */
export type StorageKey = keyof StorageSchema

/**
 * Sync storage keys only
 */
export type SyncStorageKey = "userSettings" | "dashboard-layout" | "rss-feeds"

/**
 * Local storage keys only
 */
export type LocalStorageKey = Exclude<StorageKey, SyncStorageKey>

/**
 * Storage change event structure
 */
export interface StorageChange<K extends StorageKey> {
  oldValue?: StorageSchema[K]
  newValue?: StorageSchema[K]
}

/**
 * Storage changes object passed to listeners
 */
export type StorageChanges = {
  [K in StorageKey]?: StorageChange<K>
}

// ========== Helper Types ==========

/**
 * Partial update type for storage
 */
export type PartialStorageUpdate<K extends StorageKey> = K extends "calculator-history"
  ? {
      rice?: RiceScore[]
      roi?: RoiCalculation[]
      tam?: MarketSize[]
      abTest?: AbTestResult[]
    }
  : K extends "feed-metadata"
    ? Partial<Record<FeedSource, FeedMetadata>>
    : Partial<StorageSchema[K]>

/**
 * Storage getter result
 */
export type StorageGetResult<K extends StorageKey> = {
  [key in K]?: StorageSchema[key]
}

// ========== Storage Utilities ==========

/**
 * Default values for storage keys
 */
export const STORAGE_DEFAULTS: Partial<StorageSchema> = {
  userSettings: {
    refreshInterval: 15,
    theme: "light",
    productHuntEnabled: true,
    hackerNewsEnabled: true,
    jiraEnabled: false,
    compactMode: false,
    showNotifications: true,
    defaultNewTab: true,
  },
  "dashboard-layout": [],
  "rss-feeds": [],
  "calculator-history": {
    rice: [],
    roi: [],
    tam: [],
    abTest: [],
  },
  "web-clips": [],
  "feed-metadata": {} as Record<FeedSource, FeedMetadata>,
  "cache-version": 1,
  "cache-timestamps": {},
  "temp-state": {},
  "usage-stats": {
    installDate: Date.now(),
    lastActiveDate: Date.now(),
    featureUsage: {},
    totalCalculations: 0,
    totalClips: 0,
  },
}

/**
 * Storage key configuration
 */
export const STORAGE_CONFIG: Record<StorageKey, { area: StorageArea; quota?: number }> = {
  // Sync storage (limited to 100KB total, 8KB per item)
  userSettings: { area: "sync", quota: 8192 },
  "dashboard-layout": { area: "sync", quota: 8192 },
  "rss-feeds": { area: "sync", quota: 8192 },

  // Local storage (limited to 10MB total)
  "product-hunt-feed": { area: "local", quota: 1048576 }, // 1MB
  "hacker-news-feed": { area: "local", quota: 1048576 }, // 1MB
  "jira-feed": { area: "local", quota: 1048576 }, // 1MB
  "rss-feed": { area: "local", quota: 1048576 }, // 1MB
  "feed-metadata": { area: "local", quota: 102400 }, // 100KB
  "calculator-history": { area: "local", quota: 524288 }, // 512KB
  "web-clips": { area: "local", quota: 2097152 }, // 2MB
  "cache-version": { area: "local", quota: 1024 }, // 1KB
  "cache-timestamps": { area: "local", quota: 10240 }, // 10KB
  "temp-state": { area: "local", quota: 102400 }, // 100KB
  "usage-stats": { area: "local", quota: 102400 }, // 100KB
}

// ========== Type Guards ==========

/**
 * Check if a key is a sync storage key
 */
export function isSyncStorageKey(key: string): key is SyncStorageKey {
  return ["userSettings", "dashboard-layout", "rss-feeds"].includes(key)
}

/**
 * Check if a key is a local storage key
 */
export function isLocalStorageKey(key: string): key is LocalStorageKey {
  return !isSyncStorageKey(key) && key in STORAGE_CONFIG
}

/**
 * Check if a key is a valid storage key
 */
export function isValidStorageKey(key: string): key is StorageKey {
  return key in STORAGE_CONFIG
}

// ========== Storage Helper Functions ==========

/**
 * Get the storage area for a key
 */
export function getStorageArea(key: StorageKey): chrome.storage.StorageArea {
  const config = STORAGE_CONFIG[key]
  switch (config.area) {
    case "sync":
      return chrome.storage.sync
    case "managed":
      return chrome.storage.managed
    default:
      return chrome.storage.local
  }
}

/**
 * Estimate storage size for a value
 */
export function estimateStorageSize(value: unknown): number {
  try {
    return new Blob([JSON.stringify(value)]).size
  } catch {
    return 0
  }
}

/**
 * Check if storage quota is exceeded
 */
export function isQuotaExceeded(key: StorageKey, value: unknown): boolean {
  const config = STORAGE_CONFIG[key]
  if (!config.quota) return false

  const size = estimateStorageSize(value)
  return size > config.quota
}
