import { Suspense } from "react"
import { Modal } from "~/components/common/Modal"
import { WidgetSkeleton } from "~/components/widgets/WidgetSkeleton"
import { widgetRegistry } from "~/lib/dashboard/widgetRegistry"
import type { WidgetConfig } from "~/types"

interface WidgetModalProps {
  widget: WidgetConfig | null
  open: boolean
  onClose: () => void
}

export function WidgetModal({ widget, open, onClose }: WidgetModalProps) {
  if (!widget) return null

  const widgetDef = widgetRegistry.get(widget.type)
  if (!widgetDef?.component) return null

  const WidgetComponent = widgetDef.component

  // Provide no-op callbacks for widgets that expect them
  const noop = () => {}

  return (
    <Modal open={open} onClose={onClose} title={widgetDef.name} size="xl" className="max-w-6xl">
      <div className="h-[80vh] overflow-auto">
        <Suspense fallback={<WidgetSkeleton title={widgetDef.name} />}>
          <WidgetComponent
            widgetId={widget.id}
            widgetConfig={{
              ...widget.settings,
              viewMode: "full",
              isModal: true,
              onSettings: noop,
              onHide: noop,
              onRemove: noop,
              onExpand: noop,
            }}
          />
        </Suspense>
      </div>
    </Modal>
  )
}
