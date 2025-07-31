import { type ComponentType, lazy } from "react"

/**
 * Widget definition with metadata
 */
export interface WidgetDefinition {
  id: string
  name: string
  description: string
  category: "calculator" | "feed" | "analytics" | "utility"
  component?: React.LazyExoticComponent<ComponentType<unknown>>
  defaultSize: { width: number; height: number }
  minSize: { width: number; height: number }
  maxSize: { width: number; height: number }
  icon?: string
  preview?: string
}

/**
 * Registry of all available widgets
 * Components will be lazy loaded when needed
 */
export const widgetRegistry = new Map<string, WidgetDefinition>([
  [
    "rice-calculator",
    {
      id: "rice-calculator",
      name: "RICE Score Calculator",
      description: "Prioritize features using Reach, Impact, Confidence, and Effort",
      category: "calculator",
      component: lazy(() => import("~/components/widgets/RiceCalculator")),
      defaultSize: { width: 4, height: 3 },
      minSize: { width: 3, height: 2 },
      maxSize: { width: 6, height: 4 },
      icon: "calculator",
    },
  ],
  [
    "tam-calculator",
    {
      id: "tam-calculator",
      name: "TAM/SAM/SOM Calculator",
      description: "Calculate market sizing for your product",
      category: "calculator",
      component: lazy(() => import("~/components/widgets/TamCalculator")),
      defaultSize: { width: 4, height: 3 },
      minSize: { width: 3, height: 2 },
      maxSize: { width: 6, height: 4 },
      icon: "chart-pie",
    },
  ],
  [
    "roi-calculator",
    {
      id: "roi-calculator",
      name: "ROI Calculator",
      description: "Calculate return on investment for initiatives",
      category: "calculator",
      component: lazy(() => import("~/components/widgets/RoiCalculator")),
      defaultSize: { width: 4, height: 3 },
      minSize: { width: 3, height: 2 },
      maxSize: { width: 6, height: 4 },
      icon: "trending-up",
    },
  ],
  [
    "ab-test-calculator",
    {
      id: "ab-test-calculator",
      name: "A/B Test Calculator",
      description: "Determine statistical significance of experiments",
      category: "calculator",
      component: lazy(() => import("~/components/widgets/AbTestCalculator")),
      defaultSize: { width: 4, height: 3 },
      minSize: { width: 3, height: 2 },
      maxSize: { width: 6, height: 4 },
      icon: "beaker",
    },
  ],
  [
    "product-hunt-feed",
    {
      id: "product-hunt-feed",
      name: "Product Hunt Feed",
      description: "Latest products and trends from Product Hunt",
      category: "feed",
      component: lazy(() => import("~/components/widgets/ProductHuntFeed")),
      defaultSize: { width: 4, height: 4 },
      minSize: { width: 3, height: 3 },
      maxSize: { width: 6, height: 6 },
      icon: "product-hunt",
    },
  ],
  [
    "hacker-news-feed",
    {
      id: "hacker-news-feed",
      name: "Hacker News Feed",
      description: "Top stories from Hacker News",
      category: "feed",
      component: lazy(() => import("~/components/widgets/HackerNewsFeed")),
      defaultSize: { width: 4, height: 4 },
      minSize: { width: 3, height: 3 },
      maxSize: { width: 6, height: 6 },
      icon: "hacker-news",
    },
  ],
  [
    "jira-feed",
    {
      id: "jira-feed",
      name: "Jira Tickets",
      description: "Your Jira tickets and updates",
      category: "feed",
      component: lazy(() => import("~/components/widgets/JiraFeed")),
      defaultSize: { width: 6, height: 4 },
      minSize: { width: 4, height: 3 },
      maxSize: { width: 8, height: 6 },
      icon: "jira",
    },
  ],
  [
    "rss-feed",
    {
      id: "rss-feed",
      name: "RSS Feed",
      description: "Custom RSS feed reader",
      category: "feed",
      component: lazy(() => import("~/components/widgets/RssFeed")),
      defaultSize: { width: 4, height: 4 },
      minSize: { width: 3, height: 3 },
      maxSize: { width: 6, height: 6 },
      icon: "rss",
    },
  ],
])

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: WidgetDefinition["category"]): WidgetDefinition[] {
  return Array.from(widgetRegistry.values()).filter((widget) => widget.category === category)
}

/**
 * Search widgets by name or description
 */
export function searchWidgets(query: string): WidgetDefinition[] {
  const lowerQuery = query.toLowerCase()
  return Array.from(widgetRegistry.values()).filter(
    (widget) =>
      widget.name.toLowerCase().includes(lowerQuery) ||
      widget.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get all widget categories
 */
export function getWidgetCategories(): Array<{
  id: WidgetDefinition["category"]
  name: string
  count: number
}> {
  const categories: Record<WidgetDefinition["category"], number> = {
    calculator: 0,
    feed: 0,
    analytics: 0,
    utility: 0,
  }

  Array.from(widgetRegistry.values()).forEach((widget) => {
    categories[widget.category]++
  })

  return [
    { id: "calculator", name: "Calculators", count: categories.calculator },
    { id: "feed", name: "Data Feeds", count: categories.feed },
    { id: "analytics", name: "Analytics", count: categories.analytics },
    { id: "utility", name: "Utilities", count: categories.utility },
  ].filter((cat) => cat.count > 0)
}
