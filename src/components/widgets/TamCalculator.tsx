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
