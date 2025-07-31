import { BaseWidget } from "./BaseWidget"

interface AbTestCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function AbTestCalculator({ widgetId, widgetConfig }: AbTestCalculatorProps) {
  return (
    <BaseWidget widgetId={widgetId} title="A/B Test Calculator" data={{}} settings={widgetConfig}>
      {() => (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A/B Test Calculator coming soon
          </p>
        </div>
      )}
    </BaseWidget>
  )
}
