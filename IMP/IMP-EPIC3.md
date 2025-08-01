# Epic 3: PM Calculators

## Epic Overview
Implement a comprehensive suite of Product Management calculators as widgets for the dashboard. These calculators help PMs make data-driven decisions about prioritization, market sizing, ROI analysis, and A/B testing. Each calculator includes input validation, real-time calculations, visualization, and history tracking.

**Epic Goals:**
- Build four core PM calculators (RICE, TAM/SAM/SOM, ROI, A/B Test)
- Create reusable calculation components and utilities
- Implement data visualization for results
- Add save/export functionality for calculations
- Ensure responsive design for all screen sizes

**Total Story Points:** 42 SP  
**Total Stories:** 4  
**Total Tickets:** 33  

---

## Story 3.1: RICE Score Calculator ✅ COMPLETED
**Description:** Build a RICE (Reach, Impact, Confidence, Effort) score calculator to help PMs prioritize features and initiatives based on quantitative scoring.

**Acceptance Criteria:**
- ✅ Calculator accepts valid inputs for all RICE components
- ✅ Real-time score calculation as user types
- ✅ Visual representation of score breakdown
- ✅ Ability to save and compare multiple calculations
- ✅ Export results to CSV/PDF

**Implementation Summary:**
- Created a modern, visually appealing RICE calculator with advanced features
- Implemented comprehensive input validation with real-time feedback
- Added beautiful visualizations using Recharts (gauge chart, bar charts)
- Built a full-featured history modal with search, sort, and bulk actions
- Enabled export to CSV, JSON, and PDF formats
- Integrated smooth animations with Framer Motion

### Tickets:

#### Ticket 3.1.1: Create RiceCalculator Component Structure ✅
- **Description:** Build the main RiceCalculator.tsx widget component with form layout
- **Story Points:** 1 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Create widget following BaseWidget pattern
  - Setup form with four input fields
  - Add labels and helper text for each field
  - Implement responsive grid layout
  - Include widget header with actions
- **Dependencies:** Epic 2 completion (BaseWidget)
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/RiceCalculator.tsx
  import { BaseWidget } from "~/components/widgets/BaseWidget"
  import { useStorage } from "@plasmohq/storage/hook"
  import { RiceScore } from "~/types"
  
  export function RiceCalculator() {
    const [calculations, setCalculations] = useStorage<RiceScore[]>("rice-history", [])
    const [currentCalc, setCurrentCalc] = useState<Partial<RiceScore>>({
      reach: 0,
      impact: 0,
      confidence: 0,
      effort: 1
    })
    
    return (
      <BaseWidget
        title="RICE Score Calculator"
        icon={<CalculatorIcon />}
        onRefresh={loadRecentCalculations}
      >
        {() => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Reach"
                type="number"
                value={currentCalc.reach}
                onChange={(e) => updateField('reach', e.target.value)}
                helperText="# of users in first quarter"
              />
              <Input
                label="Impact"
                type="number"
                min="0.25"
                max="3"
                step="0.25"
                value={currentCalc.impact}
                onChange={(e) => updateField('impact', e.target.value)}
                helperText="0.25=Minimal, 3=Massive"
              />
              <Input
                label="Confidence"
                type="number"
                min="0"
                max="100"
                value={currentCalc.confidence}
                onChange={(e) => updateField('confidence', e.target.value)}
                helperText="Percentage (0-100%)"
              />
              <Input
                label="Effort"
                type="number"
                min="0.5"
                step="0.5"
                value={currentCalc.effort}
                onChange={(e) => updateField('effort', e.target.value)}
                helperText="Person-months"
              />
            </div>
            <RiceScoreDisplay score={calculateScore(currentCalc)} />
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 3.1.2: Implement RICE Calculation Logic ✅
- **Description:** Create the calculation function and handle edge cases
- **Story Points:** 1 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Implement formula: (Reach × Impact × Confidence) / Effort
  - Handle confidence as percentage (divide by 100)
  - Validate all inputs are positive numbers
  - Handle division by zero for effort
  - Round score to 2 decimal places
- **Dependencies:** 3.1.1
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/rice.ts
  export function calculateRiceScore(params: {
    reach: number
    impact: number
    confidence: number
    effort: number
  }): number {
    const { reach, impact, confidence, effort } = params
    
    // Validate inputs
    if (reach < 0 || impact < 0 || confidence < 0 || effort <= 0) {
      throw new Error("Invalid input values")
    }
    
    // Confidence is entered as percentage, convert to decimal
    const confidenceDecimal = confidence / 100
    
    // Calculate RICE score
    const score = (reach * impact * confidenceDecimal) / effort
    
    return Math.round(score * 100) / 100
  }
  
  export function getRiceScoreCategory(score: number): {
    label: string
    color: string
    priority: number
  } {
    if (score >= 100) return { label: "Must Do", color: "green", priority: 1 }
    if (score >= 50) return { label: "Should Do", color: "yellow", priority: 2 }
    if (score >= 20) return { label: "Could Do", color: "orange", priority: 3 }
    return { label: "Won't Do", color: "red", priority: 4 }
  }
  ```

#### Ticket 3.1.3: Add Input Validation and Error Handling ✅
- **Description:** Implement comprehensive validation for all RICE inputs
- **Story Points:** 1 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Validate reach is positive integer
  - Validate impact is between 0.25 and 3
  - Validate confidence is between 0 and 100
  - Validate effort is positive number >= 0.5
  - Show inline error messages
  - Disable calculate button if invalid
- **Dependencies:** 3.1.2
- **Implementation Notes:**
  ```typescript
  // src/hooks/useRiceValidation.ts
  interface ValidationError {
    field: keyof RiceScore
    message: string
  }
  
  export function useRiceValidation(values: Partial<RiceScore>) {
    const errors = useMemo<ValidationError[]>(() => {
      const errs: ValidationError[] = []
      
      if (!values.reach || values.reach < 0) {
        errs.push({ field: 'reach', message: 'Reach must be positive' })
      }
      
      if (values.impact && (values.impact < 0.25 || values.impact > 3)) {
        errs.push({ field: 'impact', message: 'Impact must be between 0.25 and 3' })
      }
      
      if (values.confidence && (values.confidence < 0 || values.confidence > 100)) {
        errs.push({ field: 'confidence', message: 'Confidence must be 0-100%' })
      }
      
      if (values.effort && values.effort < 0.5) {
        errs.push({ field: 'effort', message: 'Effort must be at least 0.5' })
      }
      
      return errs
    }, [values])
    
    const isValid = errors.length === 0 && 
      values.reach && values.impact && 
      values.confidence !== undefined && values.effort
    
    return { errors, isValid }
  }
  ```

#### Ticket 3.1.4: Create Score Visualization ✅
- **Description:** Build visual representation of RICE score using charts
- **Story Points:** 2 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Create score gauge/meter component
  - Show score breakdown in bar chart
  - Color code based on score category
  - Animate on score change
  - Responsive design for different widget sizes
- **Dependencies:** 3.1.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/rice/RiceScoreDisplay.tsx
  import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
  import { Doughnut } from 'react-chartjs-2'
  
  interface RiceScoreDisplayProps {
    score: number
    breakdown?: {
      reach: number
      impact: number
      confidence: number
      effort: number
    }
  }
  
  export function RiceScoreDisplay({ score, breakdown }: RiceScoreDisplayProps) {
    const category = getRiceScoreCategory(score)
    
    const gaugeData = {
      datasets: [{
        data: [score, Math.max(0, 200 - score)],
        backgroundColor: [category.color, '#e5e7eb'],
        borderWidth: 0
      }]
    }
    
    return (
      <div className="rice-score-display">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold" style={{ color: category.color }}>
            {score}
          </div>
          <div className="text-sm text-gray-600">{category.label}</div>
        </div>
        
        <div className="h-32">
          <Doughnut 
            data={gaugeData}
            options={{
              rotation: -90,
              circumference: 180,
              cutout: '75%',
              plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
              }
            }}
          />
        </div>
        
        {breakdown && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>Reach: {breakdown.reach}</div>
            <div>Impact: {breakdown.impact}</div>
            <div>Confidence: {breakdown.confidence}%</div>
            <div>Effort: {breakdown.effort}</div>
          </div>
        )}
      </div>
    )
  }
  ```

#### Ticket 3.1.5: Add Save and Export Functionality ✅
- **Description:** Allow users to save calculations and export results
- **Story Points:** 1 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Save calculation with timestamp and optional name
  - Store in chrome.storage.local
  - Export single or multiple calculations to CSV
  - Generate PDF report with charts
  - Limit history to last 100 calculations
- **Dependencies:** 3.1.4
- **Implementation Notes:**
  ```typescript
  // src/lib/export/riceExport.ts
  export function exportRiceToCSV(calculations: RiceScore[]): void {
    const headers = ['Date', 'Name', 'Reach', 'Impact', 'Confidence', 'Effort', 'Score']
    const rows = calculations.map(calc => [
      new Date(calc.savedAt).toLocaleDateString(),
      calc.name || 'Unnamed',
      calc.reach,
      calc.impact,
      calc.confidence,
      calc.effort,
      calc.score
    ])
    
    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    downloadFile(csv, 'rice-calculations.csv', 'text/csv')
  }
  
  export async function exportRiceToPDF(calculation: RiceScore): Promise<void> {
    // Use jsPDF or similar library
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('RICE Score Report', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Score: ${calculation.score}`, 20, 40)
    doc.text(`Category: ${getRiceScoreCategory(calculation.score).label}`, 20, 50)
    
    // Add chart image
    const chartCanvas = await generateChartImage(calculation)
    doc.addImage(chartCanvas, 'PNG', 20, 60, 160, 80)
    
    doc.save(`rice-score-${Date.now()}.pdf`)
  }
  ```

---

## Story 3.2: TAM/SAM/SOM Calculator ✅ COMPLETED
**Description:** Build a market sizing calculator that helps PMs estimate Total Addressable Market, Serviceable Addressable Market, and Serviceable Obtainable Market.

**Acceptance Criteria:**
- ✅ Support both top-down and bottom-up calculations with industry-specific templates
- ✅ Visual funnel showing market segments with interactive features
- ✅ Percentage-based calculations with bidirectional sync
- ⏳ Comparison mode for multiple scenarios (up to 5) with sensitivity analysis (partial)
- ⏳ Market growth projections over 1-5 year periods (partial)
- ✅ Multi-currency support with real-time conversion
- ✅ Save/load calculations with history tracking
- ✅ Export results to CSV/PDF formats
- ✅ Industry benchmarks and contextual help
- ✅ Comprehensive input validation

**Implementation Summary:**
- Created a comprehensive TAM/SAM/SOM calculator with both top-down and bottom-up methods
- Implemented smart percentage sliders with bidirectional sync and industry benchmarks
- Added interactive market funnel visualization with SVG
- Built multi-currency support (USD, EUR, GBP, JPY, INR) with proper formatting
- Created history modal with search, sort, and load functionality
- Enabled export to CSV, JSON, and HTML formats
- Added market parameter controls (time period, maturity, geography)
- Implemented segment-based bottom-up calculations with competitive factors

**Note:** Advanced features like scenario comparison and growth projections were partially implemented due to scope. These can be completed in a future iteration.

### Tickets:

#### Ticket 3.2.1: Build TamCalculator Component ✅
- **Description:** Create the main TAM/SAM/SOM calculator widget structure with comprehensive features
- **Story Points:** 2 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Create widget following BaseWidget pattern properly
  - Implement tabbed interface (top-down/bottom-up) with smooth transitions
  - Add input fields for each market segment with proper labels
  - Support both absolute values and percentages with bidirectional sync
  - Include market definition helper text and tooltips
  - Multi-currency support with currency selector
  - Market name/description field for context
  - Responsive layout for different screen sizes
  - Loading states for async operations
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/TamCalculator.tsx
  import { BaseWidget } from "~/components/widgets/BaseWidget"
  import { useStorage } from "@plasmohq/storage/hook"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common/Tabs"
  import { Input } from "~/components/common/Input"
  import { Select } from "~/components/common/Select"
  import type { TamCalculation, Currency } from "~/types"

  interface TamCalculatorProps {
    widgetId: string
    widgetConfig?: Record<string, unknown>
  }

  export default function TamCalculator({ widgetId, widgetConfig }: TamCalculatorProps) {
    const [calculations, setCalculations] = useStorage<TamCalculation[]>("tam-history", [])
    const [method, setMethod] = useState<'topDown' | 'bottomUp'>('topDown')
    const [currency, setCurrency] = useState<Currency>('USD')
    const [marketName, setMarketName] = useState('')
    
    const [values, setValues] = useState({
      // Common fields
      marketDescription: '',
      currency: 'USD',
      
      // Top-down fields
      tam: 0,
      samPercentage: 10,
      somPercentage: 1,
      
      // Bottom-up fields
      targetSegments: [],
      avgPricePerUser: 0,
      marketPenetration: 5,
      conversionRate: 2,
      
      // Growth projections
      annualGrowthRate: 10,
      projectionYears: 3
    })
    
    return (
      <BaseWidget
        widgetId={widgetId}
        title="TAM/SAM/SOM Calculator"
        data={values}
        settings={widgetConfig}
        onSettings={widgetConfig?.onSettings as () => void}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      >
        {(data) => (
          <div className="p-6 space-y-6">
            {/* Market Context */}
            <div className="space-y-4">
              <Input
                label="Market Name"
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                placeholder="e.g., Global CRM Software Market"
                helperText="Give your market analysis a descriptive name"
              />
              
              <div className="flex gap-4">
                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-32"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="INR">INR (₹)</option>
                </Select>
              </div>
            </div>
            
            {/* Calculation Method Tabs */}
            <Tabs value={method} onValueChange={setMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="topDown">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Top-Down
                  </div>
                </TabsTrigger>
                <TabsTrigger value="bottomUp">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Bottom-Up
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="topDown" className="mt-4">
                <TopDownCalculator 
                  values={values}
                  onChange={setValues}
                  currency={currency}
                />
              </TabsContent>
              
              <TabsContent value="bottomUp" className="mt-4">
                <BottomUpCalculator
                  values={values}
                  onChange={setValues}
                  currency={currency}
                />
              </TabsContent>
            </Tabs>
            
            {/* Market Funnel Visualization */}
            <MarketFunnel 
              values={calculateMarkets(values, method)} 
              currency={currency}
              interactive={true}
            />
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSave}>Save Calculation</Button>
              <Button variant="secondary" onClick={handleReset}>Reset</Button>
              <Button variant="ghost" onClick={() => setShowHistory(true)}>
                History ({calculations.length})
              </Button>
            </div>
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 3.2.2: Implement Market Sizing Calculations ✅
- **Description:** Create sophisticated calculation logic for both top-down and bottom-up approaches
- **Story Points:** 2 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Top-down: TAM → SAM (% of TAM) → SOM (% of SAM) with validation
  - Bottom-up: Segment-based calculations with multiple factors
  - Handle multi-currency formatting with conversion
  - Support different time periods (monthly/quarterly/annual)
  - Validate all inputs (percentages 0-100, ensure SAM < TAM, SOM < SAM)
  - Geographic market adjustments
  - Market maturity factors
  - Competitive landscape considerations
- **Dependencies:** 3.2.1
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/tam.ts
  export interface MarketSegment {
    name: string
    users: number
    avgPrice: number
    growthRate: number
    penetrationRate: number
  }

  export interface MarketSizes {
    tam: number
    sam: number
    som: number
    method: 'topDown' | 'bottomUp'
    segments?: MarketSegment[]
    assumptions: string[]
    confidence: number // 0-100
  }
  
  export interface MarketCalculationParams {
    currency: Currency
    timePeriod: 'monthly' | 'quarterly' | 'annual'
    geographicScope: 'global' | 'regional' | 'country'
    marketMaturity: 'emerging' | 'growing' | 'mature' | 'declining'
  }
  
  export function calculateTopDown(params: {
    tam: number
    samPercentage: number
    somPercentage: number
    marketParams: MarketCalculationParams
  }): MarketSizes {
    const { tam, samPercentage, somPercentage, marketParams } = params
    
    // Validate inputs
    if (samPercentage > 100 || somPercentage > 100) {
      throw new Error('Percentages cannot exceed 100%')
    }
    
    const sam = tam * (samPercentage / 100)
    const som = sam * (somPercentage / 100)
    
    // Validate logical consistency
    if (sam > tam) {
      throw new Error('SAM cannot exceed TAM')
    }
    if (som > sam) {
      throw new Error('SOM cannot exceed SAM')
    }
    
    // Adjust for time period
    const periodAdjustedSizes = adjustForTimePeriod(
      { tam, sam, som },
      marketParams.timePeriod
    )
    
    return {
      ...periodAdjustedSizes,
      method: 'topDown',
      assumptions: [
        `Market defined as ${marketParams.geographicScope} scope`,
        `${marketParams.marketMaturity} market maturity level`,
        `SAM represents ${samPercentage}% of total market`,
        `SOM represents ${somPercentage}% of serviceable market`
      ],
      confidence: calculateConfidence(marketParams)
    }
  }
  
  export function calculateBottomUp(params: {
    segments: MarketSegment[]
    marketParams: MarketCalculationParams
    competitorCount: number
    marketShareTarget: number
  }): MarketSizes {
    const { segments, marketParams, competitorCount, marketShareTarget } = params
    
    // Calculate TAM from all segments
    const tam = segments.reduce((total, segment) => {
      const segmentValue = segment.users * segment.avgPrice
      const growthAdjusted = segmentValue * (1 + segment.growthRate / 100)
      return total + growthAdjusted
    }, 0)
    
    // Calculate SAM based on addressable segments
    const sam = segments.reduce((total, segment) => {
      const segmentValue = segment.users * segment.avgPrice
      const addressable = segmentValue * (segment.penetrationRate / 100)
      return total + addressable
    }, 0)
    
    // Calculate SOM based on realistic market share
    const competitiveAdjustment = 1 / (competitorCount + 1) // Simple competitive factor
    const som = sam * (marketShareTarget / 100) * competitiveAdjustment
    
    // Apply market maturity adjustments
    const maturityMultiplier = getMaturityMultiplier(marketParams.marketMaturity)
    
    return {
      tam: tam * maturityMultiplier,
      sam: sam * maturityMultiplier,
      som: som * maturityMultiplier,
      method: 'bottomUp',
      segments,
      assumptions: [
        `${segments.length} market segments analyzed`,
        `Average penetration rate: ${calculateAvgPenetration(segments).toFixed(1)}%`,
        `${competitorCount} major competitors considered`,
        `Target market share: ${marketShareTarget}%`,
        `Market maturity factor: ${maturityMultiplier}x`
      ],
      confidence: calculateConfidence(marketParams, segments)
    }
  }
  
  function getMaturityMultiplier(maturity: string): number {
    const multipliers = {
      emerging: 1.3,    // High growth potential
      growing: 1.1,     // Moderate growth
      mature: 1.0,      // Stable
      declining: 0.9    // Contracting market
    }
    return multipliers[maturity] || 1.0
  }
  
  function adjustForTimePeriod(
    sizes: { tam: number; sam: number; som: number },
    period: string
  ): { tam: number; sam: number; som: number } {
    const dividers = {
      monthly: 12,
      quarterly: 4,
      annual: 1
    }
    const divider = dividers[period] || 1
    
    return {
      tam: sizes.tam / divider,
      sam: sizes.sam / divider,
      som: sizes.som / divider
    }
  }
  
  export function formatCurrency(
    value: number,
    currency: Currency = 'USD',
    abbreviated = true
  ): string {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      INR: '₹'
    }
    
    const symbol = symbols[currency] || '$'
    
    if (abbreviated) {
      if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(1)}T`
      if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(1)}B`
      if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(1)}M`
      if (value >= 1e3) return `${symbol}${(value / 1e3).toFixed(1)}K`
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  export function validateMarketSizes(sizes: MarketSizes): string[] {
    const errors: string[] = []
    
    if (sizes.tam <= 0) errors.push('TAM must be greater than 0')
    if (sizes.sam > sizes.tam) errors.push('SAM cannot exceed TAM')
    if (sizes.som > sizes.sam) errors.push('SOM cannot exceed SAM')
    if (sizes.som < 0) errors.push('SOM cannot be negative')
    
    return errors
  }
  ```

#### Ticket 3.2.3: Add Percentage-Based Calculations with Industry Benchmarks ✅
- **Description:** Implement advanced percentage sliders with bidirectional sync and industry benchmarks
- **Story Points:** 2 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Create smart percentage slider components with tooltips
  - Show real-time calculation updates
  - Bidirectional sync: update percentages when absolute values change
  - Industry-specific benchmark data
  - Visual indicators for typical ranges
  - Input validation to ensure logical consistency
  - Contextual help explaining what each percentage means
- **Dependencies:** 3.2.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/tam/PercentageSlider.tsx
  import { Tooltip } from "~/components/common/Tooltip"
  import { formatCurrency } from "~/lib/calculators/tam"
  
  interface IndustryBenchmark {
    label: string
    value: number
    description: string
    industries: string[]
  }

  interface PercentageSliderProps {
    label: string
    value: number
    onChange: (value: number) => void
    baseValue?: number
    absoluteValue?: number
    onAbsoluteChange?: (value: number) => void
    benchmarks?: IndustryBenchmark[]
    helpText?: string
    min?: number
    max?: number
    showTypicalRange?: boolean
    industry?: string
  }
  
  // Industry benchmark data
  export const SAM_BENCHMARKS: IndustryBenchmark[] = [
    { 
      label: "B2B SaaS", 
      value: 10, 
      description: "Typical for specialized B2B software",
      industries: ["saas", "b2b", "software"]
    },
    { 
      label: "Consumer App", 
      value: 25, 
      description: "Broader reach for consumer products",
      industries: ["consumer", "mobile", "app"]
    },
    { 
      label: "Enterprise", 
      value: 5, 
      description: "Focused on large enterprise customers",
      industries: ["enterprise", "b2b"]
    },
    { 
      label: "Marketplace", 
      value: 15, 
      description: "Two-sided marketplace platforms",
      industries: ["marketplace", "platform"]
    }
  ]
  
  export const SOM_BENCHMARKS: IndustryBenchmark[] = [
    { 
      label: "New Entrant", 
      value: 1, 
      description: "Realistic for new market entrant",
      industries: ["all"]
    },
    { 
      label: "Growing Startup", 
      value: 5, 
      description: "Established startup with traction",
      industries: ["all"]
    },
    { 
      label: "Market Leader", 
      value: 15, 
      description: "Dominant player in the market",
      industries: ["all"]
    }
  ]
  
  export function PercentageSlider({ 
    label, 
    value, 
    onChange, 
    baseValue,
    absoluteValue,
    onAbsoluteChange,
    benchmarks,
    helpText,
    min = 0,
    max = 100,
    showTypicalRange = true,
    industry
  }: PercentageSliderProps) {
    const [isEditingAbsolute, setIsEditingAbsolute] = useState(false)
    const calculatedAbsolute = baseValue ? baseValue * (value / 100) : 0
    const displayAbsolute = absoluteValue || calculatedAbsolute
    
    // Filter benchmarks by industry if specified
    const relevantBenchmarks = benchmarks?.filter(
      b => !industry || b.industries.includes(industry) || b.industries.includes("all")
    )
    
    // Calculate typical range based on benchmarks
    const typicalRange = relevantBenchmarks && relevantBenchmarks.length > 0
      ? {
          min: Math.min(...relevantBenchmarks.map(b => b.value)),
          max: Math.max(...relevantBenchmarks.map(b => b.value))
        }
      : null
      
    const handleAbsoluteChange = (newValue: number) => {
      if (baseValue && onAbsoluteChange) {
        const newPercentage = Math.round((newValue / baseValue) * 1000) / 10
        onChange(Math.min(100, Math.max(0, newPercentage)))
        onAbsoluteChange(newValue)
      }
    }
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            {helpText && (
              <Tooltip content={helpText}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Tooltip>
            )}
          </div>
          
          <div className="text-sm text-right">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {value.toFixed(1)}%
            </div>
            {baseValue && (
              <div className="text-gray-500 dark:text-gray-400">
                {isEditingAbsolute ? (
                  <input
                    type="text"
                    value={displayAbsolute}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(/[^0-9.]/g, ''))
                      if (!isNaN(val)) handleAbsoluteChange(val)
                    }}
                    onBlur={() => setIsEditingAbsolute(false)}
                    className="w-24 px-1 py-0 text-right border-b border-gray-300"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingAbsolute(true)}
                    className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {formatCurrency(displayAbsolute)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step="0.1"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            style={{
              background: showTypicalRange && typicalRange
                ? `linear-gradient(to right, 
                    #e5e7eb 0%, 
                    #e5e7eb ${(typicalRange.min / max) * 100}%, 
                    #dbeafe ${(typicalRange.min / max) * 100}%, 
                    #dbeafe ${(typicalRange.max / max) * 100}%, 
                    #e5e7eb ${(typicalRange.max / max) * 100}%, 
                    #e5e7eb 100%)`
                : undefined
            }}
          />
          
          {showTypicalRange && typicalRange && (
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
              <span style={{ left: `${(typicalRange.min / max) * 100}%` }} className="absolute">
                {typicalRange.min}%
              </span>
              <span style={{ left: `${(typicalRange.max / max) * 100}%` }} className="absolute">
                {typicalRange.max}%
              </span>
            </div>
          )}
        </div>
        
        {relevantBenchmarks && relevantBenchmarks.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">Quick presets:</p>
            <div className="flex flex-wrap gap-2">
              {relevantBenchmarks.map(benchmark => (
                <Tooltip key={benchmark.value} content={benchmark.description}>
                  <button
                    onClick={() => onChange(benchmark.value)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                      Math.abs(value - benchmark.value) < 0.5
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {benchmark.label} ({benchmark.value}%)
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  ```

#### Ticket 3.2.4: Create Interactive Market Funnel Visualization ✅
- **Description:** Build interactive funnel diagram with multiple visualization options and export capabilities
- **Story Points:** 3 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Create funnel chart using SVG for better compatibility and interactivity
  - Clickable segments showing detailed information
  - Multiple visualization modes (funnel, pie, stacked bar)
  - Display values, percentages, and growth indicators
  - Smooth animations with Framer Motion
  - Export funnel as PNG/SVG image
  - Responsive design with mobile support
  - Accessibility features (keyboard navigation, screen reader support)
- **Dependencies:** 3.2.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/tam/MarketFunnel.tsx
  import { motion, AnimatePresence } from "framer-motion"
  import { useState, useRef } from "react"
  import { Tooltip } from "~/components/common/Tooltip"
  import { formatCurrency } from "~/lib/calculators/tam"
  import { exportToImage } from "~/lib/export/visualExport"
  
  interface MarketFunnelProps {
    values: MarketSizes
    currency: Currency
    interactive?: boolean
    showGrowth?: boolean
    visualMode?: 'funnel' | 'pie' | 'bar'
    onSegmentClick?: (segment: 'tam' | 'sam' | 'som') => void
  }
  
  interface SegmentData {
    id: 'tam' | 'sam' | 'som'
    name: string
    fullName: string
    value: number
    percentage: number
    color: string
    description: string
  }
  
  export function MarketFunnel({ 
    values, 
    currency,
    interactive = true,
    showGrowth = false,
    visualMode = 'funnel',
    onSegmentClick
  }: MarketFunnelProps) {
    const { tam, sam, som } = values
    const funnelRef = useRef<HTMLDivElement>(null)
    const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
    
    const segments: SegmentData[] = [
      { 
        id: 'tam',
        name: 'TAM',
        fullName: 'Total Addressable Market',
        value: tam,
        percentage: 100,
        color: '#3b82f6', // blue-500
        description: 'The total market demand for your product or service'
      },
      { 
        id: 'sam',
        name: 'SAM',
        fullName: 'Serviceable Addressable Market',
        value: sam,
        percentage: (sam / tam) * 100,
        color: '#10b981', // green-500
        description: 'The segment of TAM targeted by your products within reach'
      },
      { 
        id: 'som',
        name: 'SOM',
        fullName: 'Serviceable Obtainable Market',
        value: som,
        percentage: (som / tam) * 100,
        color: '#8b5cf6', // purple-500
        description: 'The portion of SAM you can realistically capture'
      }
    ]
    
    const handleSegmentClick = (segment: SegmentData) => {
      if (!interactive) return
      
      setSelectedSegment(segment.id)
      if (onSegmentClick) {
        onSegmentClick(segment.id)
      }
    }
    
    const handleExport = async (format: 'png' | 'svg') => {
      if (funnelRef.current) {
        await exportToImage(funnelRef.current, `market-funnel.${format}`, format)
      }
    }
    
    return (
      <div className="market-funnel space-y-4">
        {/* Visualization Mode Selector */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Market Size Visualization
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              {(['funnel', 'pie', 'bar'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setVisualizationMode(mode)}
                  className={`px-3 py-1 text-xs transition-colors ${
                    visualMode === mode
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleExport('png')}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Export as PNG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Funnel Visualization */}
        <div ref={funnelRef} className="bg-white dark:bg-gray-800 rounded-lg p-6">
          {visualMode === 'funnel' && (
            <svg
              viewBox="0 0 400 300"
              className="w-full h-64"
              role="img"
              aria-label="Market funnel visualization"
            >
              <defs>
                <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              <AnimatePresence>
                {segments.map((segment, index) => {
                  const y = index * 90
                  const width = (segment.value / tam) * 300
                  const x = (400 - width) / 2
                  
                  return (
                    <motion.g
                      key={segment.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onMouseEnter={() => setHoveredSegment(segment.id)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleSegmentClick(segment)}
                      className={interactive ? "cursor-pointer" : ""}
                    >
                      <motion.rect
                        x={x}
                        y={y}
                        width={width}
                        height={70}
                        fill={segment.color}
                        fillOpacity={hoveredSegment === segment.id ? 0.9 : 0.7}
                        stroke={selectedSegment === segment.id ? "#1f2937" : "none"}
                        strokeWidth={selectedSegment === segment.id ? 2 : 0}
                        rx={4}
                        animate={{
                          scale: hoveredSegment === segment.id ? 1.02 : 1
                        }}
                      />
                      
                      <text
                        x={200}
                        y={y + 25}
                        textAnchor="middle"
                        className="fill-white font-semibold text-sm"
                      >
                        {segment.name}
                      </text>
                      
                      <text
                        x={200}
                        y={y + 45}
                        textAnchor="middle"
                        className="fill-white text-xs"
                      >
                        {formatCurrency(segment.value, currency)}
                      </text>
                      
                      <text
                        x={200}
                        y={y + 60}
                        textAnchor="middle"
                        className="fill-white text-xs opacity-80"
                      >
                        {segment.percentage.toFixed(1)}%
                      </text>
                    </motion.g>
                  )
                })}
              </AnimatePresence>
            </svg>
          )}
          
          {/* Alternative visualizations (Pie, Bar) would go here */}
        </div>
        
        {/* Segment Details */}
        <AnimatePresence>
          {selectedSegment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
            >
              {(() => {
                const segment = segments.find(s => s.id === selectedSegment)
                if (!segment) return null
                
                return (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {segment.fullName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {segment.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <span className="text-xs text-gray-500">Value</span>
                        <p className="font-semibold">{formatCurrency(segment.value, currency)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Percentage of TAM</span>
                        <p className="font-semibold">{segment.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">SAM as % of TAM:</span>
            <span className="font-semibold">{((sam / tam) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">SOM as % of SAM:</span>
            <span className="font-semibold">{((som / sam) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">SOM as % of TAM:</span>
            <span className="font-semibold">{((som / tam) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Market Efficiency:</span>
            <span className="font-semibold">{calculateMarketEfficiency(tam, sam, som)}%</span>
          </div>
        </div>
      </div>
    )
  }
  
  function calculateMarketEfficiency(tam: number, sam: number, som: number): string {
    // Market efficiency = how well you convert TAM to SOM
    const efficiency = (som / tam) * 100
    if (efficiency > 10) return 'High'
    if (efficiency > 5) return 'Medium'
    return 'Low'
  }
  ```

#### Ticket 3.2.5: Implement Advanced Comparison Mode with Sensitivity Analysis
- **Description:** Allow users to compare multiple market sizing scenarios with sensitivity analysis and what-if simulations
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Support up to 5 scenarios with different calculation methods
  - Side-by-side comparative visualization
  - Sensitivity analysis with variable adjustments
  - What-if simulations with real-time updates
  - Scenario templates (Conservative, Moderate, Aggressive)
  - Save/load scenario sets
  - Export detailed comparison report
  - Monte Carlo simulation for uncertainty ranges
- **Dependencies:** 3.2.4
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/tam/ComparisonMode.tsx
  import { useState, useMemo } from "react"
  import { motion, AnimatePresence } from "framer-motion"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common/Tabs"
  import { MarketSizes, MarketCalculationParams } from "~/lib/calculators/tam"
  
  interface Scenario {
    id: string
    name: string
    description: string
    method: 'topDown' | 'bottomUp'
    values: MarketSizes
    params: MarketCalculationParams
    assumptions: string[]
    confidence: number
    lastModified: Date
  }
  
  interface SensitivityVariable {
    name: string
    baseValue: number
    minValue: number
    maxValue: number
    step: number
    impact: 'tam' | 'sam' | 'som' | 'all'
  }
  
  interface ScenarioTemplate {
    name: string
    description: string
    adjustments: {
      samPercentage: number
      somPercentage: number
      growthRate: number
      confidence: number
    }
  }
  
  const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
    {
      name: "Conservative",
      description: "Cautious estimates with lower market penetration",
      adjustments: {
        samPercentage: 5,
        somPercentage: 0.5,
        growthRate: 5,
        confidence: 60
      }
    },
    {
      name: "Moderate",
      description: "Balanced estimates based on industry averages",
      adjustments: {
        samPercentage: 10,
        somPercentage: 2,
        growthRate: 15,
        confidence: 75
      }
    },
    {
      name: "Aggressive",
      description: "Optimistic estimates with high growth assumptions",
      adjustments: {
        samPercentage: 20,
        somPercentage: 5,
        growthRate: 30,
        confidence: 50
      }
    }
  ]
  
  export function ComparisonMode({ 
    baseCalculation,
    currency 
  }: { 
    baseCalculation: MarketSizes
    currency: Currency 
  }) {
    const [scenarios, setScenarios] = useState<Scenario[]>([])
    const [activeTab, setActiveTab] = useState<'scenarios' | 'sensitivity' | 'simulation'>('scenarios')
    const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set())
    const [sensitivityVars, setSensitivityVars] = useState<SensitivityVariable[]>([
      {
        name: "Market Growth Rate",
        baseValue: 15,
        minValue: -10,
        maxValue: 50,
        step: 5,
        impact: 'tam'
      },
      {
        name: "Market Penetration",
        baseValue: 10,
        minValue: 1,
        maxValue: 30,
        step: 1,
        impact: 'sam'
      },
      {
        name: "Competitive Factor",
        baseValue: 1,
        minValue: 0.5,
        maxValue: 3,
        step: 0.1,
        impact: 'som'
      }
    ])
    
    const addScenario = (template?: ScenarioTemplate) => {
      if (scenarios.length >= 5) {
        alert("Maximum 5 scenarios allowed")
        return
      }
      
      const newScenario: Scenario = {
        id: generateId(),
        name: template?.name || `Scenario ${scenarios.length + 1}`,
        description: template?.description || "Custom scenario",
        method: 'topDown',
        values: applyTemplate(baseCalculation, template),
        params: {
          currency,
          timePeriod: 'annual',
          geographicScope: 'global',
          marketMaturity: 'growing'
        },
        assumptions: template ? [
          `Based on ${template.name} template`,
          `SAM: ${template.adjustments.samPercentage}% of TAM`,
          `SOM: ${template.adjustments.somPercentage}% of SAM`,
          `Growth rate: ${template.adjustments.growthRate}%`
        ] : [],
        confidence: template?.adjustments.confidence || 70,
        lastModified: new Date()
      }
      
      setScenarios([...scenarios, newScenario])
      setSelectedScenarios(new Set([...selectedScenarios, newScenario.id]))
    }
    
    const runSensitivityAnalysis = () => {
      // Calculate impact of each variable on the outcome
      const results = sensitivityVars.map(variable => {
        const impacts = []
        
        for (let value = variable.minValue; value <= variable.maxValue; value += variable.step) {
          const adjustedCalc = applyVariableChange(baseCalculation, variable, value)
          impacts.push({
            value,
            tam: adjustedCalc.tam,
            sam: adjustedCalc.sam,
            som: adjustedCalc.som
          })
        }
        
        return {
          variable: variable.name,
          impacts
        }
      })
      
      return results
    }
    
    const runMonteCarloSimulation = (iterations: number = 1000) => {
      const results = []
      
      for (let i = 0; i < iterations; i++) {
        // Randomly vary all parameters within their ranges
        const simulatedCalc = {
          tam: baseCalculation.tam * (0.8 + Math.random() * 0.4), // ±20%
          sam: 0,
          som: 0,
          method: baseCalculation.method
        }
        
        // Apply random percentages
        simulatedCalc.sam = simulatedCalc.tam * (0.05 + Math.random() * 0.2) // 5-25%
        simulatedCalc.som = simulatedCalc.sam * (0.01 + Math.random() * 0.1) // 1-11%
        
        results.push(simulatedCalc)
      }
      
      // Calculate statistics
      const stats = {
        tam: calculateStats(results.map(r => r.tam)),
        sam: calculateStats(results.map(r => r.sam)),
        som: calculateStats(results.map(r => r.som))
      }
      
      return stats
    }
    
    return (
      <div className="comparison-mode space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab as any}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
            <TabsTrigger value="simulation">Monte Carlo Simulation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scenarios" className="space-y-4">
            {/* Scenario Templates */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Quick Templates:</h3>
              <div className="flex gap-2">
                {SCENARIO_TEMPLATES.map(template => (
                  <Button
                    key={template.name}
                    size="xs"
                    variant="secondary"
                    onClick={() => addScenario(template)}
                  >
                    {template.name}
                  </Button>
                ))}
                <Button size="xs" variant="primary" onClick={() => addScenario()}>
                  + Custom
                </Button>
              </div>
            </div>
            
            {/* Scenario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {scenarios.map((scenario, index) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ScenarioCard
                      scenario={scenario}
                      isSelected={selectedScenarios.has(scenario.id)}
                      onToggleSelect={() => toggleScenarioSelection(scenario.id)}
                      onUpdate={(updates) => updateScenario(scenario.id, updates)}
                      onDelete={() => deleteScenario(scenario.id)}
                      currency={currency}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Comparison Chart */}
            {selectedScenarios.size >= 2 && (
              <ComparisonChart
                scenarios={scenarios.filter(s => selectedScenarios.has(s.id))}
                currency={currency}
              />
            )}
          </TabsContent>
          
          <TabsContent value="sensitivity" className="space-y-4">
            <SensitivityAnalysis
              variables={sensitivityVars}
              onUpdateVariables={setSensitivityVars}
              baseCalculation={baseCalculation}
              currency={currency}
            />
          </TabsContent>
          
          <TabsContent value="simulation" className="space-y-4">
            <MonteCarloSimulation
              baseCalculation={baseCalculation}
              iterations={1000}
              currency={currency}
            />
          </TabsContent>
        </Tabs>
        
        {/* Export Options */}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => exportComparison(scenarios, 'csv')}
            disabled={scenarios.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportComparison(scenarios, 'pdf')}
            disabled={scenarios.length === 0}
          >
            Export Report
          </Button>
        </div>
      </div>
    )
  }
  
  function calculateStats(values: number[]) {
    const sorted = values.sort((a, b) => a - b)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    
    return {
      mean,
      median: sorted[Math.floor(values.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p10: sorted[Math.floor(values.length * 0.1)],
      p90: sorted[Math.floor(values.length * 0.9)],
      stdDev: Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      )
    }
  }
  ```

#### Ticket 3.2.6: Market Growth Projections
- **Description:** Implement growth projections and future market size estimations
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Project TAM/SAM/SOM over 1-5 year periods
  - Support different growth models (linear, exponential, S-curve)
  - Compound Annual Growth Rate (CAGR) calculations
  - Visualize growth trends with line charts
  - Consider market maturity impact on growth
  - Scenario-based growth rates
  - Export projections with confidence intervals
- **Dependencies:** 3.2.2, 3.2.4
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/tam/GrowthProjections.tsx
  import { Line } from "recharts"
  import { calculateCAGR, projectGrowth } from "~/lib/calculators/tam"
  
  interface GrowthProjectionProps {
    baseValues: MarketSizes
    projectionYears: number
    growthScenarios: GrowthScenario[]
    marketMaturity: 'emerging' | 'growing' | 'mature' | 'declining'
    currency: Currency
  }
  
  interface GrowthScenario {
    id: string
    name: string
    description: string
    tamGrowthRate: number
    samGrowthRate: number
    somGrowthRate: number
    confidence: number
    assumptions: string[]
  }
  
  interface ProjectedValues {
    year: number
    tam: number
    sam: number
    som: number
    tamGrowth: number
    samGrowth: number
    somGrowth: number
  }
  
  export function GrowthProjections({
    baseValues,
    projectionYears,
    growthScenarios,
    marketMaturity,
    currency
  }: GrowthProjectionProps) {
    const [selectedModel, setSelectedModel] = useState<'linear' | 'exponential' | 'scurve'>('exponential')
    const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true)
    const [selectedScenario, setSelectedScenario] = useState(growthScenarios[0]?.id)
    
    // Calculate projections for selected scenario
    const projections = useMemo(() => {
      const scenario = growthScenarios.find(s => s.id === selectedScenario)
      if (!scenario) return []
      
      const results: ProjectedValues[] = []
      let currentTam = baseValues.tam
      let currentSam = baseValues.sam
      let currentSom = baseValues.som
      
      for (let year = 0; year <= projectionYears; year++) {
        if (year === 0) {
          results.push({
            year: new Date().getFullYear(),
            tam: currentTam,
            sam: currentSam,
            som: currentSom,
            tamGrowth: 0,
            samGrowth: 0,
            somGrowth: 0
          })
        } else {
          // Apply growth model
          const growth = applyGrowthModel(
            { tam: currentTam, sam: currentSam, som: currentSom },
            scenario,
            year,
            selectedModel,
            marketMaturity
          )
          
          results.push({
            year: new Date().getFullYear() + year,
            ...growth,
            tamGrowth: ((growth.tam - currentTam) / currentTam) * 100,
            samGrowth: ((growth.sam - currentSam) / currentSam) * 100,
            somGrowth: ((growth.som - currentSom) / currentSom) * 100
          })
          
          currentTam = growth.tam
          currentSam = growth.sam
          currentSom = growth.som
        }
      }
      
      return results
    }, [baseValues, projectionYears, growthScenarios, selectedScenario, selectedModel, marketMaturity])
    
    // Calculate CAGR
    const cagr = useMemo(() => {
      if (projections.length < 2) return null
      
      const firstYear = projections[0]
      const lastYear = projections[projections.length - 1]
      const years = projectionYears
      
      return {
        tam: calculateCAGR(firstYear.tam, lastYear.tam, years),
        sam: calculateCAGR(firstYear.sam, lastYear.sam, years),
        som: calculateCAGR(firstYear.som, lastYear.som, years)
      }
    }, [projections, projectionYears])
    
    return (
      <div className="growth-projections space-y-6">
        {/* Controls */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Growth Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600"
            >
              {growthScenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name} - TAM: {scenario.tamGrowthRate}%, SAM: {scenario.samGrowthRate}%, SOM: {scenario.somGrowthRate}%
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedModel === 'linear' ? 'primary' : 'secondary'}
              onClick={() => setSelectedModel('linear')}
            >
              Linear
            </Button>
            <Button
              size="sm"
              variant={selectedModel === 'exponential' ? 'primary' : 'secondary'}
              onClick={() => setSelectedModel('exponential')}
            >
              Exponential
            </Button>
            <Button
              size="sm"
              variant={selectedModel === 'scurve' ? 'primary' : 'secondary'}
              onClick={() => setSelectedModel('scurve')}
            >
              S-Curve
            </Button>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showConfidenceIntervals}
              onChange={(e) => setShowConfidenceIntervals(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show confidence intervals</span>
          </label>
        </div>
        
        {/* Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => formatCurrency(value, currency, true)} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, currency)}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6'
                }}
              />
              <Legend />
              
              <Line
                type="monotone"
                dataKey="tam"
                stroke="#3b82f6"
                strokeWidth={2}
                name="TAM"
                dot={{ r: 4 }}
              />
              
              {showConfidenceIntervals && (
                <>
                  <Area
                    type="monotone"
                    dataKey="tamUpperBound"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="tamLowerBound"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                </>
              )}
              
              <Line
                type="monotone"
                dataKey="sam"
                stroke="#10b981"
                strokeWidth={2}
                name="SAM"
                dot={{ r: 4 }}
              />
              
              <Line
                type="monotone"
                dataKey="som"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="SOM"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* CAGR Summary */}
        {cagr && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">TAM CAGR</h4>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {cagr.tam.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {projectionYears} year average
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300">SAM CAGR</h4>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {cagr.sam.toFixed(1)}%
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {projectionYears} year average
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">SOM CAGR</h4>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {cagr.som.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {projectionYears} year average
              </p>
            </div>
          </div>
        )}
        
        {/* Detailed Projections Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TAM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SAM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SOM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  YoY Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {projections.map((projection, index) => (
                <tr key={projection.year}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {projection.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(projection.tam, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(projection.sam, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(projection.som, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {index > 0 && (
                      <span className={`${projection.somGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projection.somGrowth > 0 ? '+' : ''}{projection.somGrowth.toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  
  function applyGrowthModel(
    current: { tam: number; sam: number; som: number },
    scenario: GrowthScenario,
    year: number,
    model: 'linear' | 'exponential' | 'scurve',
    maturity: string
  ) {
    const maturityFactor = getMaturityGrowthFactor(maturity, year)
    
    switch (model) {
      case 'linear':
        return {
          tam: current.tam + (current.tam * scenario.tamGrowthRate / 100) * maturityFactor,
          sam: current.sam + (current.sam * scenario.samGrowthRate / 100) * maturityFactor,
          som: current.som + (current.som * scenario.somGrowthRate / 100) * maturityFactor
        }
        
      case 'exponential':
        return {
          tam: current.tam * Math.pow(1 + (scenario.tamGrowthRate / 100) * maturityFactor, 1),
          sam: current.sam * Math.pow(1 + (scenario.samGrowthRate / 100) * maturityFactor, 1),
          som: current.som * Math.pow(1 + (scenario.somGrowthRate / 100) * maturityFactor, 1)
        }
        
      case 'scurve':
        // S-curve: slow start, rapid growth, then plateau
        const t = year / 5 // Normalize to 5-year curve
        const k = 10 // Steepness
        const sCurveFactor = 1 / (1 + Math.exp(-k * (t - 0.5)))
        
        return {
          tam: current.tam * (1 + (scenario.tamGrowthRate / 100) * sCurveFactor * maturityFactor),
          sam: current.sam * (1 + (scenario.samGrowthRate / 100) * sCurveFactor * maturityFactor),
          som: current.som * (1 + (scenario.somGrowthRate / 100) * sCurveFactor * maturityFactor)
        }
    }
  }
  
  function getMaturityGrowthFactor(maturity: string, year: number): number {
    // Adjust growth based on market maturity over time
    const factors = {
      emerging: 1.2 - (year * 0.02),    // High growth, slight decline
      growing: 1.0 - (year * 0.03),     // Steady growth, moderate decline
      mature: 0.8 - (year * 0.05),      // Slower growth, faster decline
      declining: 0.6 - (year * 0.08)    // Low growth, steep decline
    }
    
    return Math.max(0.2, factors[maturity] || 1.0)
  }
  ```

#### Ticket 3.2.7: History & Export Functionality ✅
- **Description:** Add calculation history tracking and comprehensive export options
- **Story Points:** 1 SP
- **Status:** COMPLETED
- **Technical Requirements:**
  - Save TAM/SAM/SOM calculations with metadata
  - History modal with search and filtering
  - Load previous calculations
  - Export to CSV with all parameters
  - Export to PDF with visualizations
  - Share calculations via URL
  - Import/export calculation templates
- **Dependencies:** 3.2.1, 3.2.4
- **Implementation Notes:**
  ```typescript
  // src/lib/export/tamExport.ts
  import { MarketSizes, MarketCalculationParams } from "~/lib/calculators/tam"
  import { generatePDF } from "~/lib/export/pdfGenerator"
  
  export interface TamCalculation {
    id: string
    name: string
    description: string
    savedAt: Date
    method: 'topDown' | 'bottomUp'
    values: MarketSizes
    params: MarketCalculationParams
    growthProjections?: GrowthProjection[]
    scenarios?: Scenario[]
    notes?: string
  }
  
  export function exportTamToCSV(calculations: TamCalculation[]): void {
    const headers = [
      'Date',
      'Name',
      'Method',
      'TAM',
      'SAM',
      'SAM %',
      'SOM',
      'SOM %',
      'Currency',
      'Time Period',
      'Geographic Scope',
      'Market Maturity',
      'Confidence',
      'Notes'
    ]
    
    const rows = calculations.map(calc => [
      new Date(calc.savedAt).toLocaleDateString(),
      calc.name,
      calc.method,
      calc.values.tam,
      calc.values.sam,
      ((calc.values.sam / calc.values.tam) * 100).toFixed(1),
      calc.values.som,
      ((calc.values.som / calc.values.sam) * 100).toFixed(1),
      calc.params.currency,
      calc.params.timePeriod,
      calc.params.geographicScope,
      calc.params.marketMaturity,
      calc.values.confidence || 'N/A',
      calc.notes || ''
    ])
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    downloadFile(csv, `tam-calculations-${Date.now()}.csv`, 'text/csv')
  }
  
  export async function exportTamToPDF(calculation: TamCalculation): Promise<void> {
    const doc = await generatePDF({
      title: 'TAM/SAM/SOM Market Analysis',
      subtitle: calculation.name,
      date: new Date(calculation.savedAt),
      sections: [
        {
          title: 'Executive Summary',
          content: [
            `Total Addressable Market (TAM): ${formatCurrency(calculation.values.tam, calculation.params.currency)}`,
            `Serviceable Addressable Market (SAM): ${formatCurrency(calculation.values.sam, calculation.params.currency)} (${((calculation.values.sam / calculation.values.tam) * 100).toFixed(1)}% of TAM)`,
            `Serviceable Obtainable Market (SOM): ${formatCurrency(calculation.values.som, calculation.params.currency)} (${((calculation.values.som / calculation.values.sam) * 100).toFixed(1)}% of SAM)`,
            '',
            `Calculation Method: ${calculation.method === 'topDown' ? 'Top-Down' : 'Bottom-Up'}`,
            `Market Maturity: ${calculation.params.marketMaturity}`,
            `Geographic Scope: ${calculation.params.geographicScope}`,
            `Time Period: ${calculation.params.timePeriod}`
          ]
        },
        {
          title: 'Market Funnel Visualization',
          type: 'chart',
          chartType: 'funnel',
          data: {
            tam: calculation.values.tam,
            sam: calculation.values.sam,
            som: calculation.values.som
          }
        },
        {
          title: 'Key Assumptions',
          content: calculation.values.assumptions || [
            'Market data based on current analysis',
            'Growth rates derived from industry benchmarks',
            'Competitive landscape considered in SOM calculation'
          ]
        },
        {
          title: 'Market Segments',
          type: 'table',
          data: calculation.values.segments || []
        },
        calculation.growthProjections && {
          title: 'Growth Projections',
          type: 'chart',
          chartType: 'line',
          data: calculation.growthProjections
        },
        calculation.scenarios && {
          title: 'Scenario Analysis',
          type: 'comparison',
          data: calculation.scenarios
        },
        calculation.notes && {
          title: 'Additional Notes',
          content: [calculation.notes]
        }
      ].filter(Boolean)
    })
    
    doc.save(`tam-analysis-${calculation.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`)
  }
  
  export function generateShareableURL(calculation: TamCalculation): string {
    const params = new URLSearchParams({
      tam: calculation.values.tam.toString(),
      sam: calculation.values.sam.toString(),
      som: calculation.values.som.toString(),
      method: calculation.method,
      currency: calculation.params.currency,
      name: calculation.name
    })
    
    return `${window.location.origin}/newtab?widget=tam-calculator&${params.toString()}`
  }
  
  export function importFromURL(url: string): Partial<TamCalculation> | null {
    try {
      const urlObj = new URL(url)
      const params = urlObj.searchParams
      
      return {
        name: params.get('name') || 'Imported Calculation',
        method: (params.get('method') || 'topDown') as 'topDown' | 'bottomUp',
        values: {
          tam: parseFloat(params.get('tam') || '0'),
          sam: parseFloat(params.get('sam') || '0'),
          som: parseFloat(params.get('som') || '0'),
          method: (params.get('method') || 'topDown') as 'topDown' | 'bottomUp',
          assumptions: [],
          confidence: 70
        },
        params: {
          currency: (params.get('currency') || 'USD') as Currency,
          timePeriod: 'annual',
          geographicScope: 'global',
          marketMaturity: 'growing'
        }
      }
    } catch {
      return null
    }
  }
  ```

#### Ticket 3.2.8: Input Validation & Contextual Help
- **Description:** Implement comprehensive validation rules and helpful guidance for users
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Real-time input validation with helpful error messages
  - Contextual help tooltips for all inputs
  - Industry-specific templates and examples
  - Validation rules based on calculation method
  - Warning for unrealistic values
  - Guided wizard mode for beginners
  - FAQ and best practices section
- **Dependencies:** 3.2.1, 3.2.3
- **Implementation Notes:**
  ```typescript
  // src/hooks/useTamValidation.ts
  import { MarketSizes, MarketCalculationParams } from "~/lib/calculators/tam"
  
  interface ValidationRule {
    field: string
    validate: (value: any, context?: any) => boolean
    message: string
    severity: 'error' | 'warning' | 'info'
  }
  
  interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
    suggestions: string[]
  }
  
  const VALIDATION_RULES: ValidationRule[] = [
    {
      field: 'tam',
      validate: (value) => value > 0,
      message: 'TAM must be greater than 0',
      severity: 'error'
    },
    {
      field: 'sam_percentage',
      validate: (value, context) => {
        const percentage = (context.sam / context.tam) * 100
        return percentage > 0 && percentage <= 100
      },
      message: 'SAM cannot exceed TAM',
      severity: 'error'
    },
    {
      field: 'som_percentage',
      validate: (value, context) => {
        const percentage = (context.som / context.sam) * 100
        return percentage > 0 && percentage <= 100
      },
      message: 'SOM cannot exceed SAM',
      severity: 'error'
    },
    {
      field: 'sam_typical',
      validate: (value, context) => {
        const percentage = (context.sam / context.tam) * 100
        return percentage >= 1 && percentage <= 30
      },
      message: 'SAM typically ranges from 1% to 30% of TAM',
      severity: 'warning'
    },
    {
      field: 'som_realistic',
      validate: (value, context) => {
        const percentage = (context.som / context.sam) * 100
        return percentage >= 0.1 && percentage <= 20
      },
      message: 'SOM typically ranges from 0.1% to 20% of SAM for new entrants',
      severity: 'warning'
    }
  ]
  
  export function useTamValidation(
    values: Partial<MarketSizes>,
    params: MarketCalculationParams,
    method: 'topDown' | 'bottomUp'
  ): ValidationResult {
    const [errors, setErrors] = useState<ValidationError[]>([])
    const [warnings, setWarnings] = useState<ValidationWarning[]>([])
    const [suggestions, setSuggestions] = useState<string[]>([])
    
    useEffect(() => {
      const newErrors: ValidationError[] = []
      const newWarnings: ValidationWarning[] = []
      const newSuggestions: string[] = []
      
      // Run validation rules
      VALIDATION_RULES.forEach(rule => {
        const isValid = rule.validate(values[rule.field], values)
        
        if (!isValid) {
          if (rule.severity === 'error') {
            newErrors.push({
              field: rule.field,
              message: rule.message
            })
          } else if (rule.severity === 'warning') {
            newWarnings.push({
              field: rule.field,
              message: rule.message
            })
          }
        }
      })
      
      // Add method-specific validations
      if (method === 'bottomUp') {
        if (!values.segments || values.segments.length === 0) {
          newErrors.push({
            field: 'segments',
            message: 'Bottom-up calculation requires at least one market segment'
          })
        }
      }
      
      // Generate contextual suggestions
      if (params.marketMaturity === 'emerging' && values.som && values.sam) {
        const somPercentage = (values.som / values.sam) * 100
        if (somPercentage < 5) {
          newSuggestions.push(
            'In emerging markets, you might be able to capture a larger market share due to less competition'
          )
        }
      }
      
      if (params.geographicScope === 'global' && method === 'topDown') {
        newSuggestions.push(
          'Consider breaking down your global TAM by regions for more accurate SAM calculation'
        )
      }
      
      setErrors(newErrors)
      setWarnings(newWarnings)
      setSuggestions(newSuggestions)
    }, [values, params, method])
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  // Help content for each field
  export const TAM_HELP_CONTENT = {
    tam: {
      title: 'Total Addressable Market (TAM)',
      description: 'The total market demand for your product or service',
      examples: [
        'Global cloud computing market: $500B',
        'US e-commerce market: $800B',
        'European SaaS market: $100B'
      ],
      tips: [
        'Use industry reports from Gartner, IDC, or Forrester',
        'Consider both current market size and growth potential',
        'Define your market clearly (geography, industry, customer type)'
      ]
    },
    sam: {
      title: 'Serviceable Addressable Market (SAM)',
      description: 'The segment of TAM targeted by your products/services within your reach',
      examples: [
        'SMB cloud accounting in North America: $10B',
        'Enterprise CRM for financial services: $5B',
        'Mobile gaming for casual players in Asia: $20B'
      ],
      tips: [
        'Consider your geographic limitations',
        'Factor in regulatory constraints',
        'Think about language and localization requirements',
        'Account for your business model limitations'
      ]
    },
    som: {
      title: 'Serviceable Obtainable Market (SOM)',
      description: 'The portion of SAM you can realistically capture',
      examples: [
        'Year 1: 0.1% of SAM ($100K)',
        'Year 3: 1% of SAM ($1M)',
        'Year 5: 5% of SAM ($5M)'
      ],
      tips: [
        'Be realistic about competition',
        'Consider your marketing budget and reach',
        'Factor in sales capacity and growth',
        'Account for customer acquisition costs'
      ]
    }
  }
  
  // Industry templates
  export const INDUSTRY_TEMPLATES = {
    'b2b-saas': {
      name: 'B2B SaaS',
      description: 'Software-as-a-Service for businesses',
      defaults: {
        samPercentage: 10,
        somPercentage: 1,
        growthRate: 20,
        marketMaturity: 'growing'
      },
      segments: [
        { name: 'Enterprise', penetration: 5 },
        { name: 'Mid-Market', penetration: 15 },
        { name: 'SMB', penetration: 25 }
      ]
    },
    'consumer-app': {
      name: 'Consumer Mobile App',
      description: 'B2C mobile application',
      defaults: {
        samPercentage: 25,
        somPercentage: 0.5,
        growthRate: 30,
        marketMaturity: 'growing'
      },
      segments: [
        { name: 'Early Adopters', penetration: 20 },
        { name: 'Mass Market', penetration: 10 },
        { name: 'Laggards', penetration: 5 }
      ]
    },
    'marketplace': {
      name: 'Two-Sided Marketplace',
      description: 'Platform connecting buyers and sellers',
      defaults: {
        samPercentage: 15,
        somPercentage: 2,
        growthRate: 25,
        marketMaturity: 'emerging'
      },
      segments: [
        { name: 'Supply Side', penetration: 10 },
        { name: 'Demand Side', penetration: 15 }
      ]
    }
  }
  ```

---

## Story 3.3: ROI Calculator ✅ COMPLETED
**Description:** Build a comprehensive Return on Investment calculator that helps PMs evaluate the financial viability of features and projects with advanced analysis capabilities.

**Acceptance Criteria:**
- ✅ Calculate simple and advanced ROI metrics (ROI, NPV, IRR, MIRR, PI, EVA)
- ✅ Support time-based calculations with flexible time periods
- ✅ Break down costs and benefits with categorization and templates
- ✅ Visualize ROI over time with interactive charts and animations
- ⏳ Compare multiple investment scenarios (up to 5) with sensitivity analysis (partial)
- ✅ Risk-adjusted ROI calculations with probability factors
- ✅ Monte Carlo simulation for uncertain inputs (1000+ iterations)
- ⏳ Industry-specific templates and benchmarks (partial)
- ✅ Multi-currency support with real-time conversion
- ✅ Save/load calculations with comprehensive history tracking
- ✅ Export results to CSV, JSON, and PDF formats
- ✅ Share calculations via URL with deep linking
- ✅ Contextual help system and validation
- ⏳ What-if analysis and scenario planning (partial)
- ✅ WACC-based discount rate calculations

**Implementation Summary:**
- Created a comprehensive ROI calculator with advanced financial metrics
- Implemented all major ROI calculations including NPV, IRR, MIRR, PI, and EVA
- Built flexible cost/benefit input system with categories and time-based entries
- Added beautiful timeline visualization using Recharts
- Created risk-adjusted calculations with probability weighting
- Implemented Monte Carlo simulation for uncertainty analysis
- Built full export functionality (CSV, JSON, PDF)
- Added comprehensive validation with helpful error messages and suggestions
- Integrated multi-currency support with proper formatting

**Note:** Advanced features like full scenario comparison and industry templates were partially implemented. These can be completed in a future iteration based on user feedback.

### Tickets:

#### Ticket 3.3.1: Create RoiCalculator Component
- **Description:** Build the main ROI calculator widget with comprehensive input forms and proper widget integration
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Properly implement BaseWidget pattern with widgetId and widgetConfig props
  - Create form for costs (initial + recurring) with categorization
  - Add form for benefits (revenue + cost savings) with templates
  - Include flexible time period selection (months, quarters, years)
  - Support multi-currency with real-time conversion
  - Add discount rate for NPV calculations with WACC option
  - Implement responsive design for different widget sizes
  - Add loading states and error boundaries
  - Include widget header with settings and actions
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/RoiCalculator.tsx
  import { BaseWidget } from "~/components/widgets/BaseWidget"
  import { useStorage } from "@plasmohq/storage/hook"
  import type { RoiCalculation, Currency } from "~/types"
  
  interface RoiCalculatorProps {
    widgetId: string
    widgetConfig?: Record<string, unknown>
  }
  
  export default function RoiCalculator({ widgetId, widgetConfig }: RoiCalculatorProps) {
    const [calculations, setCalculations] = useStorage<RoiCalculation[]>("roi-history", [])
    const [calculation, setCalculation] = useState<RoiCalculation>({
      name: '',
      initialCost: 0,
      recurringCosts: [],
      benefits: [],
      timeHorizon: 12,
      timePeriod: 'monthly',
      discountRate: 10,
      discountMethod: 'manual', // 'manual' | 'wacc'
      currency: 'USD',
      riskFactors: [],
      template: null
    })
    
    return (
      <BaseWidget
        widgetId={widgetId}
        title="ROI Calculator"
        data={calculation}
        settings={widgetConfig}
        onSettings={widgetConfig?.onSettings as () => void}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        {(data) => (
          <div className="p-6 space-y-6">
            <RoiInputForm 
              calculation={calculation}
              onChange={setCalculation}
            />
            <RoiResults 
              calculation={calculation}
              onSave={handleSave}
              onCompare={handleCompare}
            />
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 3.3.2: Implement Advanced ROI Calculation Formulas
- **Description:** Create comprehensive calculation functions for various ROI metrics including advanced financial measures
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Simple ROI: ((Gain - Cost) / Cost) × 100
  - NPV: Net Present Value with discount rate
  - IRR: Internal Rate of Return
  - MIRR: Modified IRR considering reinvestment rate
  - PI: Profitability Index (NPV / Initial Investment)
  - EVA: Economic Value Added
  - WACC-based discount rate calculations
  - Risk-adjusted ROI with probability weighting
  - Payback period calculation (simple and discounted)
  - Break-even analysis with sensitivity
  - Support for different time period aggregations
  - Handle edge cases and validate inputs
- **Dependencies:** 3.3.1
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/roi.ts
  export interface RoiMetrics {
    simpleRoi: number
    npv: number
    irr: number
    paybackPeriod: number
    breakEvenMonth: number
  }
  
  export function calculateRoi(params: RoiCalculation): RoiMetrics {
    const { initialCost, recurringCosts, benefits, timeHorizon, discountRate } = params
    
    // Calculate monthly cash flows
    const cashFlows = calculateCashFlows(initialCost, recurringCosts, benefits, timeHorizon)
    
    // Simple ROI
    const totalCosts = initialCost + sumArray(recurringCosts.map(c => c.amount * c.months))
    const totalBenefits = sumArray(benefits.map(b => b.amount * b.months))
    const simpleRoi = ((totalBenefits - totalCosts) / totalCosts) * 100
    
    // NPV
    const npv = calculateNPV(cashFlows, discountRate / 100 / 12)
    
    // IRR
    const irr = calculateIRR(cashFlows) * 12 * 100
    
    // Payback Period
    const paybackPeriod = calculatePaybackPeriod(cashFlows)
    
    // Break-even
    const breakEvenMonth = findBreakEvenMonth(cashFlows)
    
    return { simpleRoi, npv, irr, paybackPeriod, breakEvenMonth }
  }
  
  function calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((npv, cashFlow, month) => {
      return npv + cashFlow / Math.pow(1 + discountRate, month)
    }, 0)
  }
  
  function calculateIRR(cashFlows: number[]): number {
    // Newton-Raphson method for IRR calculation
    let rate = 0.1
    const tolerance = 0.00001
    const maxIterations = 100
    
    for (let i = 0; i < maxIterations; i++) {
      const { npv, derivative } = getNPVAndDerivative(cashFlows, rate)
      const newRate = rate - npv / derivative
      
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate
      }
      
      rate = newRate
    }
    
    return rate
  }
  ```

#### Ticket 3.3.3: Add Advanced Cost/Benefit Breakdown View
- **Description:** Create comprehensive view showing all costs and benefits with advanced categorization and templates
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Categorize costs (development, marketing, operations, infrastructure, licensing)
  - Categorize benefits (new revenue, cost savings, efficiency, strategic value)
  - Support one-time vs recurring classification
  - Drag-and-drop reordering of line items
  - Bulk operations (duplicate, delete, move)
  - Templates for common costs/benefits by industry
  - Show monthly, quarterly, annual, and total amounts
  - Support adding/removing/editing line items inline
  - Calculate subtotals by category with drill-down
  - Import/export line items as CSV
  - Validation for overlapping time periods
- **Dependencies:** 3.3.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/roi/CostBenefitInputs.tsx
  interface LineItem {
    id: string
    category: string
    description: string
    amount: number
    startMonth: number
    months: number
  }
  
  export function CostBenefitInputs({ costs, benefits, onUpdate }) {
    const addLineItem = (type: 'costs' | 'benefits') => {
      const newItem: LineItem = {
        id: generateId(),
        category: type === 'costs' ? 'development' : 'revenue',
        description: '',
        amount: 0,
        startMonth: 1,
        months: 1
      }
      
      onUpdate(type, [...(type === 'costs' ? costs : benefits), newItem])
    }
    
    return (
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Costs</h3>
          <LineItemList
            items={costs}
            categories={['development', 'marketing', 'operations', 'other']}
            onUpdate={(items) => onUpdate('costs', items)}
          />
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => addLineItem('costs')}
          >
            + Add Cost
          </Button>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Benefits</h3>
          <LineItemList
            items={benefits}
            categories={['revenue', 'cost_savings', 'efficiency', 'other']}
            onUpdate={(items) => onUpdate('benefits', items)}
          />
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => addLineItem('benefits')}
          >
            + Add Benefit
          </Button>
        </div>
      </div>
    )
  }
  ```

#### Ticket 3.3.4: Create Advanced ROI Timeline Visualization
- **Description:** Build interactive charts showing ROI progression over time with animations
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Switch to Recharts for consistency with other calculators
  - Add Framer Motion animations for smooth transitions
  - Line chart with multiple metrics (cash flow, cumulative, ROI %)
  - Highlight break-even point with annotation
  - Area chart showing positive/negative cash flow periods
  - Interactive tooltips with detailed breakdown
  - Zoom and pan capabilities for long time horizons
  - Export chart as PNG/SVG
  - Toggle between different time aggregations
  - Show confidence intervals for projections
- **Dependencies:** 3.3.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/roi/RoiTimeline.tsx
  import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
  import { motion } from 'framer-motion'
  
  export function RoiTimeline({ calculation, metrics }: {
    calculation: RoiCalculation
    metrics: RoiMetrics
  }) {
    const cashFlows = calculateCashFlows(calculation)
    const cumulativeCashFlow = calculateCumulative(cashFlows)
    
    const chartData = {
      labels: Array.from({ length: calculation.timeHorizon }, (_, i) => 
        `Month ${i + 1}`
      ),
      datasets: [
        {
          label: 'Monthly Cash Flow',
          data: cashFlows,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        },
        {
          label: 'Cumulative Cash Flow',
          data: cumulativeCashFlow,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1
        },
        {
          label: 'Break-even',
          data: Array(calculation.timeHorizon).fill(0),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    }
    
    const options = {
      responsive: true,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const value = formatCurrency(context.parsed.y)
              return `${label}: ${value}`
            }
          }
        },
        annotation: {
          annotations: {
            breakEven: {
              type: 'line',
              xMin: metrics.breakEvenMonth,
              xMax: metrics.breakEvenMonth,
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 2,
              label: {
                content: 'Break-even',
                enabled: true,
                position: 'start'
              }
            }
          }
        }
      }
    }
    
    return (
      <div className="roi-timeline">
        <Line data={chartData} options={options} />
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <MetricCard
            label="Simple ROI"
            value={`${metrics.simpleRoi.toFixed(1)}%`}
            positive={metrics.simpleRoi > 0}
          />
          <MetricCard
            label="NPV"
            value={formatCurrency(metrics.npv)}
            positive={metrics.npv > 0}
          />
          <MetricCard
            label="IRR"
            value={`${metrics.irr.toFixed(1)}%`}
            positive={metrics.irr > calculation.discountRate}
          />
          <MetricCard
            label="Payback"
            value={`${metrics.paybackPeriod} months`}
            positive={metrics.paybackPeriod < calculation.timeHorizon}
          />
        </div>
      </div>
    )
  }
  ```

#### Ticket 3.3.5: Add Industry Templates & Benchmarks
- **Description:** Implement pre-built templates and industry benchmarks for common ROI scenarios
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create templates for common project types:
    - SaaS implementation
    - E-commerce platform
    - Mobile app development
    - Enterprise software
    - Marketing campaigns
    - Infrastructure upgrades
  - Industry-specific ROI benchmarks and ranges
  - Guided setup wizard with questionnaire
  - Auto-populate costs/benefits based on template
  - Customizable template library
  - Import/export custom templates
  - Contextual help and best practices per industry
  - Template version management
- **Dependencies:** 3.3.1, 3.3.3
- **Implementation Notes:**
  ```typescript
  // src/lib/templates/roiTemplates.ts
  export interface RoiTemplate {
    id: string
    name: string
    description: string
    industry: string
    category: 'software' | 'marketing' | 'infrastructure' | 'operations'
    defaultValues: {
      timeHorizon: number
      discountRate: number
      costs: TemplateLineItem[]
      benefits: TemplateLineItem[]
    }
    benchmarks: {
      typicalRoi: { min: number; max: number; median: number }
      paybackPeriod: { min: number; max: number; median: number }
      successRate: number
    }
    tips: string[]
  }
  
  export const ROI_TEMPLATES: RoiTemplate[] = [
    {
      id: 'saas-implementation',
      name: 'SaaS Implementation',
      description: 'Calculate ROI for implementing a new SaaS solution',
      industry: 'Technology',
      category: 'software',
      defaultValues: {
        timeHorizon: 36,
        discountRate: 12,
        costs: [
          { category: 'licensing', description: 'Annual subscription', amount: 50000, recurring: true },
          { category: 'development', description: 'Implementation & setup', amount: 25000, recurring: false },
          { category: 'operations', description: 'Training & onboarding', amount: 15000, recurring: false }
        ],
        benefits: [
          { category: 'cost_savings', description: 'Reduced IT maintenance', amount: 30000, recurring: true },
          { category: 'efficiency', description: 'Productivity gains', amount: 40000, recurring: true },
          { category: 'revenue', description: 'New revenue opportunities', amount: 25000, recurring: true }
        ]
      },
      benchmarks: {
        typicalRoi: { min: 150, max: 400, median: 250 },
        paybackPeriod: { min: 12, max: 24, median: 18 },
        successRate: 0.75
      },
      tips: [
        'Include all hidden costs like training and integration',
        'Consider phased rollout to reduce risk',
        'Factor in change management costs'
      ]
    }
  ]
  ```

#### Ticket 3.3.6: Implement Scenario Comparison Mode
- **Description:** Build comprehensive scenario comparison with sensitivity analysis
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Compare up to 5 investment scenarios side-by-side
  - Scenario templates (Conservative, Moderate, Aggressive)
  - Sensitivity analysis for key variables:
    - Cost overrun impact
    - Benefit realization delays
    - Discount rate changes
    - Time horizon adjustments
  - What-if simulations with real-time updates
  - Tornado charts for variable impact visualization
  - Scenario scoring and ranking
  - Export comparison report
  - Save scenario sets for future reference
- **Dependencies:** 3.3.2, 3.3.4
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/roi/ScenarioComparison.tsx
  interface RoiScenario {
    id: string
    name: string
    description: string
    baseCalculation: RoiCalculation
    adjustments: {
      costMultiplier: number
      benefitMultiplier: number
      delayMonths: number
      riskFactor: number
    }
    results: RoiMetrics
    confidence: number
  }
  
  export function ScenarioComparison({ baseCalculation }: { baseCalculation: RoiCalculation }) {
    const [scenarios, setScenarios] = useState<RoiScenario[]>([])
    const [sensitivityVars, setSensitivityVars] = useState<SensitivityVariable[]>([
      { name: 'Initial Cost', baseValue: 100, range: [-30, 30], step: 5 },
      { name: 'Monthly Benefits', baseValue: 100, range: [-20, 40], step: 5 },
      { name: 'Time to Value', baseValue: 0, range: [0, 12], step: 1 }
    ])
    
    const runSensitivityAnalysis = () => {
      // Calculate impact of each variable on ROI metrics
      return sensitivityVars.map(variable => ({
        variable: variable.name,
        impacts: calculateVariableImpacts(baseCalculation, variable)
      }))
    }
    
    return (
      <div className="scenario-comparison">
        <ScenarioBuilder onAdd={addScenario} />
        <ScenarioGrid scenarios={scenarios} />
        <SensitivityAnalysis 
          variables={sensitivityVars}
          results={runSensitivityAnalysis()}
        />
        <TornadoChart data={sensitivityResults} />
      </div>
    )
  }
  ```

#### Ticket 3.3.7: Add Risk Assessment Module
- **Description:** Implement risk-adjusted ROI calculations with probabilistic analysis
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Risk factor identification and quantification
  - Probability of success inputs for each benefit
  - Risk mitigation cost tracking
  - Monte Carlo simulation (1000+ iterations)
  - Confidence intervals (P10, P50, P90)
  - Risk-adjusted NPV and ROI calculations
  - Probability distribution visualizations
  - Risk heat map for cost/benefit items
  - Export risk analysis report
- **Dependencies:** 3.3.2
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/roiRisk.ts
  interface RiskFactor {
    id: string
    name: string
    category: 'technical' | 'market' | 'operational' | 'financial'
    probability: number // 0-1
    impact: number // multiplier
    mitigation?: {
      cost: number
      effectiveness: number // 0-1
    }
  }
  
  export function calculateRiskAdjustedRoi(
    calculation: RoiCalculation,
    riskFactors: RiskFactor[]
  ): RiskAdjustedMetrics {
    const iterations = 1000
    const results: RoiMetrics[] = []
    
    for (let i = 0; i < iterations; i++) {
      const adjustedCalc = applyRiskFactors(calculation, riskFactors)
      results.push(calculateRoi(adjustedCalc))
    }
    
    return {
      p10: getPercentile(results, 10),
      p50: getPercentile(results, 50),
      p90: getPercentile(results, 90),
      mean: calculateMean(results),
      stdDev: calculateStdDev(results),
      successProbability: results.filter(r => r.npv > 0).length / iterations
    }
  }
  
  export function runMonteCarloSimulation(
    calculation: RoiCalculation,
    uncertainties: UncertaintyRange[]
  ): SimulationResults {
    const results = []
    
    for (let i = 0; i < 1000; i++) {
      const randomizedCalc = randomizeInputs(calculation, uncertainties)
      results.push(calculateRoi(randomizedCalc))
    }
    
    return analyzeDistribution(results)
  }
  ```

#### Ticket 3.3.8: History & Export Functionality
- **Description:** Add comprehensive save/load and export capabilities
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Save calculations with metadata (name, date, tags)
  - History modal with search and filtering
  - Load and edit previous calculations
  - Compare historical calculations
  - Export formats:
    - CSV with all inputs and results
    - JSON for data portability
    - PDF report with charts and analysis
  - Share via URL with encoded parameters
  - Bulk export of multiple calculations
  - Auto-save draft calculations
- **Dependencies:** 3.3.1, 3.3.4
- **Implementation Notes:**
  ```typescript
  // src/lib/export/roiExport.ts
  export async function exportRoiToPDF(
    calculation: RoiCalculation,
    metrics: RoiMetrics,
    scenarios?: RoiScenario[]
  ): Promise<void> {
    const doc = await generatePDF({
      title: 'ROI Analysis Report',
      subtitle: calculation.name,
      sections: [
        {
          title: 'Executive Summary',
          content: [
            `Initial Investment: ${formatCurrency(calculation.initialCost)}`,
            `Time Horizon: ${calculation.timeHorizon} months`,
            `Simple ROI: ${metrics.simpleRoi.toFixed(1)}%`,
            `NPV: ${formatCurrency(metrics.npv)}`,
            `Payback Period: ${metrics.paybackPeriod} months`
          ]
        },
        {
          title: 'Financial Metrics',
          type: 'metrics',
          data: metrics
        },
        {
          title: 'Cash Flow Projection',
          type: 'chart',
          chartType: 'line',
          data: generateCashFlowData(calculation)
        },
        scenarios && {
          title: 'Scenario Analysis',
          type: 'comparison',
          data: scenarios
        }
      ].filter(Boolean)
    })
    
    doc.save(`roi-analysis-${Date.now()}.pdf`)
  }
  ```

#### Ticket 3.3.9: Add Validation & Help System
- **Description:** Implement comprehensive input validation and contextual help
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Real-time input validation with helpful messages
  - Business logic validation:
    - Costs cannot be negative
    - Benefits should have realistic ranges
    - Time periods cannot overlap
    - Discount rate reasonable ranges
  - Contextual help tooltips for all fields
  - Interactive tutorials for first-time users
  - Best practices guide
  - Common mistakes warnings
  - FAQ section with examples
  - Keyboard shortcuts support
- **Dependencies:** 3.3.1
- **Implementation Notes:**
  ```typescript
  // src/hooks/useRoiValidation.ts
  export function useRoiValidation(calculation: RoiCalculation) {
    const errors = useMemo(() => {
      const validationErrors: ValidationError[] = []
      
      // Validate initial cost
      if (calculation.initialCost < 0) {
        validationErrors.push({
          field: 'initialCost',
          message: 'Initial cost cannot be negative'
        })
      }
      
      // Validate discount rate
      if (calculation.discountRate < 0 || calculation.discountRate > 50) {
        validationErrors.push({
          field: 'discountRate',
          message: 'Discount rate should be between 0% and 50%'
        })
      }
      
      // Validate time periods don't overlap
      const timeOverlaps = checkTimeOverlaps([
        ...calculation.recurringCosts,
        ...calculation.benefits
      ])
      
      if (timeOverlaps.length > 0) {
        validationErrors.push({
          field: 'timeperiods',
          message: 'Time periods overlap for some items'
        })
      }
      
      return validationErrors
    }, [calculation])
    
    const warnings = useMemo(() => {
      const validationWarnings: ValidationWarning[] = []
      
      // Warn about high discount rates
      if (calculation.discountRate > 20) {
        validationWarnings.push({
          field: 'discountRate',
          message: 'Discount rate seems high. Typical rates are 8-15%'
        })
      }
      
      // Warn about unrealistic payback expectations
      if (calculation.timeHorizon < 12) {
        validationWarnings.push({
          field: 'timeHorizon',
          message: 'Consider longer time horizon for accurate ROI'
        })
      }
      
      return validationWarnings
    }, [calculation])
    
    return { errors, warnings, isValid: errors.length === 0 }
  }
  ```

---

## Story 3.4: A/B Test Calculator ✅ COMPLETED
**Description:** Build a comprehensive statistical experimentation platform for A/B tests to help PMs design, run, and analyze experiments with modern statistical methods.

**Acceptance Criteria:**
- ✅ Calculate statistical significance using multiple methods (frequentist completed, Bayesian/sequential/MAB pending)
- ✅ Determine required sample size with power analysis and MDE calculations
- ✅ Show confidence intervals and p-values
- ✅ Support multiple test variations (A/B, A/B/n, multivariate)
- ✅ Provide accurate test duration estimates with traffic allocation
- ✅ Interactive visualizations with power curves and test timelines (TestResultsVisualization completed)
- ✅ Test planning tools with hypothesis templates and benchmarks (sample size calculator + examples completed)
- ✅ Save/load test results with history tracking
- ✅ Example A/B tests library for learning and quick starts
- ✅ Export results to CSV, JSON, and PDF formats
- ✅ Share test results via URL with encoded parameters
- 🔲 Risk assessment and budget impact analysis (future enhancement)
- 🔲 Multi-armed bandit algorithms for optimization (future enhancement)
- 🔲 Segment analysis and drill-down capabilities (future enhancement)

**Implementation Summary:**
- Created comprehensive AbTestCalculator component with proper BaseWidget integration
- Implemented frequentist statistical calculations with z-tests and confidence intervals
- Built SampleSizeCalculator with power analysis and duration estimates
- Created TestResultsVisualization with interactive charts:
  - Conversion rate timeline and comparison
  - Statistical significance evolution
  - Confidence interval visualization
  - Power analysis curves
  - Distribution plots
- Added comprehensive example A/B tests library with 8 real-world scenarios
- Integrated with existing widget framework and dashboard system
- Supports A/B, A/B/n, and multivariate test configurations
- Includes test metadata management (hypothesis, owner, business impact)

**Note:** Core functionality is complete including frequentist testing, sample size calculations, visualizations, export features, and URL sharing. Advanced statistical methods (Bayesian, sequential testing, MAB algorithms) and segment analysis are planned for future iterations.

### Tickets:

#### Ticket 3.4.1: Build AbTestCalculator Component
- **Description:** Create the main A/B test calculator widget with comprehensive experimentation features
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Properly implement BaseWidget pattern with widgetId and widgetConfig props
  - Support multiple test types: A/B, A/B/n, multivariate
  - Expanded metric types:
    - Conversion rate (binary)
    - Revenue per visitor
    - Average order value
    - User engagement metrics
    - Retention rates
    - Custom KPIs
  - Test configuration:
    - Confidence level selection (90%, 95%, 99%)
    - One-tailed vs two-tailed test selection
    - Statistical method selection (frequentist, Bayesian, sequential)
    - Traffic allocation controls
  - Test metadata:
    - Hypothesis statement
    - Test owner and stakeholders
    - Start/end dates
    - Tags and categories
    - Business impact estimation
  - Real-time validation and error handling
  - Responsive design for different widget sizes
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/AbTestCalculator.tsx
  import { BaseWidget } from "~/components/widgets/BaseWidget"
  import { useStorage } from "@plasmohq/storage/hook"
  import type { AbTestResult, TestConfig, Variation } from "~/types"
  
  interface AbTestCalculatorProps {
    widgetId: string
    widgetConfig?: Record<string, unknown>
  }
  
  interface Variation {
    id: string
    name: string
    visitors: number
    conversions: number
    revenue?: number
    engagement?: number
    customMetrics?: Record<string, number>
  }
  
  interface TestConfig {
    testType: 'ab' | 'abn' | 'multivariate'
    metric: 'conversion' | 'revenue' | 'engagement' | 'retention' | 'custom'
    statisticalMethod: 'frequentist' | 'bayesian' | 'sequential' | 'mab'
    confidenceLevel: 90 | 95 | 99
    testDirection: 'one-tailed' | 'two-tailed'
    minimumEffect: number
    trafficAllocation: Record<string, number>
  }
  
  interface TestMetadata {
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
      confidence: 'low' | 'medium' | 'high'
    }
  }
  
  export default function AbTestCalculator({ widgetId, widgetConfig }: AbTestCalculatorProps) {
    const [testHistory, setTestHistory] = useStorage<AbTestResult[]>("abtest-history", [])
    const [currentTest, setCurrentTest] = useState<{
      config: TestConfig
      metadata: TestMetadata
      variations: Variation[]
    }>({
      config: {
        testType: 'ab',
        metric: 'conversion',
        statisticalMethod: 'frequentist',
        confidenceLevel: 95,
        testDirection: 'two-tailed',
        minimumEffect: 5,
        trafficAllocation: { control: 50, variant: 50 }
      },
      metadata: {
        name: '',
        hypothesis: '',
        owner: '',
        stakeholders: [],
        tags: [],
        businessImpact: {
          metric: '',
          estimatedValue: 0,
          confidence: 'medium'
        }
      },
      variations: [
        { id: 'control', name: 'Control', visitors: 0, conversions: 0 },
        { id: 'variant-a', name: 'Variant A', visitors: 0, conversions: 0 }
      ]
    })
    
    return (
      <BaseWidget
        widgetId={widgetId}
        title="A/B Test Calculator"
        data={currentTest}
        settings={widgetConfig}
        onSettings={widgetConfig?.onSettings as () => void}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        {(data) => (
          <div className="p-6 space-y-6">
            <TestMetadataForm
              metadata={currentTest.metadata}
              onChange={(metadata) => setCurrentTest({ ...currentTest, metadata })}
            />
            
            <TestConfiguration
              config={currentTest.config}
              onChange={(config) => setCurrentTest({ ...currentTest, config })}
            />
            
            <VariationManager
              variations={currentTest.variations}
              testType={currentTest.config.testType}
              metric={currentTest.config.metric}
              onChange={(variations) => setCurrentTest({ ...currentTest, variations })}
            />
            
            <TestAnalysis
              test={currentTest}
              onSave={handleSaveTest}
              onCompare={handleCompareTests}
              onExport={handleExportTest}
            />
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 3.4.2: Implement Advanced Statistical Calculations
- **Description:** Create comprehensive statistical functions for multiple testing methodologies
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Frequentist methods:
    - Z-test for proportions
    - T-test for continuous metrics
    - Chi-square test for categorical data
    - Mann-Whitney U test for non-parametric data
  - Bayesian methods:
    - Beta-binomial for conversion rates
    - Normal-normal for continuous metrics
    - Prior configuration (uniform, informative)
    - Posterior distribution calculation
    - Credible intervals
  - Sequential testing:
    - AGILE (Adaptive Group Sequential Design)
    - mSPRT (modified Sequential Probability Ratio Test)
    - Early stopping boundaries
    - Alpha spending functions
  - Multi-armed bandit algorithms:
    - Thompson Sampling
    - Upper Confidence Bound (UCB)
    - Epsilon-greedy
    - Contextual bandits
  - Advanced features:
    - Bootstrap confidence intervals
    - Multiple testing correction (Bonferroni, FDR, Holm)
    - Effect size calculations (Cohen's d, relative lift)
    - Statistical power calculation
    - Handle edge cases (zero conversions, small samples, extreme values)
- **Dependencies:** 3.4.1
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/abtest.ts
  import { cdf, inv, beta } from 'jstat'
  
  export interface TestResult {
    method: 'frequentist' | 'bayesian' | 'sequential' | 'mab'
    pValue?: number
    isSignificant: boolean
    confidenceInterval?: [number, number]
    credibleInterval?: [number, number]
    posteriorDistribution?: number[]
    uplift: number
    effectSize: number
    power: number
    stoppingBoundaries?: { upper: number; lower: number }
    shouldStop?: boolean
    multipleTestingAdjusted?: boolean
  }
  
  // Frequentist Analysis
  export function calculateFrequentist(
    variations: Variation[],
    config: TestConfig
  ): TestResult[] {
    const control = variations[0]
    const results: TestResult[] = []
    
    for (let i = 1; i < variations.length; i++) {
      const variant = variations[i]
      const result = calculatePairwiseTest(control, variant, config)
      
      // Apply multiple testing correction if needed
      if (variations.length > 2) {
        result.pValue = adjustPValue(result.pValue, variations.length - 1, config.correctionMethod)
        result.multipleTestingAdjusted = true
      }
      
      results.push(result)
    }
    
    return results
  }
  
  // Bayesian Analysis
  export function calculateBayesian(
    variations: Variation[],
    config: BayesianConfig
  ): BayesianResult[] {
    const results: BayesianResult[] = []
    
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i]
      
      // Beta-binomial for conversion rates
      const alphaPrior = config.priorAlpha || 1
      const betaPrior = config.priorBeta || 1
      
      const alphaPosterior = alphaPrior + variation.conversions
      const betaPosterior = betaPrior + (variation.visitors - variation.conversions)
      
      // Sample from posterior
      const posteriorSamples = Array.from({ length: 10000 }, () => 
        beta.sample(alphaPosterior, betaPosterior)
      )
      
      results.push({
        variation: variation.name,
        posteriorMean: alphaPosterior / (alphaPosterior + betaPosterior),
        credibleInterval: getCredibleInterval(posteriorSamples, config.credibleLevel),
        posteriorSamples,
        probabilityBest: 0 // Calculate later by comparison
      })
    }
    
    // Calculate probability of being best
    calculateProbabilityBest(results)
    
    return results
  }
  
  // Sequential Testing
  export function calculateSequential(
    variations: Variation[],
    config: SequentialConfig,
    previousData?: SequentialState
  ): SequentialResult {
    const { method, alpha, beta, maxSampleSize } = config
    
    if (method === 'AGILE') {
      return calculateAGILE(variations, alpha, beta, maxSampleSize, previousData)
    } else if (method === 'mSPRT') {
      return calculateMSPRT(variations, alpha, beta, previousData)
    }
    
    throw new Error(`Unknown sequential method: ${method}`)
  }
  
  // Multi-Armed Bandit
  export function calculateMAB(
    variations: Variation[],
    config: MABConfig,
    historicalData?: MABState
  ): MABResult {
    const { algorithm, explorationRate } = config
    
    switch (algorithm) {
      case 'thompson':
        return thompsonSampling(variations, historicalData)
      case 'ucb':
        return upperConfidenceBound(variations, explorationRate)
      case 'epsilon-greedy':
        return epsilonGreedy(variations, explorationRate)
      default:
        throw new Error(`Unknown MAB algorithm: ${algorithm}`)
    }
  }
  
  // Thompson Sampling implementation
  function thompsonSampling(
    variations: Variation[],
    state?: MABState
  ): MABResult {
    const samples = variations.map(v => {
      const alpha = (state?.successes[v.id] || 0) + v.conversions + 1
      const beta = (state?.failures[v.id] || 0) + (v.visitors - v.conversions) + 1
      return {
        variation: v.id,
        sample: jstat.beta.sample(alpha, beta),
        alpha,
        beta
      }
    })
    
    // Recommend variant with highest sample
    const recommended = samples.reduce((best, current) => 
      current.sample > best.sample ? current : best
    )
    
    return {
      recommendedVariation: recommended.variation,
      allocationProbabilities: calculateAllocationProbabilities(samples),
      expectedRegret: calculateExpectedRegret(variations, samples)
    }
  }
  
  // Bootstrap Confidence Intervals
  export function bootstrapConfidenceInterval(
    data: number[],
    statistic: (sample: number[]) => number,
    confidence: number = 0.95,
    iterations: number = 10000
  ): [number, number] {
    const bootstrapStats = []
    
    for (let i = 0; i < iterations; i++) {
      const sample = resampleWithReplacement(data)
      bootstrapStats.push(statistic(sample))
    }
    
    bootstrapStats.sort((a, b) => a - b)
    const alpha = 1 - confidence
    const lower = bootstrapStats[Math.floor(alpha / 2 * iterations)]
    const upper = bootstrapStats[Math.floor((1 - alpha / 2) * iterations)]
    
    return [lower, upper]
  }
  
  // Multiple Testing Correction
  export function adjustPValue(
    pValue: number,
    numTests: number,
    method: 'bonferroni' | 'fdr' | 'holm'
  ): number {
    switch (method) {
      case 'bonferroni':
        return Math.min(pValue * numTests, 1)
      case 'holm':
        // Holm-Bonferroni method (requires all p-values)
        return pValue * numTests // Simplified
      case 'fdr':
        // Benjamini-Hochberg FDR (requires all p-values)
        return pValue * numTests // Simplified
      default:
        return pValue
    }
  }
  ```

#### Ticket 3.4.3: Enhanced Sample Size Calculator
- **Description:** Calculate required sample size with advanced planning features
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Support different statistical methods:
    - Frequentist sample size
    - Bayesian sample size with prior influence
    - Sequential testing sample size ranges
    - Multi-armed bandit convergence estimates
  - Advanced inputs:
    - Baseline metric value and variance
    - Minimum detectable effect (absolute and relative)
    - Statistical power selection (70%, 80%, 90%, 95%)
    - One-sided vs two-sided testing
    - Multiple testing correction impact
  - Traffic allocation optimization:
    - Unequal allocation ratios
    - Multi-variant optimal allocation
    - Budget constraints
  - Time-based adjustments:
    - Seasonality patterns
    - Day-of-week effects
    - Holiday impacts
    - Ramp-up periods
  - Practical considerations:
    - Practical significance thresholds
    - Business impact calculations
    - Cost per sample
    - Opportunity cost modeling
  - Outputs:
    - Sample size per variation
    - Total sample required
    - Expected test duration
    - Cost estimates
    - Power curves
    - Sensitivity analysis
- **Dependencies:** 3.4.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/abtest/SampleSizeCalculator.tsx
  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
  import { motion } from 'framer-motion'
  
  interface SampleSizeInputs {
    method: 'frequentist' | 'bayesian' | 'sequential' | 'mab'
    metric: {
      type: 'binary' | 'continuous'
      baseline: number
      variance?: number
    }
    effect: {
      type: 'absolute' | 'relative'
      value: number
      practicalSignificance?: number
    }
    statisticalParams: {
      confidenceLevel: number
      power: number
      testDirection: 'one-sided' | 'two-sided'
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
  
  interface SeasonalityPattern {
    dayOfWeek: number[] // 7 values representing multipliers
    monthly: number[] // 12 values for months
    holidays: { date: string; impact: number }[]
  }
  
  export function SampleSizeCalculator({ 
    onUpdate 
  }: { 
    onUpdate: (sampleSize: SampleSizeResult) => void 
  }) {
    const [inputs, setInputs] = useState<SampleSizeInputs>({
      method: 'frequentist',
      metric: {
        type: 'binary',
        baseline: 5,
        variance: undefined
      },
      effect: {
        type: 'relative',
        value: 20,
        practicalSignificance: 5
      },
      statisticalParams: {
        confidenceLevel: 95,
        power: 80,
        testDirection: 'two-sided',
        multipleComparisons: 1
      },
      traffic: {
        daily: 1000,
        allocation: { control: 50, variant: 50 },
        seasonality: undefined,
        constraints: undefined
      }
    })
    
    const results = useMemo(() => 
      calculateSampleSizeWithMethod(inputs), [inputs]
    )
    
    const powerCurveData = useMemo(() => 
      generatePowerCurve(inputs), [inputs]
    )
    
    return (
      <div className="sample-size-calculator space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Inputs */}
          <div className="space-y-4">
            <MethodSelector
              value={inputs.method}
              onChange={(method) => setInputs({ ...inputs, method })}
            />
            
            <MetricConfiguration
              metric={inputs.metric}
              onChange={(metric) => setInputs({ ...inputs, metric })}
            />
            
            <EffectSizeInput
              effect={inputs.effect}
              baseline={inputs.metric.baseline}
              onChange={(effect) => setInputs({ ...inputs, effect })}
            />
            
            <StatisticalParameters
              params={inputs.statisticalParams}
              method={inputs.method}
              onChange={(params) => setInputs({ ...inputs, statisticalParams: params })}
            />
            
            <TrafficConfiguration
              traffic={inputs.traffic}
              onChange={(traffic) => setInputs({ ...inputs, traffic })}
            />
          </div>
          
          {/* Right Column: Results */}
          <div className="space-y-4">
            <SampleSizeResults results={results} />
            
            <DurationEstimate
              sampleSize={results.total}
              traffic={inputs.traffic}
              seasonality={inputs.traffic.seasonality}
            />
            
            <CostAnalysis
              sampleSize={results.total}
              constraints={inputs.traffic.constraints}
            />
            
            <PowerCurve data={powerCurveData} />
          </div>
        </div>
        
        <SensitivityAnalysis
          baseInputs={inputs}
          onScenarioSelect={(scenario) => setInputs(scenario)}
        />
      </div>
    )
  }
  
  function calculateSampleSizeWithMethod(
    inputs: SampleSizeInputs
  ): SampleSizeResult {
    switch (inputs.method) {
      case 'frequentist':
        return calculateFrequentistSampleSize(inputs)
      case 'bayesian':
        return calculateBayesianSampleSize(inputs)
      case 'sequential':
        return calculateSequentialSampleSize(inputs)
      case 'mab':
        return calculateMABSampleSize(inputs)
    }
  }
  
  function calculateFrequentistSampleSize(inputs: SampleSizeInputs): SampleSizeResult {
    const { metric, effect, statisticalParams } = inputs
    
    if (metric.type === 'binary') {
      const p1 = metric.baseline / 100
      const delta = effect.type === 'relative' 
        ? effect.value / 100 
        : effect.value / 100
      const p2 = effect.type === 'relative' 
        ? p1 * (1 + delta)
        : p1 + delta
      
      const alpha = 1 - statisticalParams.confidenceLevel / 100
      const beta = 1 - statisticalParams.power / 100
      
      // Adjust for multiple comparisons
      const adjustedAlpha = statisticalParams.multipleComparisons 
        ? alpha / statisticalParams.multipleComparisons
        : alpha
      
      const zAlpha = statisticalParams.testDirection === 'two-sided'
        ? inv(1 - adjustedAlpha/2, 'normal')
        : inv(1 - adjustedAlpha, 'normal')
      const zBeta = inv(1 - beta, 'normal')
      
      const pooled = (p1 + p2) / 2
      
      const n = Math.ceil(
        2 * Math.pow(zAlpha + zBeta, 2) * pooled * (1 - pooled) / 
        Math.pow(p2 - p1, 2)
      )
      
      // Adjust for unequal allocation
      const allocationRatio = Object.values(inputs.traffic.allocation)
      const adjustedN = adjustUnequelAllocation(n, allocationRatio)
      
      return {
        perVariation: adjustedN,
        total: adjustedN * Object.keys(inputs.traffic.allocation).length,
        powerAchieved: statisticalParams.power,
        notes: [
          statisticalParams.multipleComparisons > 1 
            ? `Adjusted for ${statisticalParams.multipleComparisons} comparisons`
            : null,
          allocationRatio.some(r => r !== allocationRatio[0])
            ? 'Adjusted for unequal traffic allocation'
            : null
        ].filter(Boolean)
      }
    } else {
      // Continuous metric calculation
      // Implementation for t-test sample size
    }
  }
  ```

#### Ticket 3.4.4: Advanced Results Visualization
- **Description:** Build comprehensive interactive visualizations for test results
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Test timeline visualization:
    - Daily/hourly metric trends
    - Cumulative results over time
    - Annotations for events and changes
    - Statistical significance evolution
    - Sample size accumulation
  - Statistical visualizations:
    - Conversion rates with confidence/credible intervals
    - Posterior distributions (Bayesian)
    - Sequential testing boundaries
    - P-value evolution
    - Effect size with practical significance zones
  - Comparison visualizations:
    - Forest plots for multiple variants
    - Uplift distributions
    - Winner probability over time
    - Risk vs reward scatter plots
  - Segment analysis:
    - Performance by user segments
    - Device/browser breakdowns
    - Geographic performance
    - Time-of-day patterns
  - Interactive features:
    - Hover for detailed stats
    - Click to drill down
    - Zoom and pan on timeline
    - Filter by date range
    - Toggle between metrics
  - Export capabilities:
    - Export charts as PNG/SVG
    - Download raw data
    - Generate presentation slides
  - Mobile responsive design
- **Dependencies:** 3.4.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/abtest/TestResultsVisualization.tsx
  import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, ReferenceArea
  } from 'recharts'
  import { motion, AnimatePresence } from 'framer-motion'
  
  interface TestResultsVisualizationProps {
    test: AbTest
    results: TestResults
    timeSeriesData?: TimeSeriesData[]
    segmentData?: SegmentAnalysis
  }
  
  export function TestResultsVisualization({
    test,
    results,
    timeSeriesData,
    segmentData
  }: TestResultsVisualizationProps) {
    const [activeView, setActiveView] = useState<
      'timeline' | 'statistical' | 'segments' | 'comparison'
    >('timeline')
    const [selectedMetric, setSelectedMetric] = useState(test.config.metric)
    const [dateRange, setDateRange] = useState<[Date, Date]>([
      test.metadata.startDate,
      new Date()
    ])
    
    return (
      <div className="test-results-visualization space-y-6">
        {/* View Selector */}
        <div className="flex items-center justify-between">
          <ViewSelector
            active={activeView}
            onChange={setActiveView}
            options={[
              { value: 'timeline', label: 'Timeline', icon: TimelineIcon },
              { value: 'statistical', label: 'Statistical', icon: StatsIcon },
              { value: 'segments', label: 'Segments', icon: SegmentIcon },
              { value: 'comparison', label: 'Comparison', icon: CompareIcon }
            ]}
          />
          
          <div className="flex items-center gap-4">
            <MetricSelector
              value={selectedMetric}
              onChange={setSelectedMetric}
              availableMetrics={getAvailableMetrics(test)}
            />
            
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              min={test.metadata.startDate}
              max={new Date()}
            />
            
            <ExportMenu
              onExport={(format) => handleExport(format, activeView)}
            />
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'timeline' && (
              <TimelineView
                data={timeSeriesData}
                results={results}
                metric={selectedMetric}
                dateRange={dateRange}
                test={test}
              />
            )}
            
            {activeView === 'statistical' && (
              <StatisticalView
                results={results}
                test={test}
                metric={selectedMetric}
              />
            )}
            
            {activeView === 'segments' && (
              <SegmentAnalysisView
                data={segmentData}
                test={test}
                metric={selectedMetric}
              />
            )}
            
            {activeView === 'comparison' && (
              <ComparisonView
                test={test}
                results={results}
                metric={selectedMetric}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }
  
  // Timeline View Component
  function TimelineView({ data, results, metric, dateRange, test }) {
    const chartData = processTimeSeriesData(data, metric, dateRange)
    const annotations = getTestAnnotations(test)
    
    return (
      <div className="timeline-view space-y-6">
        {/* Cumulative Conversion Rate */}
        <ChartCard title="Cumulative Performance">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value) => formatMetric(value, metric)}
              />
              <Legend />
              
              {test.variations.map((variation, index) => (
                <Line
                  key={variation.id}
                  type="monotone"
                  dataKey={`${variation.id}_rate`}
                  name={variation.name}
                  stroke={getVariationColor(index)}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              
              {/* Confidence intervals */}
              {test.variations.slice(1).map((variation, index) => (
                <Area
                  key={`${variation.id}_ci`}
                  type="monotone"
                  dataKey={`${variation.id}_ci_upper`}
                  dataKey2={`${variation.id}_ci_lower`}
                  fill={getVariationColor(index + 1)}
                  fillOpacity={0.1}
                  stroke="none"
                />
              ))}
              
              {/* Annotations */}
              {annotations.map((annotation, index) => (
                <ReferenceLine
                  key={index}
                  x={annotation.date}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={<AnnotationLabel text={annotation.text} />}
                />
              ))}
              
              {/* Significance regions */}
              {getSignificanceRegions(chartData, results).map((region, index) => (
                <ReferenceArea
                  key={index}
                  x1={region.start}
                  x2={region.end}
                  fill="#10b981"
                  fillOpacity={0.1}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* Daily Results */}
        <ChartCard title="Daily Performance">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getDailyData(chartData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {test.variations.map((variation, index) => (
                <Bar
                  key={variation.id}
                  dataKey={`${variation.id}_daily`}
                  name={variation.name}
                  fill={getVariationColor(index)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* Statistical Significance Evolution */}
        <ChartCard title="Statistical Significance Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                domain={[0, 1]}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip
                formatter={(value) => `p-value: ${value.toFixed(4)}`}
              />
              
              <ReferenceLine 
                y={0.05} 
                stroke="#ef4444" 
                strokeDasharray="3 3"
                label="α = 0.05"
              />
              
              {test.variations.slice(1).map((variation, index) => (
                <Line
                  key={variation.id}
                  type="monotone"
                  dataKey={`${variation.id}_pvalue`}
                  name={`${variation.name} p-value`}
                  stroke={getVariationColor(index + 1)}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    )
  }
  ```

#### Ticket 3.4.5: Test Planning & Power Analysis
- **Description:** Build comprehensive test planning tools with power analysis
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Interactive power curve visualization:
    - Show power vs sample size
    - Power vs effect size
    - Multiple comparison adjustments
    - Interactive tooltips
  - MDE (Minimum Detectable Effect) calculator:
    - Given sample size, what effect can be detected
    - Business impact modeling
    - ROI of different effect sizes
  - Runtime estimation:
    - Traffic allocation scenarios
    - Seasonality impact on duration
    - Early stopping probability
  - Budget calculator:
    - Cost per test participant
    - Opportunity cost of testing
    - Expected value calculations
  - Risk assessment:
    - Type I error (false positives)
    - Type II error (false negatives)
    - Business risk quantification
    - Decision framework
- **Dependencies:** 3.4.3
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/abtest/TestPlanning.tsx
  export function TestPlanning({ 
    onPlanUpdate 
  }: { 
    onPlanUpdate: (plan: TestPlan) => void 
  }) {
    const [planningMode, setPlanningMode] = useState<'power' | 'mde' | 'budget'>('power')
    
    return (
      <div className="test-planning space-y-6">
        <ModeTabs
          active={planningMode}
          onChange={setPlanningMode}
          tabs={[
            { id: 'power', label: 'Power Analysis', icon: PowerIcon },
            { id: 'mde', label: 'MDE Calculator', icon: TargetIcon },
            { id: 'budget', label: 'Budget & Risk', icon: BudgetIcon }
          ]}
        />
        
        {planningMode === 'power' && (
          <PowerAnalysis onUpdate={handlePowerUpdate} />
        )}
        
        {planningMode === 'mde' && (
          <MDECalculator onUpdate={handleMDEUpdate} />
        )}
        
        {planningMode === 'budget' && (
          <BudgetRiskAnalysis onUpdate={handleBudgetUpdate} />
        )}
      </div>
    )
  }
  
  function PowerAnalysis({ onUpdate }) {
    const [inputs, setInputs] = useState({
      baselineRate: 5,
      sampleSizeRange: [100, 10000],
      effectSizeRange: [5, 50],
      alpha: 0.05,
      testType: 'two-sided'
    })
    
    const powerCurveData = useMemo(() => 
      generatePowerCurves(inputs), [inputs]
    )
    
    return (
      <div className="power-analysis">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <PowerInputs
              inputs={inputs}
              onChange={setInputs}
            />
            
            <InterpretationGuide
              power={calculateCurrentPower(inputs)}
            />
          </div>
          
          <div className="space-y-4">
            <ChartCard title="Power Curves">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={powerCurveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sampleSize"
                    label={{ value: 'Sample Size per Variation', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    domain={[0, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    label={{ value: 'Statistical Power', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value) => `${(value * 100).toFixed(1)}%`}
                  />
                  <Legend />
                  
                  <ReferenceLine 
                    y={0.8} 
                    stroke="#10b981" 
                    strokeDasharray="3 3"
                    label="80% Power"
                  />
                  
                  {[10, 20, 30, 50].map(effect => (
                    <Line
                      key={effect}
                      type="monotone"
                      dataKey={`power_${effect}`}
                      name={`${effect}% Effect`}
                      stroke={getEffectColor(effect)}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <RecommendationsCard
              inputs={inputs}
              targetPower={0.8}
            />
          </div>
        </div>
      </div>
    )
  }
  ```

#### Ticket 3.4.6: Test Templates & Benchmarks
- **Description:** Create industry-specific templates and benchmarks for common test scenarios
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Industry templates:
    - E-commerce (cart, checkout, product page)
    - SaaS (onboarding, pricing, features)
    - Mobile apps (install, engagement, retention)
    - Content sites (engagement, subscriptions)
    - B2B (lead gen, demo requests)
  - Common hypotheses library:
    - UI/UX changes
    - Pricing experiments
    - Feature rollouts
    - Content variations
    - Messaging tests
  - Benchmark data:
    - Typical conversion rates by industry
    - Expected effect sizes
    - Test success rates
    - Duration benchmarks
  - Best practices:
    - Pre-test checklists
    - Common pitfalls
    - Success factors
    - Post-test actions
- **Dependencies:** 3.4.1
- **Implementation Notes:**
  ```typescript
  // src/lib/templates/abTestTemplates.ts
  export const AB_TEST_TEMPLATES: TestTemplate[] = [
    {
      id: 'ecommerce-checkout',
      name: 'E-commerce Checkout Optimization',
      category: 'ecommerce',
      description: 'Optimize checkout flow to reduce cart abandonment',
      defaultConfig: {
        metric: 'conversion',
        secondaryMetrics: ['revenue', 'cart_abandonment'],
        minimumEffect: 10,
        confidenceLevel: 95,
        power: 80
      },
      hypothesis: {
        template: 'By {change}, we expect to {impact} because {reason}',
        examples: [
          'By reducing checkout steps from 4 to 2, we expect to increase conversion by 15% because users will experience less friction',
          'By adding trust badges, we expect to reduce cart abandonment by 10% because users will feel more secure'
        ]
      },
      benchmarks: {
        baselineConversion: { min: 2, avg: 3.5, max: 5 },
        typicalUplift: { min: 5, avg: 12, max: 25 },
        testDuration: { min: 14, avg: 21, max: 35 }
      },
      checklist: [
        'Ensure tracking is properly set up for all steps',
        'Consider mobile vs desktop separately',
        'Account for payment method variations',
        'Monitor for increased fraud'
      ]
    }
  ]
  ```

#### Ticket 3.4.7: History & Comparison
- **Description:** Build test history tracking and comparison features
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Test history management:
    - Save complete test results
    - Track test metadata
    - Version control for test configs
    - Archive old tests
  - Search and filtering:
    - By date range
    - By test status
    - By metric type
    - By winning variation
    - By team/owner
  - Comparison features:
    - Compare multiple tests
    - Meta-analysis across tests
    - Learning extraction
    - Pattern identification
  - Learning repository:
    - Document insights
    - Tag successful patterns
    - Track failure reasons
    - Build knowledge base
  - Analytics:
    - Test velocity tracking
    - Success rate trends
    - Average uplift by category
    - ROI of testing program
- **Dependencies:** 3.4.1, 3.4.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/abtest/TestHistory.tsx
  export function TestHistory({ 
    onLoadTest,
    onCompareTests 
  }: {
    onLoadTest: (test: SavedTest) => void
    onCompareTests: (tests: SavedTest[]) => void
  }) {
    const [testHistory, setTestHistory] = useStorage<SavedTest[]>("abtest-history", [])
    const [filters, setFilters] = useState<TestFilters>({
      dateRange: 'all',
      status: 'all',
      metric: 'all',
      winner: 'all'
    })
    const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list')
    
    const filteredTests = useMemo(() => 
      applyFilters(testHistory, filters), [testHistory, filters]
    )
    
    const analytics = useMemo(() => 
      calculateTestingAnalytics(testHistory), [testHistory]
    )
    
    return (
      <div className="test-history">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Test History</h3>
          
          <div className="flex items-center gap-4">
            <SearchInput
              placeholder="Search tests..."
              onChange={handleSearch}
            />
            
            <FilterDropdown
              filters={filters}
              onChange={setFilters}
            />
            
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>
        
        {viewMode === 'list' ? (
          <TestList
            tests={filteredTests}
            selectedTests={selectedTests}
            onSelectTest={handleSelectTest}
            onLoadTest={onLoadTest}
            onCompareTests={() => onCompareTests(getSelectedTests())}
          />
        ) : (
          <TestingAnalytics
            analytics={analytics}
            tests={testHistory}
          />
        )}
        
        <LearningRepository
          tests={testHistory}
          onAddInsight={handleAddInsight}
        />
      </div>
    )
  }
  ```

#### Ticket 3.4.8: Export & Reporting
- **Description:** Add comprehensive export and reporting capabilities
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Export formats:
    - CSV with all raw data
    - JSON for data portability
    - PDF executive summary
    - PowerPoint presentation
  - Report templates:
    - Executive summary
    - Technical deep dive
    - Stakeholder update
    - Learning document
  - Auto-generated content:
    - Key findings
    - Recommendations
    - Next steps
    - Methodology section
  - Sharing features:
    - Generate shareable URL
    - Email reports
    - Slack integration
    - API endpoints
  - Customization:
    - Company branding
    - Custom templates
    - Selective data export
- **Dependencies:** 3.4.4
- **Implementation Notes:**
  ```typescript
  // src/lib/export/abTestExport.ts
  export async function exportTestResults(
    test: AbTest,
    results: TestResults,
    format: 'csv' | 'json' | 'pdf' | 'pptx',
    options: ExportOptions = {}
  ): Promise<void> {
    switch (format) {
      case 'csv':
        return exportToCSV(test, results, options)
      case 'json':
        return exportToJSON(test, results, options)
      case 'pdf':
        return exportToPDF(test, results, options)
      case 'pptx':
        return exportToPowerPoint(test, results, options)
    }
  }
  
  async function exportToPDF(
    test: AbTest,
    results: TestResults,
    options: ExportOptions
  ): Promise<void> {
    const doc = await generatePDF({
      title: `A/B Test Report: ${test.metadata.name}`,
      subtitle: `${test.metadata.hypothesis}`,
      date: new Date(),
      branding: options.branding,
      sections: [
        {
          title: 'Executive Summary',
          content: generateExecutiveSummary(test, results)
        },
        {
          title: 'Test Results',
          type: 'results',
          data: {
            winner: results.winner,
            confidence: results.confidence,
            uplift: results.uplift,
            significance: results.isSignificant
          }
        },
        {
          title: 'Statistical Analysis',
          type: 'charts',
          charts: [
            generateConversionChart(test, results),
            generateConfidenceIntervalChart(test, results),
            generateTimelineChart(test, results)
          ]
        },
        {
          title: 'Methodology',
          content: generateMethodologySection(test)
        },
        {
          title: 'Recommendations',
          content: generateRecommendations(test, results)
        },
        {
          title: 'Appendix',
          subsections: [
            { title: 'Raw Data', type: 'table', data: getRawData(test) },
            { title: 'Statistical Details', content: getStatDetails(results) }
          ]
        }
      ]
    })
    
    doc.save(`ab-test-${test.metadata.name}-${Date.now()}.pdf`)
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ RICE Score Calculator with visualization and export
- ✅ TAM/SAM/SOM Calculator with multiple calculation methods
- ✅ ROI Calculator with advanced metrics, risk assessment, and scenario analysis
- 🔲 A/B Test Calculator with statistical significance testing
- ✅ Reusable calculation utilities and components
- ⏳ Industry templates and benchmarks (partial implementation)
- ✅ Comprehensive validation and help systems
- ✅ Export to multiple formats (CSV, JSON, PDF) with sharing capabilities

### Key Milestones:
1. **Calculator Framework Ready** - Base components and utilities complete
2. **All Calculators Functional** - Core calculations working
3. **Visualizations Complete** - Charts and graphs implemented
4. **Export Features Added** - CSV and PDF export working

### Next Steps:
- Proceed to Epic 4: Data Feeds - Connect external data sources
- UX team reviews calculator workflows
- Create calculator templates for common scenarios
- Add benchmark data for industry comparisons