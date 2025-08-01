/**
 * URL Sharing utilities for A/B Test Calculator
 * Enables sharing test configurations and results via URL parameters
 */

import type { TestConfig, TestMetadata, TestResult, Variation } from "~/types"

interface SharedTestData {
  config: TestConfig
  metadata: TestMetadata
  variations: Variation[]
  results?: TestResult[]
  timestamp?: number
}

/**
 * Encode test data to URL-safe string
 */
export function encodeTestToURL(data: SharedTestData): string {
  try {
    // Create a compact version of the data
    const compactData = {
      c: {
        tt: data.config.testType,
        m: data.config.metric,
        sm: data.config.statisticalMethod,
        cl: data.config.confidenceLevel,
        td: data.config.testDirection,
        me: data.config.minimumEffect,
        ta: data.config.trafficAllocation,
        cm: data.config.correctionMethod,
      },
      m: {
        n: data.metadata.name,
        h: data.metadata.hypothesis,
        o: data.metadata.owner,
        s: data.metadata.stakeholders,
        t: data.metadata.tags,
        bi: data.metadata.businessImpact,
      },
      v: data.variations.map((v) => ({
        i: v.id,
        n: v.name,
        vs: v.visitors,
        c: v.conversions,
        r: v.revenue,
        e: v.engagement,
        cm: v.customMetrics,
      })),
      r: data.results?.map((r) => ({
        m: r.method,
        p: r.pValue,
        s: r.isSignificant,
        ci: r.confidenceInterval,
        u: r.uplift,
        au: r.absoluteUplift,
        es: r.effectSize,
        pw: r.power,
        w: r.winner,
      })),
      ts: data.timestamp || Date.now(),
    }

    // Convert to JSON and compress
    const json = JSON.stringify(compactData)
    const compressed = btoa(encodeURIComponent(json))

    return compressed
  } catch (error) {
    console.error("Error encoding test data:", error)
    throw new Error("Failed to encode test data for sharing")
  }
}

/**
 * Decode test data from URL parameter
 */
export function decodeTestFromURL(encoded: string): SharedTestData | null {
  try {
    // Decompress and parse
    const json = decodeURIComponent(atob(encoded))
    const compactData = JSON.parse(json)

    // Validate structure
    if (!compactData.c || !compactData.m || !compactData.v) {
      throw new Error("Invalid test data structure")
    }

    // Reconstruct full data
    const data: SharedTestData = {
      config: {
        testType: compactData.c.tt,
        metric: compactData.c.m,
        statisticalMethod: compactData.c.sm,
        confidenceLevel: compactData.c.cl,
        testDirection: compactData.c.td,
        minimumEffect: compactData.c.me,
        trafficAllocation: compactData.c.ta,
        correctionMethod: compactData.c.cm,
      },
      metadata: {
        name: compactData.m.n || "",
        hypothesis: compactData.m.h || "",
        owner: compactData.m.o || "",
        stakeholders: compactData.m.s || [],
        tags: compactData.m.t || [],
        businessImpact: compactData.m.bi,
      },
      variations: compactData.v.map(
        (v: {
          i: string
          n: string
          vs: number
          c: number
          r?: number
          e?: number
          cm?: Record<string, number>
        }) => ({
          id: v.i,
          name: v.n,
          visitors: v.vs,
          conversions: v.c,
          revenue: v.r,
          engagement: v.e,
          customMetrics: v.cm,
        })
      ),
      results: compactData.r?.map(
        (r: {
          m: string
          p: number
          s: boolean
          ci: [number, number]
          u: number
          au: number
          es: number
          pw: number
          w?: string
        }) => ({
          method: r.m,
          pValue: r.p,
          isSignificant: r.s,
          confidenceInterval: r.ci,
          uplift: r.u,
          absoluteUplift: r.au,
          effectSize: r.es,
          power: r.pw,
          winner: r.w,
        })
      ),
      timestamp: compactData.ts,
    }

    return data
  } catch (error) {
    console.error("Error decoding test data:", error)
    return null
  }
}

/**
 * Generate shareable link for current test
 */
export function generateShareableLink(data: SharedTestData): string {
  const encoded = encodeTestToURL(data)
  const baseUrl = window.location.origin + window.location.pathname

  // Create URL with test parameter
  const url = new URL(baseUrl)
  url.searchParams.set("test", encoded)

  // Add optional parameters for better UX
  if (data.metadata.name) {
    url.searchParams.set("name", data.metadata.name)
  }

  return url.toString()
}

/**
 * Extract test data from current URL
 */
export function getTestFromURL(): SharedTestData | null {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get("test")

  if (!encoded) {
    return null
  }

  return decodeTestFromURL(encoded)
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const success = document.execCommand("copy")
    document.body.removeChild(textArea)

    return success
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    return false
  }
}

/**
 * Validate shared test data
 */
export function validateSharedTest(data: SharedTestData): string[] {
  const errors: string[] = []

  // Validate config
  if (!data.config || !data.config.testType || !data.config.metric) {
    errors.push("Invalid test configuration")
  }

  // Validate variations
  if (!data.variations || data.variations.length < 2) {
    errors.push("Test must have at least 2 variations")
  }

  // Validate data integrity
  data.variations.forEach((v, i) => {
    if (v.conversions > v.visitors) {
      errors.push(`Variation ${i + 1}: Conversions cannot exceed visitors`)
    }
  })

  // Check timestamp age (warn if older than 30 days)
  if (data.timestamp) {
    const age = Date.now() - data.timestamp
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    if (age > thirtyDays) {
      errors.push("This test data is more than 30 days old")
    }
  }

  return errors
}
