import { BaseWidget } from "./BaseWidget"

interface RoiCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function RoiCalculator({ widgetId, widgetConfig }: RoiCalculatorProps) {
  return (
    <BaseWidget
      widgetId={widgetId}
      title="ROI Calculator"
      data={null}
      settings={widgetConfig}
      emptyStateType="calculator"
      onSettings={widgetConfig?.onSettings as () => void}
      onHide={widgetConfig?.onHide as () => void}
    >
      {() => <></>}
    </BaseWidget>
  )
}
