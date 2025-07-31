import { BaseWidget } from "./BaseWidget"

interface RoiCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function RoiCalculator({ widgetId, widgetConfig }: RoiCalculatorProps) {
  return (
    <BaseWidget widgetId={widgetId} title="ROI Calculator" data={{}} settings={widgetConfig}>
      {() => (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">ROI Calculator coming soon</p>
        </div>
      )}
    </BaseWidget>
  )
}
