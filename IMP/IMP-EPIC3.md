# Epic 3: PM Calculators

## Epic Overview
Implement a comprehensive suite of Product Management calculators as widgets for the dashboard. These calculators help PMs make data-driven decisions about prioritization, market sizing, ROI analysis, and A/B testing. Each calculator includes input validation, real-time calculations, visualization, and history tracking.

**Epic Goals:**
- Build four core PM calculators (RICE, TAM/SAM/SOM, ROI, A/B Test)
- Create reusable calculation components and utilities
- Implement data visualization for results
- Add save/export functionality for calculations
- Ensure responsive design for all screen sizes

**Total Story Points:** 26 SP  
**Total Stories:** 4  
**Total Tickets:** 20  

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

## Story 3.2: TAM/SAM/SOM Calculator
**Description:** Build a market sizing calculator that helps PMs estimate Total Addressable Market, Serviceable Addressable Market, and Serviceable Obtainable Market.

**Acceptance Criteria:**
- Support both top-down and bottom-up calculations
- Visual funnel showing market segments
- Percentage-based calculations
- Comparison mode for multiple scenarios
- Market growth projections

### Tickets:

#### Ticket 3.2.1: Build TamCalculator Component
- **Description:** Create the main TAM/SAM/SOM calculator widget structure
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create widget with tabbed interface (top-down/bottom-up)
  - Add input fields for each market segment
  - Support both absolute values and percentages
  - Include market definition helper text
  - Responsive layout for different screen sizes
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/TamCalculator.tsx
  export function TamCalculator() {
    const [method, setMethod] = useState<'topDown' | 'bottomUp'>('topDown')
    const [values, setValues] = useState({
      tam: 0,
      samPercentage: 10,
      somPercentage: 1,
      // Bottom-up fields
      targetUsers: 0,
      pricePerUser: 0,
      marketPenetration: 0
    })
    
    return (
      <BaseWidget title="TAM/SAM/SOM Calculator">
        {() => (
          <div>
            <Tabs value={method} onValueChange={setMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="topDown">Top-Down</TabsTrigger>
                <TabsTrigger value="bottomUp">Bottom-Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="topDown">
                <TopDownCalculator 
                  values={values}
                  onChange={setValues}
                />
              </TabsContent>
              
              <TabsContent value="bottomUp">
                <BottomUpCalculator
                  values={values}
                  onChange={setValues}
                />
              </TabsContent>
            </Tabs>
            
            <MarketFunnel values={calculateMarkets(values, method)} />
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 3.2.2: Implement Market Sizing Calculations
- **Description:** Create calculation logic for both top-down and bottom-up approaches
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Top-down: TAM → SAM (% of TAM) → SOM (% of SAM)
  - Bottom-up: Users × Price × Penetration
  - Handle currency formatting
  - Support different time periods (monthly/annual)
  - Validate percentage inputs (0-100)
- **Dependencies:** 3.2.1
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/tam.ts
  export interface MarketSizes {
    tam: number
    sam: number
    som: number
    method: 'topDown' | 'bottomUp'
  }
  
  export function calculateTopDown(params: {
    tam: number
    samPercentage: number
    somPercentage: number
  }): MarketSizes {
    const { tam, samPercentage, somPercentage } = params
    
    const sam = tam * (samPercentage / 100)
    const som = sam * (somPercentage / 100)
    
    return { tam, sam, som, method: 'topDown' }
  }
  
  export function calculateBottomUp(params: {
    targetUsers: number
    pricePerUser: number
    marketPenetration: number
    conversionRate: number
    marketGrowthRate: number
  }): MarketSizes {
    const { targetUsers, pricePerUser, marketPenetration, conversionRate } = params
    
    // TAM = Total possible users × Average price
    const tam = targetUsers * pricePerUser
    
    // SAM = TAM × Market penetration
    const sam = tam * (marketPenetration / 100)
    
    // SOM = SAM × Realistic conversion rate
    const som = sam * (conversionRate / 100)
    
    return { tam, sam, som, method: 'bottomUp' }
  }
  
  export function formatCurrency(value: number): string {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }
  ```

#### Ticket 3.2.3: Add Percentage-Based Calculations
- **Description:** Implement percentage sliders and calculations for market segments
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create percentage slider components
  - Show real-time calculation updates
  - Display both percentage and absolute values
  - Add common benchmark percentages
  - Sync between input methods
- **Dependencies:** 3.2.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/tam/PercentageSlider.tsx
  interface PercentageSliderProps {
    label: string
    value: number
    onChange: (value: number) => void
    baseValue?: number
    benchmarks?: { label: string; value: number }[]
  }
  
  export function PercentageSlider({ 
    label, 
    value, 
    onChange, 
    baseValue,
    benchmarks 
  }: PercentageSliderProps) {
    const absoluteValue = baseValue ? baseValue * (value / 100) : 0
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">{label}</label>
          <div className="text-sm">
            <span className="font-semibold">{value}%</span>
            {baseValue && (
              <span className="text-gray-500 ml-2">
                ({formatCurrency(absoluteValue)})
              </span>
            )}
          </div>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
        />
        
        {benchmarks && (
          <div className="flex gap-2 mt-1">
            {benchmarks.map(benchmark => (
              <button
                key={benchmark.value}
                onClick={() => onChange(benchmark.value)}
                className="text-xs px-2 py-1 rounded bg-gray-100"
              >
                {benchmark.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  ```

#### Ticket 3.2.4: Create Market Funnel Visualization
- **Description:** Build visual funnel diagram showing TAM → SAM → SOM
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create funnel chart using CSS/SVG
  - Show proportional sizing
  - Display values and percentages
  - Animate on value changes
  - Support horizontal and vertical layouts
- **Dependencies:** 3.2.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/tam/MarketFunnel.tsx
  export function MarketFunnel({ values }: { values: MarketSizes }) {
    const { tam, sam, som } = values
    
    const segments = [
      { name: 'TAM', value: tam, color: 'bg-blue-500' },
      { name: 'SAM', value: sam, color: 'bg-green-500' },
      { name: 'SOM', value: som, color: 'bg-purple-500' }
    ]
    
    return (
      <div className="market-funnel mt-6">
        <div className="relative h-64">
          {segments.map((segment, index) => {
            const width = (segment.value / tam) * 100
            const offset = (100 - width) / 2
            
            return (
              <div
                key={segment.name}
                className={`absolute ${segment.color} transition-all duration-500`}
                style={{
                  width: `${width}%`,
                  height: '60px',
                  top: `${index * 80}px`,
                  left: `${offset}%`,
                  clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)'
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <div className="font-semibold">{segment.name}</div>
                  <div className="text-sm">{formatCurrency(segment.value)}</div>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>SAM as % of TAM:</span>
            <span>{((sam / tam) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>SOM as % of SAM:</span>
            <span>{((som / sam) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    )
  }
  ```

#### Ticket 3.2.5: Implement Comparison Mode
- **Description:** Allow users to compare multiple market sizing scenarios side-by-side
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Support up to 3 scenarios
  - Show comparative funnel visualization
  - Highlight differences between scenarios
  - Save and load scenarios
  - Export comparison report
- **Dependencies:** 3.2.4
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/tam/ComparisonMode.tsx
  interface Scenario {
    id: string
    name: string
    values: MarketSizes
    assumptions: string
  }
  
  export function ComparisonMode() {
    const [scenarios, setScenarios] = useState<Scenario[]>([])
    const [activeScenario, setActiveScenario] = useState(0)
    
    const addScenario = () => {
      if (scenarios.length >= 3) return
      
      setScenarios([...scenarios, {
        id: generateId(),
        name: `Scenario ${scenarios.length + 1}`,
        values: { tam: 0, sam: 0, som: 0, method: 'topDown' },
        assumptions: ''
      }])
    }
    
    return (
      <div className="comparison-mode">
        <div className="flex gap-2 mb-4">
          {scenarios.map((scenario, index) => (
            <Tab
              key={scenario.id}
              active={activeScenario === index}
              onClick={() => setActiveScenario(index)}
            >
              {scenario.name}
            </Tab>
          ))}
          {scenarios.length < 3 && (
            <Button size="sm" onClick={addScenario}>
              + Add Scenario
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map(scenario => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onUpdate={(updates) => updateScenario(scenario.id, updates)}
            />
          ))}
        </div>
        
        <ComparisonChart scenarios={scenarios} />
      </div>
    )
  }
  ```

---

## Story 3.3: ROI Calculator
**Description:** Build a Return on Investment calculator that helps PMs evaluate the financial viability of features and projects.

**Acceptance Criteria:**
- Calculate simple and advanced ROI metrics
- Support time-based calculations
- Break down costs and benefits
- Visualize ROI over time
- Compare multiple investment options

### Tickets:

#### Ticket 3.3.1: Create RoiCalculator Component
- **Description:** Build the main ROI calculator widget with input forms
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create form for costs (initial + recurring)
  - Add form for benefits (revenue + cost savings)
  - Include time period selection
  - Support different currencies
  - Add discount rate for NPV calculations
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/RoiCalculator.tsx
  export function RoiCalculator() {
    const [calculation, setCalculation] = useState<RoiCalculation>({
      initialCost: 0,
      recurringCosts: [],
      benefits: [],
      timeHorizon: 12, // months
      discountRate: 10, // percentage
      currency: 'USD'
    })
    
    return (
      <BaseWidget title="ROI Calculator">
        {() => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Initial Investment"
                type="number"
                value={calculation.initialCost}
                onChange={(e) => updateField('initialCost', e.target.value)}
                prefix={getCurrencySymbol(calculation.currency)}
              />
              
              <Select
                label="Time Horizon"
                value={calculation.timeHorizon}
                onChange={(e) => updateField('timeHorizon', e.target.value)}
              >
                <option value="6">6 months</option>
                <option value="12">1 year</option>
                <option value="24">2 years</option>
                <option value="36">3 years</option>
                <option value="60">5 years</option>
              </Select>
            </div>
            
            <CostBenefitInputs
              costs={calculation.recurringCosts}
              benefits={calculation.benefits}
              onUpdate={(type, items) => 
                setCalculation(prev => ({ ...prev, [type]: items }))
              }
            />
            
            <RoiResults calculation={calculation} />
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 3.3.2: Implement ROI Calculation Formulas
- **Description:** Create calculation functions for various ROI metrics
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Simple ROI: ((Gain - Cost) / Cost) × 100
  - NPV: Net Present Value with discount rate
  - IRR: Internal Rate of Return
  - Payback period calculation
  - Break-even analysis
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

#### Ticket 3.3.3: Add Cost/Benefit Breakdown View
- **Description:** Create detailed view showing all costs and benefits categorized
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Categorize costs (development, marketing, operations)
  - Categorize benefits (new revenue, cost savings, efficiency)
  - Show monthly and total amounts
  - Support adding/removing line items
  - Calculate subtotals by category
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

#### Ticket 3.3.4: Create ROI Timeline Visualization
- **Description:** Build chart showing ROI progression over time
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Line chart with cumulative cash flow
  - Show break-even point
  - Display monthly and cumulative ROI
  - Highlight positive/negative periods
  - Interactive tooltips with details
- **Dependencies:** 3.3.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/roi/RoiTimeline.tsx
  import { Line } from 'react-chartjs-2'
  
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

---

## Story 3.4: A/B Test Calculator
**Description:** Build a statistical significance calculator for A/B tests to help PMs make data-driven decisions about experiments.

**Acceptance Criteria:**
- Calculate statistical significance
- Determine required sample size
- Show confidence intervals
- Support multiple test variations
- Provide test duration estimates

### Tickets:

#### Ticket 3.4.1: Build AbTestCalculator Component
- **Description:** Create the main A/B test calculator widget structure
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Input fields for control and variant metrics
  - Support conversion rate and revenue metrics
  - Confidence level selection (90%, 95%, 99%)
  - One-tailed vs two-tailed test selection
  - Multiple variations support (A/B/C/D)
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/AbTestCalculator.tsx
  interface Variation {
    id: string
    name: string
    visitors: number
    conversions: number
    revenue?: number
  }
  
  export function AbTestCalculator() {
    const [testConfig, setTestConfig] = useState({
      metric: 'conversion' as 'conversion' | 'revenue',
      confidenceLevel: 95,
      testType: 'two-tailed' as 'one-tailed' | 'two-tailed',
      minimumEffect: 5 // percentage
    })
    
    const [variations, setVariations] = useState<Variation[]>([
      { id: 'control', name: 'Control', visitors: 0, conversions: 0 },
      { id: 'variant-a', name: 'Variant A', visitors: 0, conversions: 0 }
    ])
    
    return (
      <BaseWidget title="A/B Test Calculator">
        {() => (
          <div className="space-y-4">
            <TestConfiguration
              config={testConfig}
              onChange={setTestConfig}
            />
            
            <VariationInputs
              variations={variations}
              metric={testConfig.metric}
              onChange={setVariations}
            />
            
            <TestResults
              variations={variations}
              config={testConfig}
            />
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 3.4.2: Implement Statistical Calculations
- **Description:** Create functions for significance testing and confidence intervals
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Z-test for proportions
  - T-test for revenue metrics
  - Calculate p-values
  - Determine confidence intervals
  - Handle edge cases (zero conversions, small samples)
- **Dependencies:** 3.4.1
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/abtest.ts
  import { cdf, inv } from 'jstat'
  
  export interface TestResult {
    pValue: number
    isSignificant: boolean
    confidenceInterval: [number, number]
    uplift: number
    power: number
  }
  
  export function calculateABTest(
    control: Variation,
    variant: Variation,
    config: TestConfig
  ): TestResult {
    // Calculate conversion rates
    const p1 = control.conversions / control.visitors
    const p2 = variant.conversions / variant.visitors
    
    // Pooled proportion for z-test
    const pooled = (control.conversions + variant.conversions) / 
                   (control.visitors + variant.visitors)
    
    // Standard error
    const se = Math.sqrt(
      pooled * (1 - pooled) * (1/control.visitors + 1/variant.visitors)
    )
    
    // Z-score
    const z = (p2 - p1) / se
    
    // P-value (two-tailed by default)
    const pValue = config.testType === 'two-tailed' 
      ? 2 * (1 - cdf(Math.abs(z), 'normal'))
      : 1 - cdf(z, 'normal')
    
    // Confidence interval
    const alpha = 1 - config.confidenceLevel / 100
    const zCritical = inv(1 - alpha/2, 'normal')
    const margin = zCritical * se
    
    const difference = p2 - p1
    const confidenceInterval: [number, number] = [
      difference - margin,
      difference + margin
    ]
    
    // Calculate uplift
    const uplift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0
    
    // Statistical power
    const power = calculatePower(control, variant, config)
    
    return {
      pValue,
      isSignificant: pValue < alpha,
      confidenceInterval,
      uplift,
      power
    }
  }
  
  function calculatePower(
    control: Variation,
    variant: Variation,
    config: TestConfig
  ): number {
    const n = Math.min(control.visitors, variant.visitors)
    const p1 = control.conversions / control.visitors
    const delta = config.minimumEffect / 100
    const p2 = p1 * (1 + delta)
    
    const pooled = (p1 + p2) / 2
    const se = Math.sqrt(2 * pooled * (1 - pooled) / n)
    
    const alpha = 1 - config.confidenceLevel / 100
    const zAlpha = inv(1 - alpha/2, 'normal')
    const zBeta = (Math.abs(p2 - p1) - zAlpha * se) / 
                  Math.sqrt(p1 * (1 - p1) / n + p2 * (1 - p2) / n)
    
    return cdf(zBeta, 'normal')
  }
  ```

#### Ticket 3.4.3: Add Sample Size Calculator
- **Description:** Calculate required sample size for desired statistical power
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Input baseline conversion rate
  - Specify minimum detectable effect
  - Choose statistical power (80%, 90%)
  - Calculate for each variation
  - Estimate test duration based on traffic
- **Dependencies:** 3.4.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/abtest/SampleSizeCalculator.tsx
  export function SampleSizeCalculator() {
    const [inputs, setInputs] = useState({
      baselineConversion: 5, // percentage
      minimumEffect: 20, // percentage relative uplift
      confidenceLevel: 95,
      power: 80,
      variations: 2,
      dailyTraffic: 1000
    })
    
    const sampleSize = calculateSampleSize(inputs)
    const duration = Math.ceil(sampleSize.perVariation / inputs.dailyTraffic)
    
    return (
      <div className="sample-size-calculator">
        <h3 className="font-semibold mb-3">Sample Size Calculator</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Baseline Conversion Rate (%)"
            type="number"
            value={inputs.baselineConversion}
            onChange={(e) => updateInput('baselineConversion', e.target.value)}
          />
          
          <Input
            label="Minimum Detectable Effect (%)"
            type="number"
            value={inputs.minimumEffect}
            onChange={(e) => updateInput('minimumEffect', e.target.value)}
          />
          
          <Select
            label="Statistical Power"
            value={inputs.power}
            onChange={(e) => updateInput('power', e.target.value)}
          >
            <option value="80">80%</option>
            <option value="90">90%</option>
          </Select>
          
          <Input
            label="Daily Traffic"
            type="number"
            value={inputs.dailyTraffic}
            onChange={(e) => updateInput('dailyTraffic', e.target.value)}
          />
        </div>
        
        <div className="results bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Per Variation</div>
              <div className="text-2xl font-semibold">
                {sampleSize.perVariation.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Sample</div>
              <div className="text-2xl font-semibold">
                {sampleSize.total.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Est. Duration</div>
              <div className="text-2xl font-semibold">
                {duration} days
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Per Variation/Day</div>
              <div className="text-2xl font-semibold">
                {Math.floor(inputs.dailyTraffic / inputs.variations)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  function calculateSampleSize(inputs: SampleSizeInputs): {
    perVariation: number
    total: number
  } {
    const { baselineConversion, minimumEffect, confidenceLevel, power } = inputs
    
    const p1 = baselineConversion / 100
    const delta = minimumEffect / 100
    const p2 = p1 * (1 + delta)
    
    const alpha = 1 - confidenceLevel / 100
    const beta = 1 - power / 100
    
    const zAlpha = inv(1 - alpha/2, 'normal')
    const zBeta = inv(1 - beta, 'normal')
    
    const pooled = (p1 + p2) / 2
    
    const n = Math.ceil(
      2 * Math.pow(zAlpha + zBeta, 2) * pooled * (1 - pooled) / 
      Math.pow(p2 - p1, 2)
    )
    
    return {
      perVariation: n,
      total: n * inputs.variations
    }
  }
  ```

#### Ticket 3.4.4: Create Test Results Visualization
- **Description:** Build visual representation of A/B test results
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Show conversion rates with error bars
  - Display significance indicators
  - Visualize confidence intervals
  - Color code winning/losing variations
  - Add result interpretation text
- **Dependencies:** 3.4.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/abtest/TestResultsDisplay.tsx
  export function TestResultsDisplay({ 
    variations, 
    results 
  }: {
    variations: Variation[]
    results: TestResult[]
  }) {
    const control = variations[0]
    const hasWinner = results.some(r => r.isSignificant && r.uplift > 0)
    
    return (
      <div className="test-results">
        <div className="mb-4">
          <h3 className="font-semibold">Test Results</h3>
          {hasWinner ? (
            <p className="text-green-600">
              ✓ Statistically significant winner found!
            </p>
          ) : (
            <p className="text-gray-600">
              No significant difference detected yet
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          {variations.map((variation, index) => {
            const result = index === 0 ? null : results[index - 1]
            const conversionRate = variation.conversions / variation.visitors * 100
            
            return (
              <VariationResult
                key={variation.id}
                variation={variation}
                conversionRate={conversionRate}
                result={result}
                isControl={index === 0}
                isWinner={result?.isSignificant && result?.uplift > 0}
              />
            )
          })}
        </div>
        
        <ConfidenceIntervalChart
          variations={variations}
          results={results}
        />
        
        <ResultInterpretation
          results={results}
          sampleSize={variations.reduce((sum, v) => sum + v.visitors, 0)}
        />
      </div>
    )
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ RICE Score Calculator with visualization and export
- ✅ TAM/SAM/SOM Calculator with multiple calculation methods
- ✅ ROI Calculator with NPV, IRR, and timeline views
- ✅ A/B Test Calculator with statistical significance testing
- ✅ Reusable calculation utilities and components

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