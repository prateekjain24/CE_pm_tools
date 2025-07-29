/**
 * Utility functions for the PM Dashboard
 */

/**
 * Combines class names conditionally
 * @param classes - Array of class names or conditional class names
 * @returns Combined class string
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number as a percentage
 * @param value - The value to format (0-1 for 0-100%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a date relative to now
 * @param date - The date to format
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | number): string {
  const timestamp = typeof date === "number" ? date : date.getTime()
  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day

  if (diff < minute) {
    return "just now"
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diff < day) {
    const hours = Math.floor(diff / hour)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else if (diff < week) {
    const days = Math.floor(diff / day)
    return `${days} day${days > 1 ? "s" : ""} ago`
  } else if (diff < month) {
    const weeks = Math.floor(diff / week)
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`
  } else {
    const months = Math.floor(diff / month)
    return `${months} month${months > 1 ? "s" : ""} ago`
  }
}

/**
 * Debounce a function call
 * @param func - The function to debounce
 * @param wait - The delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generate a unique ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix = ""): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`
}
