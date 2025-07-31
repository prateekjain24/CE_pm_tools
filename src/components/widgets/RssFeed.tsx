import { BaseWidget } from "./BaseWidget"

interface RssFeedProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function RssFeed({ widgetId, widgetConfig }: RssFeedProps) {
  return (
    <BaseWidget widgetId={widgetId} title="RSS Feed" data={{}} settings={widgetConfig}>
      {() => (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">RSS Feed coming soon</p>
        </div>
      )}
    </BaseWidget>
  )
}
