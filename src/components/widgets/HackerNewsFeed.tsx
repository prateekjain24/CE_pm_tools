import { BaseWidget } from "./BaseWidget"

interface HackerNewsFeedProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function HackerNewsFeed({ widgetId, widgetConfig }: HackerNewsFeedProps) {
  return (
    <BaseWidget widgetId={widgetId} title="Hacker News" data={{}} settings={widgetConfig}>
      {() => (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Hacker News Feed coming soon</p>
        </div>
      )}
    </BaseWidget>
  )
}
