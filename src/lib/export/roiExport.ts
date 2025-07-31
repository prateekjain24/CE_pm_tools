import { calculateMonthlyProjections, formatCurrency, getRoiCategory } from "~/lib/calculators/roi"
import type { RoiCalculation, RoiMetrics, RoiScenario } from "~/types"

/**
 * Download a file to the user's computer
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export ROI calculations to CSV format
 */
export function exportRoiToCSV(calculations: RoiCalculation[]): void {
  const headers = [
    "Date",
    "Project Name",
    "Initial Investment",
    "Total Costs",
    "Total Benefits",
    "ROI %",
    "NPV",
    "IRR %",
    "Payback Period (months)",
    "Break-even Month",
    "Time Horizon",
    "Discount Rate %",
    "Currency",
    "Notes",
  ]

  const rows = calculations.map((calc) => {
    const totalCosts =
      calc.initialCost +
      calc.recurringCosts.reduce(
        (sum, cost) => sum + (cost.isRecurring ? cost.amount * cost.months : cost.amount),
        0
      )
    const totalBenefits = calc.benefits.reduce((sum, benefit) => {
      const probability = (benefit.probability ?? 100) / 100
      return (
        sum + (benefit.isRecurring ? benefit.amount * benefit.months : benefit.amount) * probability
      )
    }, 0)

    return [
      new Date(calc.savedAt).toLocaleDateString(),
      calc.name,
      calc.initialCost,
      totalCosts,
      totalBenefits,
      calc.metrics?.simpleRoi.toFixed(1) || "N/A",
      calc.metrics?.npv.toFixed(0) || "N/A",
      calc.metrics?.irr.toFixed(1) || "N/A",
      calc.metrics?.paybackPeriod.toFixed(1) || "N/A",
      calc.metrics?.breakEvenMonth || "N/A",
      calc.timeHorizon,
      calc.discountRate,
      calc.currency,
      calc.notes || "",
    ]
  })

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell)
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(",")
    ),
  ].join("\n")

  const filename = `roi-calculations-${new Date().toISOString().split("T")[0]}.csv`
  downloadFile(csvContent, filename, "text/csv")
}

/**
 * Export detailed ROI calculation to PDF format
 */
export async function exportRoiToPDF(
  calculation: RoiCalculation,
  metrics?: RoiMetrics,
  scenarios?: RoiScenario[]
): Promise<void> {
  const roiMetrics = metrics || calculation.metrics
  if (!roiMetrics) {
    alert("No metrics available for this calculation")
    return
  }

  const roiCategory = getRoiCategory(roiMetrics.simpleRoi)
  const _projections = calculateMonthlyProjections(calculation)

  // Calculate totals
  const totalCosts =
    calculation.initialCost +
    calculation.recurringCosts.reduce(
      (sum, cost) => sum + (cost.isRecurring ? cost.amount * cost.months : cost.amount),
      0
    )
  const totalBenefits = calculation.benefits.reduce((sum, benefit) => {
    const probability = (benefit.probability ?? 100) / 100
    return (
      sum + (benefit.isRecurring ? benefit.amount * benefit.months : benefit.amount) * probability
    )
  }, 0)

  // Create a new window with formatted content
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow popups to export to PDF")
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ROI Analysis Report - ${calculation.name}</title>
      <style>
        @page { margin: 1in; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 { color: #1a202c; margin-bottom: 10px; }
        h2 { color: #2d3748; margin-top: 30px; }
        h3 { color: #4a5568; margin-top: 20px; }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
        .metric-box { 
          background: #f7fafc; 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          padding: 15px;
        }
        .metric-value { font-size: 24px; font-weight: bold; color: #1a202c; }
        .metric-label { font-size: 14px; color: #4a5568; margin-bottom: 5px; }
        .roi-score { 
          text-align: center;
          padding: 30px;
          background: #edf2f7;
          border-radius: 12px;
          margin: 20px 0;
        }
        .roi-score-value { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .positive { color: #38a169; }
        .negative { color: #e53e3e; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f7fafc; font-weight: bold; }
        .section { margin: 30px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ROI Analysis Report</h1>
        <p><strong>Project:</strong> ${calculation.name}</p>
        ${calculation.description ? `<p><strong>Description:</strong> ${calculation.description}</p>` : ""}
        <p><strong>Date:</strong> ${new Date(calculation.savedAt).toLocaleDateString()}</p>
        <p><strong>Analysis Period:</strong> ${calculation.timeHorizon} months</p>
      </div>
      
      <div class="roi-score">
        <div class="metric-label">Return on Investment</div>
        <div class="roi-score-value ${roiMetrics.simpleRoi >= 0 ? "positive" : "negative"}">
          ${roiMetrics.simpleRoi.toFixed(1)}%
        </div>
        <div style="font-size: 18px; color: #4a5568;">${roiCategory.label} - ${roiCategory.description}</div>
      </div>
      
      <div class="section">
        <h2>Financial Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-box">
            <div class="metric-label">Net Present Value (NPV)</div>
            <div class="metric-value ${roiMetrics.npv >= 0 ? "positive" : "negative"}">
              ${formatCurrency(roiMetrics.npv, calculation.currency)}
            </div>
            <p style="font-size: 12px; color: #718096;">at ${calculation.discountRate}% discount rate</p>
          </div>
          <div class="metric-box">
            <div class="metric-label">Internal Rate of Return (IRR)</div>
            <div class="metric-value">${roiMetrics.irr.toFixed(1)}%</div>
            <p style="font-size: 12px; color: #718096;">Annualized return rate</p>
          </div>
          <div class="metric-box">
            <div class="metric-label">Payback Period</div>
            <div class="metric-value">${roiMetrics.paybackPeriod.toFixed(1)} months</div>
            <p style="font-size: 12px; color: #718096;">Time to recover investment</p>
          </div>
          <div class="metric-box">
            <div class="metric-label">Break-even Month</div>
            <div class="metric-value">
              ${roiMetrics.breakEvenMonth > 0 ? `Month ${roiMetrics.breakEvenMonth}` : "Not within horizon"}
            </div>
            <p style="font-size: 12px; color: #718096;">When cash flow turns positive</p>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Investment Summary</h2>
        <table>
          <tr>
            <td><strong>Initial Investment</strong></td>
            <td style="text-align: right;">${formatCurrency(calculation.initialCost, calculation.currency)}</td>
          </tr>
          <tr>
            <td><strong>Total Costs</strong></td>
            <td style="text-align: right;">${formatCurrency(totalCosts, calculation.currency)}</td>
          </tr>
          <tr>
            <td><strong>Total Benefits</strong></td>
            <td style="text-align: right;">${formatCurrency(totalBenefits, calculation.currency)}</td>
          </tr>
          <tr style="font-weight: bold; background: #f7fafc;">
            <td>Net Return</td>
            <td style="text-align: right;" class="${totalBenefits - totalCosts >= 0 ? "positive" : "negative"}">
              ${formatCurrency(totalBenefits - totalCosts, calculation.currency)}
            </td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h2>Cost Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Duration</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Initial Investment</td>
              <td>One-time</td>
              <td>${formatCurrency(calculation.initialCost, calculation.currency)}</td>
              <td>-</td>
              <td>${formatCurrency(calculation.initialCost, calculation.currency)}</td>
            </tr>
            ${calculation.recurringCosts
              .map(
                (cost) => `
              <tr>
                <td>${cost.description || "Unnamed cost"}</td>
                <td>${cost.category}</td>
                <td>${formatCurrency(cost.amount, calculation.currency)}</td>
                <td>${cost.months} months</td>
                <td>${formatCurrency(cost.isRecurring ? cost.amount * cost.months : cost.amount, calculation.currency)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2>Benefit Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Duration</th>
              <th>Probability</th>
              <th>Risk-adjusted Total</th>
            </tr>
          </thead>
          <tbody>
            ${calculation.benefits
              .map((benefit) => {
                const probability = (benefit.probability ?? 100) / 100
                const total =
                  (benefit.isRecurring ? benefit.amount * benefit.months : benefit.amount) *
                  probability
                return `
                <tr>
                  <td>${benefit.description || "Unnamed benefit"}</td>
                  <td>${benefit.category}</td>
                  <td>${formatCurrency(benefit.amount, calculation.currency)}</td>
                  <td>${benefit.months} months</td>
                  <td>${(probability * 100).toFixed(0)}%</td>
                  <td>${formatCurrency(total, calculation.currency)}</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
      </div>
      
      ${
        calculation.notes
          ? `
        <div class="section">
          <h2>Notes</h2>
          <p>${calculation.notes}</p>
        </div>
      `
          : ""
      }
      
      ${
        scenarios && scenarios.length > 0
          ? `
        <div class="section">
          <h2>Scenario Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>ROI %</th>
                <th>NPV</th>
                <th>Payback</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${scenarios
                .map(
                  (scenario) => `
                <tr>
                  <td>${scenario.name}</td>
                  <td>${scenario.results?.simpleRoi.toFixed(1)}%</td>
                  <td>${formatCurrency(scenario.results?.npv || 0, calculation.currency)}</td>
                  <td>${scenario.results?.paybackPeriod.toFixed(1)} months</td>
                  <td>${scenario.confidence}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : ""
      }
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()} • PM Dashboard ROI Calculator</p>
      </div>
      
      <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Print / Save as PDF
      </button>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()

  // Auto-trigger print dialog after a short delay
  setTimeout(() => {
    printWindow.print()
  }, 500)
}

/**
 * Export calculations to JSON for backup/restore
 */
export function exportRoiToJSON(calculations: RoiCalculation[]): void {
  const exportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    totalCalculations: calculations.length,
    calculations: calculations,
  }

  const jsonContent = JSON.stringify(exportData, null, 2)
  const filename = `roi-backup-${new Date().toISOString().split("T")[0]}.json`
  downloadFile(jsonContent, filename, "application/json")
}

/**
 * Import calculations from JSON file
 */
export async function importRoiFromJSON(file: File): Promise<RoiCalculation[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // Validate structure
        if (!data.calculations || !Array.isArray(data.calculations)) {
          throw new Error("Invalid file format")
        }

        // Convert dates from strings
        const calculations = data.calculations.map(
          (calc: RoiCalculation & { savedAt: string | Date }) => ({
            ...calc,
            savedAt: new Date(calc.savedAt),
          })
        )

        resolve(calculations)
      } catch {
        reject(new Error("Failed to parse JSON file"))
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

/**
 * Generate a shareable URL for a calculation
 */
export function generateShareableURL(calculation: RoiCalculation): string {
  const params = new URLSearchParams({
    name: calculation.name,
    initial: calculation.initialCost.toString(),
    horizon: calculation.timeHorizon.toString(),
    discount: calculation.discountRate.toString(),
    currency: calculation.currency,
  })

  // Add costs and benefits as compressed JSON
  const data = {
    costs: calculation.recurringCosts,
    benefits: calculation.benefits,
  }
  params.set("data", btoa(JSON.stringify(data)))

  return `${window.location.origin}/newtab?widget=roi-calculator&${params.toString()}`
}
