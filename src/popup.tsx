import "~/styles/globals.css"
import { Badge, Button, Card } from "~/components/common"

export default function Popup() {
  const openDashboard = () => {
    chrome.tabs.create({ url: "chrome://newtab" })
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="popup-container">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PM Dashboard</h3>
        <p className="text-sm text-gray-600">Your productivity command center</p>
      </div>

      <div className="space-y-2 mb-4">
        <Button onClick={openDashboard} fullWidth>
          Open Dashboard
        </Button>
        <Button variant="secondary" onClick={openOptions} fullWidth>
          Settings
        </Button>
      </div>

      <Card noPadding className="mb-4">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">Quick Tools</h4>
        </div>
        <div className="px-4 py-2 space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700">RICE Calculator</span>
            <Badge size="sm" variant="primary">
              New
            </Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700">ROI Calculator</span>
            <Badge size="sm" variant="default">
              Pro
            </Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700">A/B Test Calculator</span>
            <Badge size="sm" variant="default">
              Pro
            </Badge>
          </div>
        </div>
      </Card>

      <footer className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
        PM Dashboard v0.0.1
      </footer>
    </div>
  )
}
