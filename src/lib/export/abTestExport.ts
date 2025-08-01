/**
 * A/B Test Export Utilities
 * Provides export functionality for test results in CSV, JSON, and PDF formats
 */

import type { TestConfig, TestMetadata, TestResult, Variation } from "~/types"

/**
 * Export test data to CSV format
 */
export function exportToCSV(
  test: {
    config: TestConfig
    metadata: TestMetadata
    variations: Variation[]
  },
  results: TestResult[] | null
): void {
  const lines: string[] = []

  // Header information
  lines.push("A/B Test Results Export")
  lines.push(`Test Name,${escapeCSV(test.metadata.name || "Unnamed Test")}`)
  lines.push(`Date,${new Date().toLocaleDateString()}`)
  lines.push(`Hypothesis,"${escapeCSV(test.metadata.hypothesis || "")}"`)
  lines.push(`Owner,${escapeCSV(test.metadata.owner || "")}`)
  lines.push(`Test Type,${test.config.testType.toUpperCase()}`)
  lines.push(`Statistical Method,${test.config.statisticalMethod}`)
  lines.push(`Confidence Level,${test.config.confidenceLevel}%`)
  lines.push("")

  // Variations data
  lines.push("Variation Data")
  lines.push("Variation,Visitors,Conversions,Conversion Rate (%)")

  test.variations.forEach((variation) => {
    const rate =
      variation.visitors > 0
        ? ((variation.conversions / variation.visitors) * 100).toFixed(2)
        : "0.00"
    lines.push(
      `${escapeCSV(variation.name)},${variation.visitors},${variation.conversions},${rate}`
    )
  })

  lines.push("")

  // Results data (if available)
  if (results && results.length > 0) {
    lines.push("Statistical Results")
    lines.push(
      "Variant,Relative Uplift (%),P-Value,Statistically Significant,Statistical Power (%),Effect Size"
    )

    results.forEach((result, index) => {
      const variant = test.variations[index + 1] // Skip control
      lines.push(
        [
          escapeCSV(variant.name),
          result.uplift.toFixed(2),
          result.pValue?.toFixed(4) || "N/A",
          result.isSignificant ? "Yes" : "No",
          (result.power * 100).toFixed(1),
          result.effectSize?.toFixed(3) || "N/A",
        ].join(",")
      )
    })

    lines.push("")

    // Confidence intervals
    lines.push("Confidence Intervals")
    lines.push("Variant,Lower Bound (%),Upper Bound (%)")

    results.forEach((result, index) => {
      const variant = test.variations[index + 1]
      if (result.confidenceInterval) {
        lines.push(
          [
            escapeCSV(variant.name),
            (result.confidenceInterval[0] * 100).toFixed(2),
            (result.confidenceInterval[1] * 100).toFixed(2),
          ].join(",")
        )
      }
    })
  }

  // Business impact (if provided)
  if (test.metadata.businessImpact?.metric) {
    lines.push("")
    lines.push("Business Impact")
    lines.push(`Metric,${escapeCSV(test.metadata.businessImpact.metric)}`)
    lines.push(`Estimated Value,$${test.metadata.businessImpact.estimatedValue.toLocaleString()}`)
    lines.push(`Confidence,${test.metadata.businessImpact.confidence}`)
  }

  // Create and download file
  const csv = lines.join("\n")
  downloadFile(csv, `ab-test-${Date.now()}.csv`, "text/csv")
}

/**
 * Export test data to JSON format
 */
export function exportToJSON(
  test: {
    config: TestConfig
    metadata: TestMetadata
    variations: Variation[]
  },
  results: TestResult[] | null
): void {
  const exportData = {
    exportDate: new Date().toISOString(),
    test: {
      config: test.config,
      metadata: test.metadata,
      variations: test.variations,
    },
    results: results || [],
    analysis: results ? generateAnalysis(test, results) : null,
  }

  const json = JSON.stringify(exportData, null, 2)
  downloadFile(json, `ab-test-${Date.now()}.json`, "application/json")
}

/**
 * Export test data to PDF format (generates HTML that can be printed to PDF)
 */
export async function exportToPDF(
  test: {
    config: TestConfig
    metadata: TestMetadata
    variations: Variation[]
  },
  results: TestResult[] | null,
  chartImages?: {
    conversionRates?: string
    confidence?: string
    timeline?: string
  }
): Promise<void> {
  const control = test.variations[0]
  const controlRate = ((control.conversions / control.visitors) * 100).toFixed(2)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>A/B Test Report - ${escapeHTML(test.metadata.name || "Unnamed Test")}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    h1, h2, h3 {
      color: #1a1a1a;
      margin-top: 2em;
    }
    
    h1 { 
      font-size: 2.5em; 
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    
    h2 { 
      font-size: 1.8em; 
      color: #3b82f6;
      margin-top: 1.5em;
    }
    
    .header-info {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .header-info p {
      margin: 5px 0;
    }
    
    .hypothesis {
      background: #eff6ff;
      padding: 15px;
      border-left: 4px solid #3b82f6;
      margin: 20px 0;
      font-style: italic;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .significant {
      color: #10b981;
      font-weight: 600;
    }
    
    .not-significant {
      color: #6b7280;
    }
    
    .winner {
      background: #d1fae5;
      padding: 2px 8px;
      border-radius: 4px;
      color: #065f46;
      font-size: 0.875em;
    }
    
    .chart-container {
      margin: 20px 0;
      text-align: center;
    }
    
    .chart-container img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    
    .summary-box {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .metric {
      display: inline-block;
      margin: 10px 20px 10px 0;
    }
    
    .metric-label {
      font-size: 0.875em;
      color: #6b7280;
    }
    
    .metric-value {
      font-size: 1.5em;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .header-info, .hypothesis, .summary-box {
        break-inside: avoid;
      }
      
      h1, h2 {
        page-break-after: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>A/B Test Report</h1>
  
  <div class="header-info">
    <p><strong>Test Name:</strong> ${escapeHTML(test.metadata.name || "Unnamed Test")}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Owner:</strong> ${escapeHTML(test.metadata.owner || "Not specified")}</p>
    <p><strong>Test Type:</strong> ${test.config.testType.toUpperCase()}</p>
    <p><strong>Statistical Method:</strong> ${capitalize(test.config.statisticalMethod)}</p>
    <p><strong>Confidence Level:</strong> ${test.config.confidenceLevel}%</p>
  </div>
  
  ${
    test.metadata.hypothesis
      ? `
  <div class="hypothesis">
    <strong>Hypothesis:</strong> ${escapeHTML(test.metadata.hypothesis)}
  </div>
  `
      : ""
  }
  
  <h2>Test Results Summary</h2>
  
  <table>
    <thead>
      <tr>
        <th>Variation</th>
        <th>Visitors</th>
        <th>Conversions</th>
        <th>Conversion Rate</th>
        <th>Relative Uplift</th>
        <th>Statistical Significance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${escapeHTML(control.name)}</strong> (Control)</td>
        <td>${control.visitors.toLocaleString()}</td>
        <td>${control.conversions.toLocaleString()}</td>
        <td>${controlRate}%</td>
        <td>-</td>
        <td>-</td>
      </tr>
      ${test.variations
        .slice(1)
        .map((variation, index) => {
          const rate = ((variation.conversions / variation.visitors) * 100).toFixed(2)
          const result = results?.[index]
          const isWinner = result?.isSignificant && result.uplift > 0

          return `
        <tr>
          <td>
            <strong>${escapeHTML(variation.name)}</strong>
            ${isWinner ? '<span class="winner">WINNER</span>' : ""}
          </td>
          <td>${variation.visitors.toLocaleString()}</td>
          <td>${variation.conversions.toLocaleString()}</td>
          <td>${rate}%</td>
          <td>${result ? `${result.uplift > 0 ? "+" : ""}${result.uplift.toFixed(2)}%` : "N/A"}</td>
          <td class="${result?.isSignificant ? "significant" : "not-significant"}">
            ${result?.isSignificant ? "Yes" : "No"}
            ${result?.pValue ? ` (p=${result.pValue.toFixed(4)})` : ""}
          </td>
        </tr>
        `
        })
        .join("")}
    </tbody>
  </table>
  
  ${
    results && results.length > 0
      ? `
  <h2>Statistical Analysis</h2>
  
  <div class="summary-box">
    ${results
      .map((result, index) => {
        const variant = test.variations[index + 1]
        if (result.isSignificant) {
          return `
        <div class="metric">
          <div class="metric-label">${escapeHTML(variant.name)}</div>
          <div class="metric-value">${result.uplift > 0 ? "+" : ""}${result.uplift.toFixed(1)}%</div>
        </div>
        `
        }
        return ""
      })
      .join("")}
    
    ${!results.some((r) => r.isSignificant) ? "<p>No statistically significant results found.</p>" : ""}
  </div>
  
  <h3>Detailed Statistics</h3>
  
  <table>
    <thead>
      <tr>
        <th>Variant</th>
        <th>P-Value</th>
        <th>Statistical Power</th>
        <th>Effect Size</th>
        <th>95% Confidence Interval</th>
      </tr>
    </thead>
    <tbody>
      ${results
        .map((result, index) => {
          const variant = test.variations[index + 1]
          return `
        <tr>
          <td>${escapeHTML(variant.name)}</td>
          <td>${result.pValue?.toFixed(4) || "N/A"}</td>
          <td>${(result.power * 100).toFixed(1)}%</td>
          <td>${result.effectSize?.toFixed(3) || "N/A"}</td>
          <td>${
            result.confidenceInterval
              ? `[${(result.confidenceInterval[0] * 100).toFixed(2)}%, ${(result.confidenceInterval[1] * 100).toFixed(2)}%]`
              : "N/A"
          }</td>
        </tr>
        `
        })
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }
  
  ${
    chartImages?.conversionRates
      ? `
  <h2>Visualizations</h2>
  
  <div class="chart-container">
    <h3>Conversion Rates Comparison</h3>
    <img src="${chartImages.conversionRates}" alt="Conversion Rates Chart" />
  </div>
  `
      : ""
  }
  
  ${
    chartImages?.confidence
      ? `
  <div class="chart-container">
    <h3>Confidence Intervals</h3>
    <img src="${chartImages.confidence}" alt="Confidence Intervals Chart" />
  </div>
  `
      : ""
  }
  
  ${
    test.metadata.businessImpact?.metric
      ? `
  <h2>Business Impact</h2>
  
  <div class="summary-box">
    <p><strong>Impact Metric:</strong> ${escapeHTML(test.metadata.businessImpact.metric)}</p>
    <p><strong>Estimated Value:</strong> $${test.metadata.businessImpact.estimatedValue.toLocaleString()}</p>
    <p><strong>Confidence:</strong> ${capitalize(test.metadata.businessImpact.confidence)}</p>
  </div>
  `
      : ""
  }
  
  <h2>Recommendations</h2>
  
  ${generateRecommendations(test, results)}
  
  <hr style="margin-top: 40px; border: 1px solid #e5e7eb;">
  
  <p style="text-align: center; color: #6b7280; font-size: 0.875em;">
    Generated on ${new Date().toLocaleString()} | 
    PM Dashboard A/B Test Calculator
  </p>
</body>
</html>
  `

  // Open in new window for printing
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()

    // Auto-trigger print dialog after content loads
    printWindow.onload = () => {
      printWindow.print()
    }
  } else {
    // Fallback: download as HTML
    downloadFile(html, `ab-test-report-${Date.now()}.html`, "text/html")
  }
}

/**
 * Helper function to escape CSV values
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Helper function to escape HTML
 */
function escapeHTML(value: string): string {
  const div = document.createElement("div")
  div.textContent = value
  return div.innerHTML
}

/**
 * Helper function to capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Helper function to download file
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
 * Generate analysis summary
 */
function generateAnalysis(
  test: {
    config: TestConfig
    metadata: TestMetadata
    variations: Variation[]
  },
  results: TestResult[]
): {
  totalVisitors: number
  totalConversions: number
  overallConversionRate: number
  significantResults: number
  winners: number
  bestPerformer: string | null
  recommendedAction: string
} {
  const significantResults = results.filter((r) => r.isSignificant)
  const winners = significantResults.filter((r) => r.uplift > 0)

  return {
    totalVisitors: test.variations.reduce((sum, v) => sum + v.visitors, 0),
    totalConversions: test.variations.reduce((sum, v) => sum + v.conversions, 0),
    overallConversionRate:
      test.variations.reduce((sum, v) => sum + v.conversions, 0) /
      test.variations.reduce((sum, v) => sum + v.visitors, 0),
    significantResults: significantResults.length,
    winners: winners.length,
    bestPerformer:
      winners.length > 0
        ? test.variations[
            results.indexOf(
              winners.reduce((best, current) => (current.uplift > best.uplift ? current : best))
            ) + 1
          ].name
        : null,
    recommendedAction: generateRecommendation(results),
  }
}

/**
 * Generate recommendation based on results
 */
function generateRecommendation(results: TestResult[] | null): string {
  if (!results || results.length === 0) {
    return "Insufficient data to make a recommendation."
  }

  const significantWinners = results.filter((r) => r.isSignificant && r.uplift > 0)
  const significantLosers = results.filter((r) => r.isSignificant && r.uplift < 0)

  if (significantWinners.length > 0) {
    const bestWinner = significantWinners.reduce((best, current) =>
      current.uplift > best.uplift ? current : best
    )
    return `Implement the winning variation with ${bestWinner.uplift.toFixed(1)}% improvement.`
  } else if (significantLosers.length > 0) {
    return "Keep the control version. All tested variations performed worse."
  } else {
    const maxPower = Math.max(...results.map((r) => r.power))
    if (maxPower < 0.8) {
      return (
        "Continue testing to achieve higher statistical power (currently " +
        (maxPower * 100).toFixed(0) +
        "%)."
      )
    }
    return "No significant difference found. Consider testing more dramatic variations."
  }
}

/**
 * Generate detailed recommendations for PDF report
 */
function generateRecommendations(
  test: {
    config: TestConfig
    metadata: TestMetadata
    variations: Variation[]
  },
  results: TestResult[] | null
): string {
  const recommendations: string[] = []

  if (!results || results.length === 0) {
    recommendations.push("<p>Continue collecting data to enable statistical analysis.</p>")
  } else {
    const significantWinners = results.filter((r) => r.isSignificant && r.uplift > 0)
    const allPowersLow = results.every((r) => r.power < 0.8)

    if (significantWinners.length > 0) {
      const best = significantWinners.reduce((b, c) => (c.uplift > b.uplift ? c : b))
      const variant = test.variations[results.indexOf(best) + 1]

      recommendations.push(
        `<p><strong>✓ Implement ${escapeHTML(variant.name)}</strong> - ` +
          `This variation shows a statistically significant improvement of ${best.uplift.toFixed(1)}%.`
      )

      if (test.metadata.businessImpact?.estimatedValue) {
        const impact = test.metadata.businessImpact.estimatedValue * (best.uplift / 100)
        recommendations.push(
          `<p>Expected business impact: $${Math.round(impact).toLocaleString()} in additional value.</p>`
        )
      }
    } else if (results.some((r) => r.isSignificant && r.uplift < 0)) {
      recommendations.push(
        "<p><strong>✓ Keep the control version</strong> - " +
          "The tested variations performed significantly worse than the control.</p>"
      )
    } else if (allPowersLow) {
      recommendations.push(
        "<p><strong>⚠ Continue testing</strong> - " +
          "Statistical power is below 80%. Collect more data for reliable results.</p>"
      )
    } else {
      recommendations.push(
        "<p><strong>○ No clear winner</strong> - " +
          "Consider testing more impactful variations or re-evaluating your hypothesis.</p>"
      )
    }

    // Additional recommendations
    if (test.variations.some((v) => v.visitors < 1000)) {
      recommendations.push(
        "<p>💡 <em>Tip:</em> Aim for at least 1,000 visitors per variation for more reliable results.</p>"
      )
    }

    if (test.config.testDirection === "two-tailed" && significantWinners.length === 0) {
      recommendations.push(
        "<p>💡 <em>Consider:</em> If you have a strong directional hypothesis, " +
          "a one-tailed test might provide more statistical power.</p>"
      )
    }
  }

  return recommendations.join("\n")
}
