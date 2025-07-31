import { BaseWidget } from "./BaseWidget"

interface TamCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function TamCalculator({ widgetId, widgetConfig }: TamCalculatorProps) {
  return (
    <BaseWidget
      widgetId={widgetId}
      title="TAM/SAM/SOM Calculator"
      data={{}}
      settings={widgetConfig}
    >
      {() => (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            TAM/SAM/SOM Calculator coming soon
          </p>
        </div>
      )}
    </BaseWidget>
  )
}
