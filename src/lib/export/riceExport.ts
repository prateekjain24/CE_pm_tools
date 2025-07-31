import { getRiceScoreCategory } from "~/lib/calculators/rice"
import type { RiceScore } from "~/types"

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
 * Export RICE calculations to CSV format
 */
export function exportRiceToCSV(calculations: RiceScore[]): void {
  const headers = [
    "Date",
    "Name",
    "Reach",
    "Impact",
    "Confidence (%)",
    "Effort",
    "Score",
    "Category",
    "Notes",
  ]

  const rows = calculations.map((calc) => {
    const category = getRiceScoreCategory(calc.score)
    return [
      new Date(calc.savedAt).toLocaleDateString(),
      calc.name,
      calc.reach,
      calc.impact,
      Math.round(calc.confidence * 100), // Convert decimal to percentage
      calc.effort,
      calc.score,
      category.label,
      calc.notes || "",
    ]
  })

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma
          const cellStr = String(cell)
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(",")
    ),
  ].join("\n")

  const filename = `rice-calculations-${new Date().toISOString().split("T")[0]}.csv`
  downloadFile(csvContent, filename, "text/csv")
}

/**
 * Export a single RICE calculation to PDF format
 * Using browser print functionality for simplicity
 */
export async function exportRiceToPDF(calculation: RiceScore): Promise<void> {
  const category = getRiceScoreCategory(calculation.score)

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
      <title>RICE Score Report - ${calculation.name}</title>
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
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .score-box { 
          background: #f7fafc; 
          border: 2px solid #cbd5e0; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0;
          text-align: center;
        }
        .score { font-size: 48px; font-weight: bold; color: #2b6cb0; margin: 10px 0; }
        .category { font-size: 20px; color: #4a5568; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric { background: #edf2f7; padding: 15px; border-radius: 6px; }
        .metric-label { font-weight: bold; color: #4a5568; }
        .metric-value { font-size: 24px; color: #1a202c; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>RICE Score Report</h1>
        <p><strong>Project:</strong> ${calculation.name}</p>
        <p><strong>Date:</strong> ${new Date(calculation.savedAt).toLocaleDateString()}</p>
      </div>
      
      <div class="score-box">
        <div class="score">${calculation.score}</div>
        <div class="category">${category.label}</div>
        <p>${category.description}</p>
      </div>
      
      <h2>Calculation Details</h2>
      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Reach</div>
          <div class="metric-value">${calculation.reach.toLocaleString()}</div>
          <p>Users impacted in first quarter</p>
        </div>
        <div class="metric">
          <div class="metric-label">Impact</div>
          <div class="metric-value">${calculation.impact}×</div>
          <p>Improvement multiplier</p>
        </div>
        <div class="metric">
          <div class="metric-label">Confidence</div>
          <div class="metric-value">${Math.round(calculation.confidence * 100)}%</div>
          <p>Certainty level</p>
        </div>
        <div class="metric">
          <div class="metric-label">Effort</div>
          <div class="metric-value">${calculation.effort}</div>
          <p>Person-months required</p>
        </div>
      </div>
      
      <h2>Formula</h2>
      <p style="font-family: monospace; background: #f7fafc; padding: 10px; border-radius: 4px;">
        RICE Score = (${calculation.reach} × ${calculation.impact} × ${calculation.confidence * 100}%) ÷ ${calculation.effort} = ${calculation.score}
      </p>
      
      ${
        calculation.notes
          ? `
        <h2>Notes</h2>
        <p>${calculation.notes}</p>
      `
          : ""
      }
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()} • PM Dashboard RICE Calculator</p>
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
export function exportRiceToJSON(calculations: RiceScore[]): void {
  const exportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    totalCalculations: calculations.length,
    calculations: calculations,
  }

  const jsonContent = JSON.stringify(exportData, null, 2)
  const filename = `rice-backup-${new Date().toISOString().split("T")[0]}.json`
  downloadFile(jsonContent, filename, "application/json")
}

/**
 * Import calculations from JSON file
 */
export async function importRiceFromJSON(file: File): Promise<RiceScore[]> {
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
          (calc: RiceScore & { savedAt: string | Date }) => ({
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
 * Generate a summary report for multiple calculations
 */
export function generateRiceSummaryReport(calculations: RiceScore[]): string {
  if (calculations.length === 0) return "No calculations to summarize"

  const avgScore = calculations.reduce((sum, calc) => sum + calc.score, 0) / calculations.length
  const categories = calculations.map((calc) => getRiceScoreCategory(calc.score))

  const categoryCounts = categories.reduce(
    (acc, cat) => {
      acc[cat.label] = (acc[cat.label] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const highestScore = Math.max(...calculations.map((c) => c.score))
  const lowestScore = Math.min(...calculations.map((c) => c.score))
  const bestProject = calculations.find((c) => c.score === highestScore)
  const worstProject = calculations.find((c) => c.score === lowestScore)

  return `
RICE Score Summary Report
========================
Total Calculations: ${calculations.length}
Average Score: ${avgScore.toFixed(1)}

Score Distribution:
${Object.entries(categoryCounts)
  .map(
    ([label, count]) =>
      `- ${label}: ${count} (${((count / calculations.length) * 100).toFixed(1)}%)`
  )
  .join("\n")}

Highest Score: ${highestScore} (${bestProject?.name})
Lowest Score: ${lowestScore} (${worstProject?.name})

Generated: ${new Date().toLocaleString()}
  `.trim()
}
