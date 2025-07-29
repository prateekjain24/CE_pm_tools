import "~/styles/globals.css"

export default function Popup() {
  const openDashboard = () => {
    chrome.tabs.create({ url: "chrome://newtab" })
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="popup-container">
      <h3 style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>PM Dashboard</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={openDashboard}
          style={{
            padding: "0.75rem",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0052a3"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0066cc"
          }}
        >
          Open Dashboard
        </button>

        <button
          type="button"
          onClick={openOptions}
          style={{
            padding: "0.75rem",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e5e7eb"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6"
          }}
        >
          Settings
        </button>
      </div>

      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <h4 style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>Quick Tools</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>• RICE Calculator</div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>• ROI Calculator</div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>• A/B Test Calculator</div>
        </div>
      </div>

      <footer
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid #e5e7eb",
          fontSize: "0.75rem",
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        PM Dashboard v0.0.1
      </footer>
    </div>
  )
}
