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
  reach: number // 1-10 scale (1: <100 users, 10: 10000+ users)
  impact: number // 1-10 scale (1: minimal, 10: massive)
  confidence: number // 0-100% as decimal (0-1)
  effort: number // 1-10 scale (1: days, 10: 3+ months)
  score: number // Calculated: (reach * impact * confidence) / effort
  savedAt: Date
  notes?: string
  migratedAt?: number // Timestamp when migrated to new scale
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
 * A/B Test Statistical Significance Calculator - Comprehensive Types
 */

/**
 * Test types supported
 */
export type TestType = "ab" | "abn" | "multivariate"

/**
 * Metric types for testing
 */
export type MetricType = "conversion" | "revenue" | "engagement" | "retention" | "custom"

/**
 * Statistical methods available
 */
export type StatisticalMethod = "frequentist" | "bayesian" | "sequential" | "mab"

/**
 * Test direction
 */
export type TestDirection = "one-tailed" | "two-tailed"

/**
 * Sequential testing methods
 */
export type SequentialMethod = "AGILE" | "mSPRT"

/**
 * Multi-armed bandit algorithms
 */
export type MABAlgorithm = "thompson" | "ucb" | "epsilon-greedy" | "contextual"

/**
 * Multiple testing correction methods
 */
export type CorrectionMethod = "bonferroni" | "fdr" | "holm" | "none"

/**
 * Test variation data
 */
export interface Variation {
  id: string
  name: string
  visitors: number
  conversions: number
  revenue?: number
  engagement?: number
  customMetrics?: Record<string, number>
}

/**
 * Test configuration
 */
export interface TestConfig {
  testType: TestType
  metric: MetricType
  statisticalMethod: StatisticalMethod
  confidenceLevel: 90 | 95 | 99
  testDirection: TestDirection
  minimumEffect: number // Minimum detectable effect (%)
  trafficAllocation: Record<string, number> // Variation ID -> percentage
  correctionMethod?: CorrectionMethod
}

/**
 * Bayesian configuration
 */
export interface BayesianConfig {
  priorAlpha?: number // Beta prior alpha
  priorBeta?: number // Beta prior beta
  credibleLevel: number // Credible interval level (e.g., 95)
  priorType?: "uniform" | "informative"
}

/**
 * Sequential testing configuration
 */
export interface SequentialConfig {
  method: SequentialMethod
  alpha: number // Type I error rate
  beta: number // Type II error rate
  maxSampleSize?: number
  tau?: number // For mSPRT
}

/**
 * MAB configuration
 */
export interface MABConfig {
  algorithm: MABAlgorithm
  explorationRate?: number // For epsilon-greedy, UCB
  contextFeatures?: string[] // For contextual bandits
}

/**
 * Test metadata
 */
export interface TestMetadata {
  name: string
  hypothesis: string
  owner: string
  stakeholders: string[]
  startDate?: Date
  endDate?: Date
  tags: string[]
  businessImpact: {
    metric: string
    estimatedValue: number
    confidence: "low" | "medium" | "high"
  }
}

/**
 * Test result for a single method
 */
export interface TestResult {
  method: StatisticalMethod
  pValue?: number // For frequentist
  isSignificant: boolean
  confidenceInterval?: [number, number]
  credibleInterval?: [number, number] // For Bayesian
  posteriorDistribution?: number[] // For Bayesian
  uplift: number // Relative improvement
  absoluteUplift?: number // Absolute improvement
  effectSize: number // Cohen's d or similar
  power: number // Statistical power achieved
  stoppingBoundaries?: { upper: number; lower: number } // For sequential
  shouldStop?: boolean // For sequential/MAB
  multipleTestingAdjusted?: boolean
  winner?: string // Variation ID
  probabilityBest?: Record<string, number> // For Bayesian/MAB
}

/**
 * Bayesian-specific results
 */
export interface BayesianResult {
  variation: string
  posteriorMean: number
  posteriorMedian?: number
  credibleInterval: [number, number]
  posteriorSamples: number[]
  probabilityBest: number
  expectedLoss?: number
  valueRemaining?: number // For optimal stopping
}

/**
 * Sequential testing state
 */
export interface SequentialState {
  currentSample: number
  testStatistic: number
  boundaries: { upper: number; lower: number }
  alphaSoFar: number
  shouldContinue: boolean
  expectedSamplesRemaining?: number
}

/**
 * MAB state
 */
export interface MABState {
  successes: Record<string, number>
  failures: Record<string, number>
  totalPulls: Record<string, number>
  lastRecommendation?: string
  regret?: number
}

/**
 * MAB result
 */
export interface MABResult {
  recommendedVariation: string
  allocationProbabilities: Record<string, number>
  expectedRegret: number
  confidenceBounds?: Record<string, [number, number]>
}

/**
 * Sample size calculation inputs
 */
export interface SampleSizeInputs {
  method: StatisticalMethod
  metric: {
    type: "binary" | "continuous"
    baseline: number
    variance?: number // For continuous metrics
  }
  effect: {
    type: "absolute" | "relative"
    value: number
    practicalSignificance?: number
  }
  statisticalParams: {
    confidenceLevel: number
    power: number
    testDirection: TestDirection
    multipleComparisons?: number
  }
  traffic: {
    daily: number
    allocation: Record<string, number>
    seasonality?: SeasonalityPattern
    constraints?: {
      maxDuration: number
      maxBudget: number
      costPerSample: number
    }
  }
}

/**
 * Seasonality pattern for traffic
 */
export interface SeasonalityPattern {
  dayOfWeek: number[] // 7 values representing multipliers
  monthly: number[] // 12 values for months
  holidays: { date: string; impact: number }[]
}

/**
 * Sample size result
 */
export interface SampleSizeResult {
  perVariation: Record<string, number>
  total: number
  powerAchieved: number
  duration: {
    days: number
    weeks: number
    confidenceInterval: [number, number]
  }
  cost?: {
    total: number
    perVariation: Record<string, number>
  }
  notes: string[]
}

/**
 * Time series data for visualization
 */
export interface TimeSeriesData {
  date: Date
  variations: Record<
    string,
    {
      visitors: number
      conversions: number
      rate: number
      cumulative: {
        visitors: number
        conversions: number
        rate: number
      }
    }
  >
  pValues?: Record<string, number>
  significance?: Record<string, boolean>
}

/**
 * Segment analysis data
 */
export interface SegmentAnalysis {
  segmentName: string
  data: Record<
    string,
    {
      visitors: number
      conversions: number
      rate: number
      uplift?: number
      significance?: boolean
    }
  >
}

/**
 * Test template
 */
export interface TestTemplate {
  id: string
  name: string
  category: string
  description: string
  defaultConfig: Partial<TestConfig>
  hypothesis: {
    template: string
    examples: string[]
  }
  benchmarks: {
    baselineConversion: { min: number; avg: number; max: number }
    typicalUplift: { min: number; avg: number; max: number }
    testDuration: { min: number; avg: number; max: number } // days
  }
  checklist: string[]
}

/**
 * Complete A/B test data
 */
export interface AbTest {
  id: string
  config: TestConfig
  metadata: TestMetadata
  variations: Variation[]
  results?: TestResult[]
  bayesianResults?: BayesianResult[]
  sequentialState?: SequentialState
  mabState?: MABState
  timeSeriesData?: TimeSeriesData[]
  segmentAnalysis?: SegmentAnalysis[]
  savedAt: Date
  completedAt?: Date
  status: "planning" | "running" | "completed" | "stopped"
}

/**
 * Saved test for history
 */
export interface SavedTest extends AbTest {
  notes?: string
  learnings?: string[]
  decisions?: {
    action: string
    rationale: string
    implementedAt?: Date
  }
}

/**
 * Power analysis data point
 */
export interface PowerCurvePoint {
  sampleSize: number
  power: number
  effectSize: number
}

/**
 * Sensitivity analysis variable
 */
export interface SensitivityVariable {
  name: string
  baseValue: number
  minValue: number
  maxValue: number
  step: number
  impact: "costs" | "benefits" | "both"
}

/**
 * Export options
 */
export interface ExportOptions {
  format: "csv" | "json" | "pdf" | "pptx"
  includeRawData?: boolean
  includeCharts?: boolean
  branding?: {
    logo?: string
    colors?: Record<string, string>
    companyName?: string
  }
  sections?: string[] // Which sections to include
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
 * Widget view modes
 */
export type WidgetViewMode = "compact" | "full"

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
  viewMode?: WidgetViewMode // Current view mode
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
 * RICE scale ranges for better UX guidance
 */
export const RICE_SCALE_RANGES = {
  reach: {
    min: 1,
    max: 10,
    labels: {
      1: "Very Small (<10 users)",
      2: "Small (10-50 users)",
      3: "Small-Medium (50-100 users)",
      4: "Medium (100-500 users)",
      5: "Medium (500-1K users)",
      6: "Medium-Large (1K-2.5K users)",
      7: "Large (2.5K-5K users)",
      8: "Large (5K-10K users)",
      9: "Very Large (10K-50K users)",
      10: "Massive (50K+ users)",
    },
  },
  impact: {
    min: 1,
    max: 10,
    labels: {
      1: "Minimal impact",
      2: "Very low impact",
      3: "Low impact",
      4: "Low-medium impact",
      5: "Medium impact",
      6: "Medium-high impact",
      7: "High impact",
      8: "Very high impact",
      9: "Critical impact",
      10: "Massive impact",
    },
  },
  effort: {
    min: 1,
    max: 10,
    labels: {
      1: "Few hours",
      2: "1-2 days",
      3: "3-5 days",
      4: "1-2 weeks",
      5: "2-4 weeks",
      6: "1-2 months",
      7: "2-3 months",
      8: "3-4 months",
      9: "4-6 months",
      10: "6+ months",
    },
  },
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
