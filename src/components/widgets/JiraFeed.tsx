import { BaseWidget } from "./BaseWidget"

interface JiraFeedProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function JiraFeed({ widgetId, widgetConfig }: JiraFeedProps) {
  return (
    <BaseWidget widgetId={widgetId} title="Jira Tickets" data={{}} settings={widgetConfig}>
      {() => (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Jira integration coming soon</p>
        </div>
      )}
    </BaseWidget>
  )
}
