/**
 * Secure storage wrapper for sensitive data like API keys
 * Uses a simple XOR cipher with a generated key for basic obfuscation
 * Note: This is not cryptographically secure but provides basic protection
 */

class SecureStorage {
  private storageKey = "pm-dashboard-secure"
  private encryptionKey: string

  constructor() {
    // Generate or retrieve encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey()
  }

  /**
   * Get or create the encryption key
   */
  private getOrCreateEncryptionKey(): string {
    const storedKey = localStorage.getItem("pm-dashboard-ek")
    if (storedKey) {
      return storedKey
    }

    // Generate a new key
    const newKey = this.generateKey()
    localStorage.setItem("pm-dashboard-ek", newKey)
    return newKey
  }

  /**
   * Generate a random key
   */
  private generateKey(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  /**
   * Simple XOR cipher for obfuscation
   */
  private xorCipher(text: string, key: string): string {
    let result = ""
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  }

  /**
   * Encode string to base64
   */
  private encode(str: string): string {
    return btoa(encodeURIComponent(str))
  }

  /**
   * Decode string from base64
   */
  private decode(str: string): string {
    try {
      return decodeURIComponent(atob(str))
    } catch {
      return ""
    }
  }

  /**
   * Encrypt and store data
   */
  async set(key: string, value: unknown): Promise<void> {
    try {
      const jsonString = JSON.stringify(value)
      const encrypted = this.xorCipher(jsonString, this.encryptionKey)
      const encoded = this.encode(encrypted)

      const storage = await chrome.storage.local.get(this.storageKey)
      const data = storage[this.storageKey] || {}
      data[key] = encoded

      await chrome.storage.local.set({ [this.storageKey]: data })
    } catch (error) {
      console.error("Failed to store secure data:", error)
      throw error
    }
  }

  /**
   * Retrieve and decrypt data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const storage = await chrome.storage.local.get(this.storageKey)
      const data = storage[this.storageKey] || {}

      if (!data[key]) {
        return null
      }

      const decoded = this.decode(data[key])
      const decrypted = this.xorCipher(decoded, this.encryptionKey)
      return JSON.parse(decrypted) as T
    } catch (error) {
      console.error("Failed to retrieve secure data:", error)
      return null
    }
  }

  /**
   * Remove secure data
   */
  async remove(key: string): Promise<void> {
    try {
      const storage = await chrome.storage.local.get(this.storageKey)
      const data = storage[this.storageKey] || {}
      delete data[key]

      await chrome.storage.local.set({ [this.storageKey]: data })
    } catch (error) {
      console.error("Failed to remove secure data:", error)
      throw error
    }
  }

  /**
   * Clear all secure data
   */
  async clear(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.storageKey)
    } catch (error) {
      console.error("Failed to clear secure data:", error)
      throw error
    }
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    const storage = await chrome.storage.local.get(this.storageKey)
    const data = storage[this.storageKey] || {}
    return key in data
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    const storage = await chrome.storage.local.get(this.storageKey)
    const data = storage[this.storageKey] || {}
    return Object.keys(data)
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage()

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(value: string, showLast = 4): string {
  if (!value || value.length <= showLast) {
    return value
  }

  const visiblePart = value.slice(-showLast)
  const maskedPart = "•".repeat(Math.max(8, value.length - showLast))
  return maskedPart + visiblePart
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string, service?: string): boolean {
  if (!key || key.trim().length === 0) {
    return false
  }

  // Service-specific validation
  switch (service) {
    case "github":
      // GitHub personal access tokens start with ghp_ or github_pat_
      return key.startsWith("ghp_") || key.startsWith("github_pat_")

    case "jira":
      // Jira API tokens are typically base64 encoded
      return /^[A-Za-z0-9+/=]+$/.test(key) && key.length > 20

    case "producthunt":
      // Product Hunt tokens are typically long alphanumeric strings
      return /^[A-Za-z0-9]+$/.test(key) && key.length > 30

    default:
      // Generic validation: at least 10 characters
      return key.length >= 10
  }
}
