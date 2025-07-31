/**
 * Core type definitions for PM Dashboard
 * This file contains all the main interfaces and types used throughout the application
 */

// ========== Calculator Types ==========

/**
 * RICE Score Calculator
 * RICE = (Reach × Impact × Confidence) / Effort
 */
export interface RiceScore {
  id: string
  name: string
  reach: number // Number of users affected
  impact: number // 0.25, 0.5, 1, 2, 3 (Minimal to Massive)
  confidence: number // 0-100% as decimal (0-1)
  effort: number // Person-months
  score: number // Calculated: (reach * impact * confidence) / effort
  savedAt: Date
  notes?: string
}

/**
 * Supported currencies for market calculations
 */
export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "INR"

/**
 * TAM/SAM/SOM Market Sizing Calculator
 */
export interface TamCalculation {
  id: string
  name: string
  description?: string
  method: "topDown" | "bottomUp"
  currency: Currency

  // Market values
  tam: number // Total Addressable Market
  sam: number // Serviceable Addressable Market
  som: number // Serviceable Obtainable Market

  // Percentages (for top-down)
  samPercentage?: number // SAM as % of TAM
  somPercentage?: number // SOM as % of SAM

  // Bottom-up specific
  segments?: MarketSegment[]

  // Parameters
  params?: MarketCalculationParams

  // Metadata
  savedAt: Date
  assumptions?: string[]
  confidence?: number // 0-100
  notes?: string
}

/**
 * Market segment for bottom-up calculations
 */
export interface MarketSegment {
  id?: string
  name: string
  users: number
  avgPrice: number
  growthRate: number // Annual growth %
  penetrationRate: number // % of segment addressable
}

/**
 * Market calculation parameters
 */
export interface MarketCalculationParams {
  currency: Currency
  timePeriod: "monthly" | "quarterly" | "annual"
  geographicScope: "global" | "regional" | "country"
  marketMaturity: "emerging" | "growing" | "mature" | "declining"
  competitorCount?: number
  marketShareTarget?: number // Target market share %
}

/**
 * Market sizes with metadata
 */
export interface MarketSizes {
  tam: number
  sam: number
  som: number
  method: "topDown" | "bottomUp"
  segments?: MarketSegment[]
  assumptions: string[]
  confidence: number // 0-100
}

/**
 * Growth scenario for projections
 */
export interface GrowthScenario {
  id: string
  name: string
  description: string
  tamGrowthRate: number
  samGrowthRate: number
  somGrowthRate: number
  confidence: number
  assumptions: string[]
}

/**
 * Scenario for comparison mode
 */
export interface MarketScenario {
  id: string
  name: string
  description: string
  method: "topDown" | "bottomUp"
  values: MarketSizes
  params: MarketCalculationParams
  assumptions: string[]
  confidence: number
  lastModified: Date
}

/**
 * Industry benchmark for percentages
 */
export interface IndustryBenchmark {
  label: string
  value: number
  description: string
  industries: string[]
}

/**
 * ROI (Return on Investment) Calculator - Comprehensive Types
 */

/**
 * Time period for calculations
 */
export type TimePeriod = "monthly" | "quarterly" | "annual"

/**
 * Cost/benefit categories
 */
export type CostCategory =
  | "development"
  | "marketing"
  | "operations"
  | "infrastructure"
  | "licensing"
  | "other"
export type BenefitCategory = "revenue" | "cost_savings" | "efficiency" | "strategic" | "other"

/**
 * Line item for costs or benefits
 */
export interface LineItem {
  id: string
  category: CostCategory | BenefitCategory
  description: string
  amount: number
  startMonth: number // 1-based month when this item starts
  months: number // Duration in months
  isRecurring: boolean
  probability?: number // 0-100 for risk adjustment
}

/**
 * Advanced ROI metrics
 */
export interface RoiMetrics {
  simpleRoi: number // ((Total Benefits - Total Costs) / Total Costs) × 100
  npv: number // Net Present Value
  irr: number // Internal Rate of Return (annualized percentage)
  mirr?: number // Modified IRR
  paybackPeriod: number // Months to break even
  discountedPaybackPeriod?: number // Considering time value of money
  breakEvenMonth: number // Month when cumulative cash flow becomes positive
  pi?: number // Profitability Index (NPV / Initial Investment)
  eva?: number // Economic Value Added
}

/**
 * Risk factor for risk-adjusted calculations
 */
export interface RiskFactor {
  id: string
  name: string
  category: "technical" | "market" | "operational" | "financial"
  probability: number // 0-1 probability of occurring
  impact: number // Multiplier on affected items
  affectedItems: string[] // IDs of line items affected
  mitigation?: {
    description: string
    cost: number
    effectiveness: number // 0-1 reduction in risk
  }
}

/**
 * Main ROI calculation interface
 */
export interface RoiCalculation {
  id: string
  name: string
  description?: string

  // Core inputs
  initialCost: number
  recurringCosts: LineItem[]
  benefits: LineItem[]

  // Time and financial parameters
  timeHorizon: number // Total months to analyze
  timePeriod: TimePeriod
  discountRate: number // Annual percentage for NPV
  discountMethod?: "manual" | "wacc" // How discount rate is determined
  currency: Currency

  // Risk assessment
  riskFactors?: RiskFactor[]
  confidenceLevel?: number // 0-100 overall confidence

  // Calculated metrics
  metrics?: RoiMetrics
  monthlyProjections?: MonthlyProjection[]

  // Metadata
  template?: string // ID of template used
  savedAt: Date
  notes?: string
}

/**
 * Monthly cash flow projection
 */
export interface MonthlyProjection {
  month: number
  costs: number
  benefits: number
  netCashFlow: number
  cumulativeCashFlow: number
  discountedCashFlow?: number
  discountedCumulative?: number
}

/**
 * ROI scenario for comparison
 */
export interface RoiScenario {
  id: string
  name: string
  description: string
  baseCalculation: RoiCalculation
  adjustments: {
    costMultiplier: number // 1.0 = no change
    benefitMultiplier: number
    delayMonths: number // Delay in benefit realization
    riskAdjustment: number // Additional risk factor
  }
  results?: RoiMetrics
  confidence: number
}

/**
 * Industry template for ROI calculations
 */
export interface RoiTemplate {
  id: string
  name: string
  description: string
  industry: string
  category: "software" | "marketing" | "infrastructure" | "operations"
  defaultValues: {
    timeHorizon: number
    discountRate: number
    currency: Currency
    costs: Partial<LineItem>[]
    benefits: Partial<LineItem>[]
  }
  benchmarks: {
    typicalRoi: { min: number; max: number; median: number }
    paybackPeriod: { min: number; max: number; median: number }
    successRate: number // 0-1 probability of success
  }
  tips: string[]
}

/**
 * Monte Carlo simulation results
 */
export interface MonteCarloResults {
  iterations: number
  metrics: {
    roi: { p10: number; p50: number; p90: number; mean: number; stdDev: number }
    npv: { p10: number; p50: number; p90: number; mean: number; stdDev: number }
    payback: { p10: number; p50: number; p90: number; mean: number; stdDev: number }
  }
  successProbability: number // Probability of positive NPV
  distributions: {
    roi: number[]
    npv: number[]
    payback: number[]
  }
}

/**
 * A/B Test Statistical Significance Calculator
 */
export interface AbTestResult {
  id: string
  name: string
  controlSize: number // Sample size of control group
  controlConversions: number // Conversions in control
  variantSize: number // Sample size of variant
  variantConversions: number // Conversions in variant
  controlRate: number // Control conversion rate
  variantRate: number // Variant conversion rate
  relativeUplift: number // Percentage change
  confidence: number // Statistical confidence level (e.g., 0.95)
  pValue: number // Statistical p-value
  isSignificant: boolean // Whether result is statistically significant
  savedAt: Date
}

// ========== Feed Types ==========

/**
 * Base interface for all feed items
 */
export interface FeedItem {
  id: string
  title: string
  url: string
  description?: string
  timestamp: number // Unix timestamp
  source: FeedSource
}

/**
 * Supported feed sources
 */
export type FeedSource = "product-hunt" | "hacker-news" | "jira" | "rss"

/**
 * Product Hunt specific feed item
 */
export interface ProductHuntItem extends FeedItem {
  source: "product-hunt"
  votesCount: number
  commentsCount: number
  tagline: string
  topics: string[]
  hunters: string[]
  makers: string[]
  thumbnail?: string
  featured: boolean
}

/**
 * Hacker News specific feed item
 */
export interface HackerNewsItem extends FeedItem {
  source: "hacker-news"
  points: number
  commentsCount: number
  author: string
  type: "story" | "job" | "poll" | "ask" | "show"
}

/**
 * Jira ticket feed item
 */
export interface JiraTicket extends FeedItem {
  source: "jira"
  key: string // e.g., "PROJ-123"
  status: string // e.g., "In Progress", "Done"
  priority: "Highest" | "High" | "Medium" | "Low" | "Lowest"
  assignee?: string
  reporter: string
  projectKey: string
  issueType: "Bug" | "Story" | "Task" | "Epic"
  labels: string[]
  dueDate?: Date
}

/**
 * RSS feed item
 */
export interface RssFeedItem extends FeedItem {
  source: "rss"
  author?: string
  categories: string[]
  feedUrl: string
  feedTitle: string
}

// ========== Widget Types ==========

/**
 * Widget configuration for dashboard layout
 */
export interface WidgetConfig {
  id: string
  type: WidgetType
  position: Position
  size: Size
  visible: boolean
  title?: string // Custom widget title
  settings?: Record<string, unknown> // Widget-specific settings
}

/**
 * Available widget types
 */
export type WidgetType =
  | "rice-calculator"
  | "tam-calculator"
  | "roi-calculator"
  | "ab-test-calculator"
  | "product-hunt-feed"
  | "hacker-news-feed"
  | "jira-feed"
  | "rss-feed"
  | "custom"

/**
 * Widget position on dashboard grid
 */
export interface Position {
  x: number // Grid column
  y: number // Grid row
}

/**
 * Widget size in grid units
 */
export interface Size {
  width: number // Grid columns
  height: number // Grid rows
}

// ========== User & Settings Types ==========

/**
 * User preferences and settings
 */
export interface UserSettings {
  // General
  refreshInterval: number // Minutes between feed refreshes
  theme: "light" | "dark"

  // Feed toggles
  productHuntEnabled: boolean
  hackerNewsEnabled: boolean
  jiraEnabled: boolean
  rssEnabled?: boolean

  // API configurations
  apiKeys?: ApiKeys

  // Display preferences
  compactMode?: boolean
  showNotifications?: boolean
  defaultNewTab?: boolean
}

/**
 * API key storage
 */
export interface ApiKeys {
  productHunt?: string
  jira?: {
    domain: string // e.g., "company.atlassian.net"
    email: string
    apiToken: string
  }
  github?: string
  custom?: Record<string, string>
}

// ========== Utility Types ==========

/**
 * Generic result type for operations
 */
export interface Result<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Pagination info for feeds
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

/**
 * Feed metadata
 */
export interface FeedMetadata {
  source: FeedSource
  lastUpdated: number
  itemCount: number
  error?: string
}

// ========== Type Guards ==========

/**
 * Check if an item is a Product Hunt item
 */
export function isProductHuntItem(item: FeedItem): item is ProductHuntItem {
  return item.source === "product-hunt"
}

/**
 * Check if an item is a Hacker News item
 */
export function isHackerNewsItem(item: FeedItem): item is HackerNewsItem {
  return item.source === "hacker-news"
}

/**
 * Check if an item is a Jira ticket
 */
export function isJiraTicket(item: FeedItem): item is JiraTicket {
  return item.source === "jira"
}

/**
 * Check if a widget type is a calculator
 */
export function isCalculatorWidget(type: WidgetType): boolean {
  return type.endsWith("-calculator")
}

/**
 * Check if a widget type is a feed
 */
export function isFeedWidget(type: WidgetType): boolean {
  return type.endsWith("-feed")
}

// ========== Constants ==========

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  refreshInterval: 15,
  theme: "light",
  productHuntEnabled: true,
  hackerNewsEnabled: true,
  jiraEnabled: false,
  compactMode: false,
  showNotifications: true,
  defaultNewTab: true,
}

/**
 * Impact values for RICE scoring
 */
export const RICE_IMPACT_VALUES = {
  MINIMAL: 0.25,
  LOW: 0.5,
  MEDIUM: 1,
  HIGH: 2,
  MASSIVE: 3,
} as const

/**
 * Default widget sizes
 */
export const DEFAULT_WIDGET_SIZES: Record<WidgetType, Size> = {
  "rice-calculator": { width: 2, height: 2 },
  "tam-calculator": { width: 2, height: 2 },
  "roi-calculator": { width: 2, height: 2 },
  "ab-test-calculator": { width: 2, height: 2 },
  "product-hunt-feed": { width: 2, height: 3 },
  "hacker-news-feed": { width: 2, height: 3 },
  "jira-feed": { width: 3, height: 3 },
  "rss-feed": { width: 2, height: 3 },
  custom: { width: 2, height: 2 },
}
