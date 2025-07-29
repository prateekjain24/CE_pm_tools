import "~/styles/globals.css"
import { Badge, Button, Card } from "~/components/common"

export default function NewTab() {
  return (
    <div className="dashboard">
      <div className="container">
        <header className="py-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">PM Dashboard</h1>
            <p className="text-lg text-gray-600">
              Your personal command center for product management
            </p>
          </div>
          <Button variant="ghost" size="sm">
            Settings
          </Button>
        </header>

        <main>
          <div className="widget-grid mb-8">
            {/* RICE Calculator Widget */}
            <Card
              title="RICE Calculator"
              description="Calculate feature priority scores"
              hoverable
              footer={
                <div className="flex justify-between items-center">
                  <Badge variant="primary" size="sm">
                    5 saved
                  </Badge>
                  <Button size="sm">Open</Button>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                Prioritize features using Reach, Impact, Confidence, and Effort
              </p>
            </Card>

            {/* Product Hunt Feed Widget */}
            <Card
              title="Product Hunt"
              description="Latest products and trends"
              hoverable
              footer={
                <div className="flex justify-between items-center">
                  <Badge variant="success" size="sm">
                    Live
                  </Badge>
                  <Button size="sm">View All</Button>
                </div>
              }
            >
              <p className="text-sm text-gray-500">Discover new products and innovations daily</p>
            </Card>

            {/* Hacker News Feed Widget */}
            <Card
              title="Hacker News"
              description="Tech news and discussions"
              hoverable
              footer={
                <div className="flex justify-between items-center">
                  <Badge variant="info" size="sm">
                    30 new
                  </Badge>
                  <Button size="sm">Read More</Button>
                </div>
              }
            >
              <p className="text-sm text-gray-500">Stay updated with the latest in technology</p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
