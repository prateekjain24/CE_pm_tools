import "~/styles/globals.css"

export default function NewTab() {
  return (
    <div className="dashboard">
      <div className="container">
        <header style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
          <h1>PM Dashboard</h1>
          <p style={{ fontSize: "1.125rem", color: "#6b7280" }}>
            Your personal command center for product management
          </p>
        </header>

        <main>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {/* Placeholder for Calculator Widget */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2 style={{ fontSize: "1.25rem" }}>RICE Calculator</h2>
              <p>Calculate feature priority scores</p>
            </div>

            {/* Placeholder for Product Hunt Feed */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2 style={{ fontSize: "1.25rem" }}>Product Hunt</h2>
              <p>Latest products and trends</p>
            </div>

            {/* Placeholder for Hacker News Feed */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2 style={{ fontSize: "1.25rem" }}>Hacker News</h2>
              <p>Tech news and discussions</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
