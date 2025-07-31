import { formatCurrency } from "~/lib/calculators/tam"
import type { TamCalculation } from "~/types"

/**
 * Export TAM calculations to CSV format
 */
export function exportTamToCSV(calculations: TamCalculation[]): void {
  const headers = [
    "Date",
    "Name",
    "Method",
    "Currency",
    "TAM",
    "SAM",
    "SAM %",
    "SOM",
    "SOM %",
    "Time Period",
    "Market Maturity",
    "Confidence",
    "Assumptions",
  ]

  const rows = calculations.map((calc) => [
    new Date(calc.savedAt).toLocaleDateString(),
    calc.name,
    calc.method,
    calc.currency,
    calc.tam,
    calc.sam,
    calc.samPercentage || ((calc.sam / calc.tam) * 100).toFixed(1),
    calc.som,
    calc.somPercentage || ((calc.som / calc.sam) * 100).toFixed(1),
    calc.params?.timePeriod || "annual",
    calc.params?.marketMaturity || "N/A",
    calc.confidence || "N/A",
    calc.assumptions?.join("; ") || "",
  ])

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")

  downloadFile(csv, "tam-calculations.csv", "text/csv")
}

/**
 * Export TAM calculations to JSON format
 */
export function exportTamToJSON(calculations: TamCalculation[]): void {
  const json = JSON.stringify(calculations, null, 2)
  downloadFile(json, "tam-calculations.json", "application/json")
}

/**
 * Export single TAM calculation to PDF
 * Note: This is a placeholder - actual PDF generation would require a library like jsPDF
 */
export async function exportTamToPDF(calculation: TamCalculation): Promise<void> {
  // In a real implementation, you would use a library like jsPDF
  // For now, we'll create a simple HTML representation
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TAM/SAM/SOM Report - ${calculation.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #333; }
        .metric { margin: 20px 0; }
        .label { font-weight: bold; color: #666; }
        .value { font-size: 1.2em; margin-left: 10px; }
        .assumptions { margin-top: 30px; }
        .assumptions li { margin: 5px 0; }
      </style>
    </head>
    <body>
      <h1>TAM/SAM/SOM Market Analysis</h1>
      <h2>${calculation.name}</h2>
      
      <div class="metric">
        <span class="label">Date:</span>
        <span class="value">${new Date(calculation.savedAt).toLocaleDateString()}</span>
      </div>
      
      <div class="metric">
        <span class="label">Method:</span>
        <span class="value">${calculation.method === "topDown" ? "Top-Down" : "Bottom-Up"}</span>
      </div>
      
      <hr>
      
      <div class="metric">
        <span class="label">Total Addressable Market (TAM):</span>
        <span class="value">${formatCurrency(calculation.tam, calculation.currency)}</span>
      </div>
      
      <div class="metric">
        <span class="label">Serviceable Addressable Market (SAM):</span>
        <span class="value">${formatCurrency(calculation.sam, calculation.currency)}</span>
        ${calculation.samPercentage ? ` (${calculation.samPercentage}% of TAM)` : ""}
      </div>
      
      <div class="metric">
        <span class="label">Serviceable Obtainable Market (SOM):</span>
        <span class="value">${formatCurrency(calculation.som, calculation.currency)}</span>
        ${calculation.somPercentage ? ` (${calculation.somPercentage}% of SAM)` : ""}
      </div>
      
      ${
        calculation.confidence
          ? `
        <div class="metric">
          <span class="label">Confidence Level:</span>
          <span class="value">${calculation.confidence}%</span>
        </div>
      `
          : ""
      }
      
      ${
        calculation.assumptions && calculation.assumptions.length > 0
          ? `
        <div class="assumptions">
          <h3>Assumptions</h3>
          <ul>
            ${calculation.assumptions.map((a) => `<li>${a}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
      
      ${
        calculation.notes
          ? `
        <div class="assumptions">
          <h3>Notes</h3>
          <p>${calculation.notes}</p>
        </div>
      `
          : ""
      }
    </body>
    </html>
  `

  // Create a blob and download
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tam-report-${calculation.name.replace(/\s+/g, "-")}-${Date.now()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import TAM calculations from JSON
 */
export function importTamFromJSON(jsonString: string): TamCalculation[] {
  try {
    const data = JSON.parse(jsonString)
    if (!Array.isArray(data)) {
      throw new Error("Invalid format: expected an array of calculations")
    }

    // Validate and transform the data
    return data.map((item) => ({
      ...item,
      savedAt: new Date(item.savedAt),
    }))
  } catch (error) {
    throw new Error(`Failed to import calculations: ${error.message}`)
  }
}
