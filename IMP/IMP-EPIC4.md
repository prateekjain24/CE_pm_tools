# Epic 4: Data Feeds

## Epic Overview
Implement real-time data feeds from various sources to provide PMs with up-to-date industry insights, product launches, engineering discussions, and team activity. This epic focuses on building a robust feed infrastructure with caching, error handling, and beautiful data presentation following modern, clean, and minimal design principles.

**Epic Goals:**
- Build scalable feed fetching infrastructure in background script
- Implement feeds for Product Hunt, Hacker News, Jira, and RSS
- Create responsive, minimal feed widgets
- Ensure reliable data updates with proper error handling
- Optimize performance with intelligent caching

**Total Story Points:** 34 SP  
**Total Stories:** 5  
**Total Tickets:** 26  

---

## Story 4.1: Feed Infrastructure
**Description:** Create the foundational infrastructure for fetching, caching, and managing data feeds using Chrome's alarm API and Plasmo's storage system.

**Acceptance Criteria:**
- Background worker fetches feeds on schedule
- Intelligent caching reduces API calls
- Robust error handling and retry logic
- Feed status monitoring and health checks
- Configurable refresh intervals per feed

### Tickets:

#### Ticket 4.1.1: Create Background Alarm System
- **Description:** Implement chrome.alarms API for periodic feed fetching with different intervals per feed type
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Setup alarms for each feed type with configurable intervals
  - Handle alarm persistence across browser restarts
  - Implement staggered fetching to avoid simultaneous requests
  - Add alarm management (create, update, clear)
  - Log alarm events for debugging
- **Dependencies:** Epic 1 completion
- **Implementation Notes:**
  ```typescript
  // src/background.ts
  import { Storage } from "@plasmohq/storage"
  import { FeedManager } from "~/lib/feeds/FeedManager"
  
  const storage = new Storage({ area: "local" })
  const feedManager = new FeedManager(storage)
  
  // Feed configuration with intervals
  const FEED_CONFIG = {
    'product-hunt': { interval: 30, priority: 'high' },
    'hacker-news': { interval: 15, priority: 'high' },
    'jira': { interval: 5, priority: 'critical' },
    'rss': { interval: 60, priority: 'medium' }
  }
  
  chrome.runtime.onInstalled.addListener(async () => {
    // Clear existing alarms
    await chrome.alarms.clearAll()
    
    // Create staggered alarms for each feed
    Object.entries(FEED_CONFIG).forEach(([feedType, config], index) => {
      chrome.alarms.create(`fetch-${feedType}`, {
        delayInMinutes: index * 0.5, // Stagger by 30 seconds
        periodInMinutes: config.interval
      })
    })
    
    // Create health check alarm
    chrome.alarms.create('feed-health-check', {
      periodInMinutes: 60
    })
  })
  
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log(`Alarm triggered: ${alarm.name}`)
    
    if (alarm.name.startsWith('fetch-')) {
      const feedType = alarm.name.replace('fetch-', '')
      await feedManager.fetchFeed(feedType)
    } else if (alarm.name === 'feed-health-check') {
      await feedManager.performHealthCheck()
    }
  })
  ```

#### Ticket 4.1.2: Implement Feed Caching Mechanism
- **Description:** Build intelligent caching system to minimize API calls and improve performance
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Cache responses with TTL (Time To Live)
  - Implement cache invalidation strategies
  - Store cache in chrome.storage.local
  - Add cache hit/miss metrics
  - Support partial cache updates
  - Handle cache size limits (5MB chrome.storage limit)
- **Dependencies:** 4.1.1
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/FeedCache.ts
  interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
    etag?: string
    lastModified?: string
  }
  
  export class FeedCache {
    constructor(private storage: Storage) {}
    
    async get<T>(key: string): Promise<T | null> {
      const cacheKey = `cache:${key}`
      const entry = await this.storage.get<CacheEntry<T>>(cacheKey)
      
      if (!entry) return null
      
      // Check if cache is still valid
      const now = Date.now()
      if (now - entry.timestamp > entry.ttl) {
        await this.storage.remove(cacheKey)
        return null
      }
      
      return entry.data
    }
    
    async set<T>(key: string, data: T, ttl: number, headers?: {
      etag?: string
      lastModified?: string
    }): Promise<void> {
      const cacheKey = `cache:${key}`
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        ...headers
      }
      
      try {
        await this.storage.set(cacheKey, entry)
      } catch (error) {
        // Handle storage quota exceeded
        if (error.message?.includes('QUOTA_BYTES')) {
          await this.evictOldestEntries()
          await this.storage.set(cacheKey, entry)
        }
      }
    }
    
    async validateWithEtag(key: string, currentEtag: string): Promise<boolean> {
      const entry = await this.storage.get<CacheEntry<any>>(`cache:${key}`)
      return entry?.etag === currentEtag
    }
    
    private async evictOldestEntries(): Promise<void> {
      const allKeys = await this.storage.getAll()
      const cacheEntries = Object.entries(allKeys)
        .filter(([k]) => k.startsWith('cache:'))
        .map(([k, v]) => ({ key: k, ...v as CacheEntry<any> }))
        .sort((a, b) => a.timestamp - b.timestamp)
      
      // Remove oldest 20% of cache entries
      const toRemove = Math.ceil(cacheEntries.length * 0.2)
      for (let i = 0; i < toRemove; i++) {
        await this.storage.remove(cacheEntries[i].key)
      }
    }
  }
  ```

#### Ticket 4.1.3: Build Error Handling and Retry Logic
- **Description:** Implement comprehensive error handling with exponential backoff retry strategy
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Categorize errors (network, rate limit, auth, parsing)
  - Implement exponential backoff with jitter
  - Track consecutive failures per feed
  - Disable feeds after max retries
  - Send error notifications to UI
  - Log errors for debugging
- **Dependencies:** 4.1.2
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/ErrorHandler.ts
  export interface FeedError {
    feedType: string
    error: Error
    timestamp: number
    retryCount: number
    category: 'network' | 'auth' | 'rateLimit' | 'parsing' | 'unknown'
  }
  
  export class FeedErrorHandler {
    private retryState = new Map<string, {
      count: number
      nextRetry: number
      lastError: FeedError
    }>()
    
    constructor(
      private storage: Storage,
      private maxRetries = 3,
      private baseDelay = 1000
    ) {}
    
    async handleError(feedType: string, error: Error): Promise<boolean> {
      const category = this.categorizeError(error)
      const state = this.retryState.get(feedType) || { count: 0, nextRetry: 0 }
      
      state.count++
      state.lastError = {
        feedType,
        error,
        timestamp: Date.now(),
        retryCount: state.count,
        category
      }
      
      // Calculate next retry with exponential backoff and jitter
      const delay = Math.min(
        this.baseDelay * Math.pow(2, state.count - 1) + Math.random() * 1000,
        300000 // Max 5 minutes
      )
      state.nextRetry = Date.now() + delay
      
      this.retryState.set(feedType, state)
      
      // Store error for UI display
      await this.storage.set(`feed-error:${feedType}`, state.lastError)
      
      // Disable feed after max retries
      if (state.count >= this.maxRetries) {
        await this.disableFeed(feedType)
        return false
      }
      
      // Schedule retry
      chrome.alarms.create(`retry-${feedType}`, {
        when: state.nextRetry
      })
      
      return true
    }
    
    private categorizeError(error: Error): FeedError['category'] {
      const message = error.message.toLowerCase()
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'network'
      }
      if (message.includes('401') || message.includes('403')) {
        return 'auth'
      }
      if (message.includes('429') || message.includes('rate limit')) {
        return 'rateLimit'
      }
      if (message.includes('parse') || message.includes('json')) {
        return 'parsing'
      }
      
      return 'unknown'
    }
    
    async clearError(feedType: string): Promise<void> {
      this.retryState.delete(feedType)
      await this.storage.remove(`feed-error:${feedType}`)
    }
    
    private async disableFeed(feedType: string): Promise<void> {
      await this.storage.set(`feed-disabled:${feedType}`, true)
      chrome.alarms.clear(`fetch-${feedType}`)
      
      // Notify UI
      chrome.runtime.sendMessage({
        type: 'FEED_DISABLED',
        feedType,
        error: this.retryState.get(feedType)?.lastError
      })
    }
  }
  ```

#### Ticket 4.1.4: Create Feed Status Monitoring
- **Description:** Build system to track feed health and performance metrics
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Track last successful fetch time
  - Monitor fetch duration and response times
  - Calculate success/failure rates
  - Store metrics in rolling window (last 24h)
  - Expose health status to UI
- **Dependencies:** 4.1.3
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/FeedMonitor.ts
  interface FeedMetrics {
    lastSuccess: number
    lastAttempt: number
    successRate: number
    avgResponseTime: number
    status: 'healthy' | 'degraded' | 'down'
    history: Array<{
      timestamp: number
      success: boolean
      duration: number
    }>
  }
  
  export class FeedMonitor {
    private metrics = new Map<string, FeedMetrics>()
    
    async recordFetch(
      feedType: string, 
      success: boolean, 
      duration: number
    ): Promise<void> {
      const current = this.metrics.get(feedType) || this.createEmptyMetrics()
      
      // Update metrics
      current.lastAttempt = Date.now()
      if (success) current.lastSuccess = Date.now()
      
      // Add to history (keep last 24h)
      current.history.push({
        timestamp: Date.now(),
        success,
        duration
      })
      
      // Remove old entries
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000
      current.history = current.history.filter(h => h.timestamp > dayAgo)
      
      // Calculate success rate
      const recentAttempts = current.history.slice(-20)
      current.successRate = recentAttempts.filter(h => h.success).length / 
                           recentAttempts.length
      
      // Calculate average response time
      const successfulFetches = current.history.filter(h => h.success)
      current.avgResponseTime = successfulFetches.length > 0
        ? successfulFetches.reduce((sum, h) => sum + h.duration, 0) / 
          successfulFetches.length
        : 0
      
      // Determine status
      current.status = this.determineStatus(current)
      
      this.metrics.set(feedType, current)
      await this.storage.set(`feed-metrics:${feedType}`, current)
    }
    
    private determineStatus(metrics: FeedMetrics): FeedMetrics['status'] {
      const timeSinceSuccess = Date.now() - metrics.lastSuccess
      
      if (metrics.successRate >= 0.9 && timeSinceSuccess < 3600000) {
        return 'healthy'
      }
      if (metrics.successRate >= 0.5 || timeSinceSuccess < 7200000) {
        return 'degraded'
      }
      return 'down'
    }
  }
  ```

---

## Story 4.2: Product Hunt Feed
**Description:** Implement Product Hunt integration to display latest product launches and trending products in a beautiful, minimal widget.

**Acceptance Criteria:**
- Fetch latest products from Product Hunt API
- Display product cards with key information
- Support filtering by category and time
- Cache product images efficiently
- Show upvote counts and hunter info

### Tickets:

#### Ticket 4.2.1: Create ProductHuntFeed Widget Component
- **Description:** Build the main Product Hunt feed widget with modern, minimal design
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create responsive grid layout for product cards
  - Implement skeleton loading states
  - Add empty state for no products
  - Support compact and expanded view modes
  - Follow modern design with subtle shadows and clean typography
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/ProductHuntFeed.tsx
  import { BaseWidget } from "~/components/widgets/BaseWidget"
  import { useStorage } from "@plasmohq/storage/hook"
  import { ProductHuntItem } from "~/types/feeds"
  
  export function ProductHuntFeed() {
    const [products] = useStorage<ProductHuntItem[]>("product-hunt-feed", [])
    const [loading] = useStorage("product-hunt-loading", false)
    const [viewMode, setViewMode] = useStorage("ph-view-mode", "compact")
    const [filter, setFilter] = useState<string>("all")
    
    const filteredProducts = useMemo(() => {
      if (filter === "all") return products
      return products.filter(p => p.topics?.includes(filter))
    }, [products, filter])
    
    return (
      <BaseWidget
        title="Product Hunt"
        icon={<ProductHuntIcon />}
        onRefresh={refreshProductHunt}
        headerActions={
          <ViewModeToggle 
            mode={viewMode} 
            onChange={setViewMode}
          />
        }
      >
        {() => (
          <div className="space-y-4">
            <FilterBar
              activeFilter={filter}
              onFilterChange={setFilter}
              categories={getUniqueCategories(products)}
            />
            
            {loading ? (
              <ProductSkeleton count={3} />
            ) : filteredProducts.length > 0 ? (
              <div className={cn(
                "grid gap-3",
                viewMode === 'compact' 
                  ? "grid-cols-1" 
                  : "grid-cols-1 md:grid-cols-2"
              )}>
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                message="No products found"
                action={{ label: "Refresh", onClick: refreshProductHunt }}
              />
            )}
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 4.2.2: Implement Product Hunt API Integration
- **Description:** Create background script handler for fetching Product Hunt data via their GraphQL API
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Implement OAuth2 authentication flow
  - Query posts with required fields
  - Handle pagination for more products
  - Transform API response to our data model
  - Respect API rate limits
- **Dependencies:** 4.1.1
- **Implementation Notes:**
  ```typescript
  // src/background/messages/fetch-product-hunt.ts
  import type { PlasmoMessaging } from "@plasmohq/messaging"
  import { Storage } from "@plasmohq/storage"
  import { FeedCache } from "~/lib/feeds/FeedCache"
  
  const PRODUCT_HUNT_API = "https://api.producthunt.com/v2/api/graphql"
  
  const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const storage = new Storage({ area: "local" })
    const cache = new FeedCache(storage)
    const errorHandler = new FeedErrorHandler(storage)
    
    try {
      // Check cache first
      const cached = await cache.get<ProductHuntItem[]>("product-hunt-feed")
      if (cached) {
        res.send({ success: true, data: cached, fromCache: true })
        return
      }
      
      // Get API token from secure storage
      const token = await secureStorage.get("product-hunt-token")
      if (!token) {
        throw new Error("Product Hunt API token not configured")
      }
      
      // GraphQL query for latest posts
      const query = `
        query GetTodayPosts($first: Int!, $after: String) {
          posts(first: $first, after: $after, order: VOTES) {
            edges {
              node {
                id
                name
                tagline
                description
                url
                website
                votesCount
                commentsCount
                createdAt
                featuredAt
                thumbnail {
                  url
                }
                topics {
                  edges {
                    node {
                      name
                      slug
                    }
                  }
                }
                user {
                  name
                  username
                  profileImage
                }
                makers {
                  name
                  username
                  profileImage
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `
      
      const response = await fetch(PRODUCT_HUNT_API, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { first: 20 }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Product Hunt API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform to our data model
      const products: ProductHuntItem[] = data.data.posts.edges.map(edge => ({
        id: edge.node.id,
        name: edge.node.name,
        tagline: edge.node.tagline,
        description: edge.node.description,
        url: edge.node.url,
        website: edge.node.website,
        votes: edge.node.votesCount,
        comments: edge.node.commentsCount,
        thumbnail: edge.node.thumbnail?.url,
        topics: edge.node.topics.edges.map(t => t.node.name),
        hunter: {
          name: edge.node.user.name,
          username: edge.node.user.username,
          avatar: edge.node.user.profileImage
        },
        makers: edge.node.makers.map(m => ({
          name: m.name,
          username: m.username,
          avatar: m.profileImage
        })),
        timestamp: new Date(edge.node.featuredAt || edge.node.createdAt).getTime()
      }))
      
      // Cache for 30 minutes
      await cache.set("product-hunt-feed", products, 30 * 60 * 1000)
      await storage.set("product-hunt-feed", products)
      
      res.send({ success: true, data: products })
      
    } catch (error) {
      await errorHandler.handleError("product-hunt", error)
      res.send({ success: false, error: error.message })
    }
  }
  
  export default handler
  ```

#### Ticket 4.2.3: Add Feed Parsing and Data Transformation
- **Description:** Create utilities to parse and normalize Product Hunt data
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Validate API response structure
  - Handle missing or null fields gracefully
  - Format dates and numbers consistently
  - Extract and normalize topic tags
  - Sanitize HTML in descriptions
- **Dependencies:** 4.2.2
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/parsers/productHuntParser.ts
  import DOMPurify from 'isomorphic-dompurify'
  
  export function parseProductHuntResponse(data: any): ProductHuntItem[] {
    if (!data?.data?.posts?.edges) {
      throw new Error("Invalid Product Hunt API response structure")
    }
    
    return data.data.posts.edges
      .map(edge => {
        try {
          return transformProduct(edge.node)
        } catch (error) {
          console.error(`Failed to parse product ${edge.node?.id}:`, error)
          return null
        }
      })
      .filter(Boolean)
  }
  
  function transformProduct(node: any): ProductHuntItem {
    return {
      id: node.id || generateId(),
      name: node.name || "Untitled Product",
      tagline: node.tagline || "",
      description: sanitizeHtml(node.description || ""),
      url: node.url || "#",
      website: normalizeUrl(node.website),
      votes: parseInt(node.votesCount) || 0,
      comments: parseInt(node.commentsCount) || 0,
      thumbnail: node.thumbnail?.url || null,
      topics: extractTopics(node.topics),
      hunter: transformUser(node.user),
      makers: (node.makers || []).map(transformUser),
      timestamp: parseDate(node.featuredAt || node.createdAt),
      featured: !!node.featuredAt
    }
  }
  
  function extractTopics(topics: any): string[] {
    if (!topics?.edges) return []
    
    return topics.edges
      .map(edge => edge.node?.name)
      .filter(Boolean)
      .slice(0, 5) // Limit to 5 topics
  }
  
  function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
      ALLOWED_ATTR: ['href', 'target']
    })
  }
  
  function normalizeUrl(url: string): string {
    if (!url) return ""
    if (url.startsWith("http")) return url
    return `https://${url}`
  }
  ```

#### Ticket 4.2.4: Create Product Card UI Components
- **Description:** Build beautiful, minimal product card components with hover effects
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Design clean card with product info
  - Add subtle hover animations
  - Display vote count with upvote button
  - Show maker avatars in stack
  - Optimize image loading with lazy load
  - Support dark mode
- **Dependencies:** 4.2.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/productHunt/ProductCard.tsx
  interface ProductCardProps {
    product: ProductHuntItem
    viewMode: 'compact' | 'expanded'
  }
  
  export function ProductCard({ product, viewMode }: ProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false)
    
    return (
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group block bg-white dark:bg-gray-800",
          "rounded-xl border border-gray-200 dark:border-gray-700",
          "hover:shadow-lg transition-all duration-200",
          "hover:border-gray-300 dark:hover:border-gray-600",
          viewMode === 'compact' ? 'p-4' : 'p-5'
        )}
      >
        <div className="flex gap-4">
          {/* Product Thumbnail */}
          {product.thumbnail && (
            <div className="flex-shrink-0">
              <div className={cn(
                "relative overflow-hidden rounded-lg bg-gray-100",
                viewMode === 'compact' ? 'w-16 h-16' : 'w-20 h-20'
              )}>
                {!imageLoaded && <Skeleton className="absolute inset-0" />}
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className={cn(
                    "w-full h-full object-cover",
                    "transition-opacity duration-300",
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy"
                />
              </div>
            </div>
          )}
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {product.tagline}
            </p>
            
            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              {/* Upvotes */}
              <div className="flex items-center gap-1">
                <TriangleUpIcon className="w-4 h-4" />
                <span>{product.votes}</span>
              </div>
              
              {/* Comments */}
              <div className="flex items-center gap-1">
                <MessageIcon className="w-4 h-4" />
                <span>{product.comments}</span>
              </div>
              
              {/* Topics */}
              {viewMode === 'expanded' && product.topics.length > 0 && (
                <div className="flex gap-1">
                  {product.topics.slice(0, 2).map(topic => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Makers */}
            {viewMode === 'expanded' && (
              <div className="flex items-center gap-2 mt-3">
                <MakerAvatars makers={product.makers} />
                <span className="text-xs text-gray-500">
                  by {product.hunter.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </a>
    )
  }
  
  function MakerAvatars({ makers }: { makers: User[] }) {
    const displayMakers = makers.slice(0, 3)
    const remainingCount = makers.length - 3
    
    return (
      <div className="flex -space-x-2">
        {displayMakers.map((maker, index) => (
          <img
            key={maker.username}
            src={maker.avatar}
            alt={maker.name}
            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
            style={{ zIndex: displayMakers.length - index }}
          />
        ))}
        {remainingCount > 0 && (
          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center">
            <span className="text-xs font-medium">+{remainingCount}</span>
          </div>
        )}
      </div>
    )
  }
  ```

#### Ticket 4.2.5: Add Filtering and Sorting Options
- **Description:** Implement filter bar for categories and sorting options
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Filter by product categories/topics
  - Sort by votes, date, or comments
  - Show active filter count
  - Clear all filters option
  - Persist filter preferences
- **Dependencies:** 4.2.4
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/productHunt/FilterBar.tsx
  interface FilterBarProps {
    activeFilter: string
    onFilterChange: (filter: string) => void
    categories: string[]
  }
  
  export function FilterBar({ 
    activeFilter, 
    onFilterChange, 
    categories 
  }: FilterBarProps) {
    const [showAll, setShowAll] = useState(false)
    const displayCategories = showAll ? categories : categories.slice(0, 5)
    
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <FilterChip
          label="All"
          active={activeFilter === 'all'}
          onClick={() => onFilterChange('all')}
        />
        
        {displayCategories.map(category => (
          <FilterChip
            key={category}
            label={category}
            active={activeFilter === category}
            onClick={() => onFilterChange(category)}
          />
        ))}
        
        {categories.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            {showAll ? 'Show less' : `+${categories.length - 5} more`}
          </button>
        )}
      </div>
    )
  }
  
  function FilterChip({ label, active, onClick }: {
    label: string
    active: boolean
    onClick: () => void
  }) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          "border border-gray-300 dark:border-gray-600",
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        )}
      >
        {label}
      </button>
    )
  }
  ```

---

## Story 4.3: Hacker News Feed
**Description:** Integrate Hacker News API to show top stories, discussions, and tech news relevant to product managers.

**Acceptance Criteria:**
- Fetch top, new, and best stories
- Display story metadata (points, comments, age)
- Support story type filtering
- Show comment previews on hover
- Link to both article and HN discussion

### Tickets:

#### Ticket 4.3.1: Build HackerNewsFeed Widget
- **Description:** Create the Hacker News feed widget with clean, readable design
- **Story Points:** 1 SP
- **Technical Requirements:**
  - List view with story titles and metadata
  - Color-coded story types (article, ask, show, job)
  - Responsive layout with good typography
  - Loading and error states
  - Configurable story count
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/HackerNewsFeed.tsx
  export function HackerNewsFeed() {
    const [stories] = useStorage<HackerNewsItem[]>("hacker-news-feed", [])
    const [storyType, setStoryType] = useState<'top' | 'new' | 'best'>('top')
    const [loading] = useStorage("hn-loading", false)
    
    const handleRefresh = async () => {
      await sendToBackground({
        name: "fetch-hacker-news",
        body: { type: storyType }
      })
    }
    
    return (
      <BaseWidget
        title="Hacker News"
        icon={<HackerNewsIcon />}
        onRefresh={handleRefresh}
      >
        {() => (
          <div className="space-y-3">
            <StoryTypeSelector
              activeType={storyType}
              onChange={setStoryType}
            />
            
            {loading ? (
              <StorySkeleton count={5} />
            ) : (
              <div className="space-y-2">
                {stories.map((story, index) => (
                  <StoryItem
                    key={story.id}
                    story={story}
                    rank={index + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 4.3.2: Integrate Hacker News API
- **Description:** Implement HN API integration in background script
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Fetch story IDs for different types
  - Batch fetch story details
  - Handle API rate limits
  - Parse and validate responses
  - Cache stories efficiently
- **Dependencies:** 4.1.1
- **Implementation Notes:**
  ```typescript
  // src/background/messages/fetch-hacker-news.ts
  const HN_API_BASE = "https://hacker-news.firebaseio.com/v0"
  
  const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { type = 'top' } = req.body
    const storage = new Storage({ area: "local" })
    const cache = new FeedCache(storage)
    
    try {
      // Get story IDs
      const idsResponse = await fetch(`${HN_API_BASE}/${type}stories.json`)
      const storyIds = await idsResponse.json()
      
      // Take first 30 stories
      const selectedIds = storyIds.slice(0, 30)
      
      // Batch fetch story details
      const stories = await Promise.all(
        selectedIds.map(async (id) => {
          // Check individual story cache
          const cached = await cache.get(`hn-story-${id}`)
          if (cached) return cached
          
          const storyResponse = await fetch(`${HN_API_BASE}/item/${id}.json`)
          const story = await storyResponse.json()
          
          // Cache individual story for 1 hour
          await cache.set(`hn-story-${id}`, story, 60 * 60 * 1000)
          
          return story
        })
      )
      
      // Transform to our data model
      const transformedStories: HackerNewsItem[] = stories
        .filter(story => story && !story.deleted && !story.dead)
        .map(story => ({
          id: story.id,
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          points: story.score || 0,
          author: story.by,
          time: story.time * 1000, // Convert to milliseconds
          comments: story.descendants || 0,
          type: story.type,
          text: story.text, // For Ask HN, Show HN posts
          domain: story.url ? new URL(story.url).hostname : 'news.ycombinator.com'
        }))
      
      await storage.set("hacker-news-feed", transformedStories)
      res.send({ success: true, data: transformedStories })
      
    } catch (error) {
      console.error("HN fetch error:", error)
      res.send({ success: false, error: error.message })
    }
  }
  ```

#### Ticket 4.3.3: Implement Story Ranking Display
- **Description:** Create story list items with proper ranking and metadata
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Show story rank number
  - Display points and comment count
  - Format time ago (e.g., "2 hours ago")
  - Show domain for external links
  - Color code by story age
- **Dependencies:** 4.3.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/hackerNews/StoryItem.tsx
  interface StoryItemProps {
    story: HackerNewsItem
    rank: number
  }
  
  export function StoryItem({ story, rank }: StoryItemProps) {
    const timeAgo = formatTimeAgo(story.time)
    const isNew = Date.now() - story.time < 3600000 // Less than 1 hour
    
    return (
      <div className="flex gap-3 py-2">
        <div className="flex-shrink-0 w-8 text-right">
          <span className="text-sm font-medium text-gray-500">
            {rank}.
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <a
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <h4 className="font-medium line-clamp-2">
                  {story.title}
                </h4>
              </a>
              
              {story.domain && story.domain !== 'news.ycombinator.com' && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({story.domain})
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">
              {story.points} points
            </span>
            
            <a
              href={`https://news.ycombinator.com/item?id=${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-600 transition-colors"
            >
              {story.comments} comments
            </a>
            
            <span>by {story.author}</span>
            
            <span className={cn(
              isNew && "text-green-600 dark:text-green-400 font-medium"
            )}>
              {timeAgo}
            </span>
          </div>
          
          {story.text && story.type === 'ask' && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {stripHtml(story.text)}
            </p>
          )}
        </div>
      </div>
    )
  }
  
  function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    
    return new Date(timestamp).toLocaleDateString()
  }
  ```

#### Ticket 4.3.4: Add Comment Count and Score Display
- **Description:** Show story engagement metrics with visual indicators
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Display comment count with icon
  - Show point score with color coding
  - Add "hot" indicator for trending stories
  - Calculate and show engagement ratio
  - Highlight stories with high discussion
- **Dependencies:** 4.3.3
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/hackerNews/StoryMetrics.tsx
  interface StoryMetricsProps {
    story: HackerNewsItem
  }
  
  export function StoryMetrics({ story }: StoryMetricsProps) {
    const engagementRatio = story.points > 0 
      ? story.comments / story.points 
      : 0
      
    const isHot = story.points > 100 && 
                  Date.now() - story.time < 3600000 * 6 // 6 hours
                  
    const isHighlyDiscussed = engagementRatio > 2
    
    return (
      <div className="flex items-center gap-2">
        {/* Points */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded",
          story.points > 500 
            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
            : story.points > 100
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        )}>
          <TriangleUpIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{story.points}</span>
        </div>
        
        {/* Comments */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded",
          isHighlyDiscussed
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        )}>
          <MessageIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{story.comments}</span>
        </div>
        
        {/* Hot indicator */}
        {isHot && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <FlameIcon className="w-3 h-3" />
            <span className="text-xs font-medium">Hot</span>
          </div>
        )}
      </div>
    )
  }
  ```

---

## Story 4.4: Jira Integration
**Description:** Build Jira integration to display team tickets, sprint progress, and project updates directly in the dashboard.

**Acceptance Criteria:**
- OAuth authentication with Jira
- Display assigned tickets and recent updates
- Show sprint progress and burndown
- Filter by project and assignee
- Quick actions for ticket updates

### Tickets:

#### Ticket 4.4.1: Create JiraFeed Widget Component
- **Description:** Build the Jira feed widget with ticket list and sprint info
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Display tickets in card format
  - Show ticket status, priority, and assignee
  - Include sprint progress bar
  - Add quick filters
  - Support multiple view modes
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/JiraFeed.tsx
  export function JiraFeed() {
    const [tickets] = useStorage<JiraTicket[]>("jira-tickets", [])
    const [projects] = useStorage<string[]>("jira-projects", [])
    const [selectedProject, setSelectedProject] = useState<string>("all")
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
    const [loading] = useStorage("jira-loading", false)
    
    const filteredTickets = useMemo(() => {
      if (selectedProject === "all") return tickets
      return tickets.filter(t => t.project === selectedProject)
    }, [tickets, selectedProject])
    
    return (
      <BaseWidget
        title="Jira Tickets"
        icon={<JiraIcon />}
        onRefresh={refreshJira}
        headerActions={
          <div className="flex items-center gap-2">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            <ProjectSelector
              projects={projects}
              selected={selectedProject}
              onChange={setSelectedProject}
            />
          </div>
        }
      >
        {() => (
          <div className="space-y-4">
            {loading ? (
              <TicketSkeleton count={3} />
            ) : viewMode === 'list' ? (
              <TicketList tickets={filteredTickets} />
            ) : (
              <TicketBoard tickets={filteredTickets} />
            )}
            
            <SprintProgress tickets={filteredTickets} />
          </div>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 4.4.2: Build Jira OAuth Flow
- **Description:** Implement OAuth 2.0 authentication flow for Jira Cloud
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create auth.tsx tab for OAuth redirect
  - Handle authorization code exchange
  - Store tokens securely
  - Implement token refresh
  - Handle multiple Jira instances
- **Dependencies:** 4.1.1, Epic 6 (for SecureStorage)
- **Implementation Notes:**
  ```typescript
  // src/tabs/auth.tsx
  export default function AuthPage() {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
    const [error, setError] = useState<string>()
    
    useEffect(() => {
      handleOAuthCallback()
    }, [])
    
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      
      if (!code) {
        setStatus('error')
        setError('No authorization code received')
        return
      }
      
      try {
        // Verify state to prevent CSRF
        const savedState = await storage.get('oauth-state')
        if (state !== savedState) {
          throw new Error('Invalid state parameter')
        }
        
        // Exchange code for tokens
        const response = await sendToBackground({
          name: "jira-oauth-exchange",
          body: { code }
        })
        
        if (response.success) {
          setStatus('success')
          // Close tab after 2 seconds
          setTimeout(() => window.close(), 2000)
        } else {
          throw new Error(response.error)
        }
      } catch (error) {
        setStatus('error')
        setError(error.message)
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <Spinner className="mx-auto mb-4" />
              <p>Connecting to Jira...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckIcon className="mx-auto mb-4 text-green-600" />
              <p>Successfully connected to Jira!</p>
              <p className="text-sm text-gray-600 mt-2">
                This tab will close automatically...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XIcon className="mx-auto mb-4 text-red-600" />
              <p>Failed to connect to Jira</p>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <Button onClick={() => window.close()} className="mt-4">
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }
  
  // background/messages/jira-oauth-exchange.ts
  const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { code } = req.body
    
    try {
      const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.PLASMO_PUBLIC_JIRA_CLIENT_ID,
          client_secret: await secureStorage.get('jira-client-secret'),
          code,
          redirect_uri: chrome.identity.getRedirectURL()
        })
      })
      
      const tokens = await tokenResponse.json()
      
      // Store tokens securely
      await secureStorage.set('jira-access-token', tokens.access_token)
      await secureStorage.set('jira-refresh-token', tokens.refresh_token)
      
      // Get accessible resources
      const resourcesResponse = await fetch(
        'https://api.atlassian.com/oauth/token/accessible-resources',
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        }
      )
      
      const resources = await resourcesResponse.json()
      await storage.set('jira-resources', resources)
      
      res.send({ success: true })
    } catch (error) {
      res.send({ success: false, error: error.message })
    }
  }
  ```

#### Ticket 4.4.3: Implement Jira REST API Client
- **Description:** Create client for fetching tickets, projects, and sprint data
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Use Jira Cloud REST API v3
  - Implement JQL query builder
  - Handle pagination for large result sets
  - Support multiple API endpoints
  - Add request caching and batching
- **Dependencies:** 4.4.2
- **Implementation Notes:**
  ```typescript
  // src/lib/api/jiraClient.ts
  export class JiraClient {
    constructor(
      private accessToken: string,
      private cloudId: string
    ) {}
    
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
      const response = await fetch(
        `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3${endpoint}`,
        {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options?.headers
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`)
      }
      
      return response.json()
    }
    
    async getMyIssues(options: {
      projects?: string[]
      maxResults?: number
      fields?: string[]
    } = {}): Promise<JiraIssue[]> {
      const jql = this.buildJQL({
        assignee: 'currentUser()',
        projects: options.projects,
        statusCategories: ['To Do', 'In Progress', 'Done']
      })
      
      const response = await this.request<JiraSearchResponse>('/search', {
        method: 'POST',
        body: JSON.stringify({
          jql,
          maxResults: options.maxResults || 50,
          fields: options.fields || [
            'summary',
            'status',
            'priority',
            'assignee',
            'reporter',
            'created',
            'updated',
            'duedate',
            'project',
            'issuetype',
            'sprint'
          ]
        })
      })
      
      return response.issues.map(this.transformIssue)
    }
    
    async getCurrentSprint(boardId: string): Promise<Sprint> {
      const response = await this.request<SprintResponse>(
        `/agile/1.0/board/${boardId}/sprint?state=active`
      )
      
      return response.values[0]
    }
    
    private buildJQL(filters: Record<string, any>): string {
      const clauses = []
      
      if (filters.assignee) {
        clauses.push(`assignee = ${filters.assignee}`)
      }
      
      if (filters.projects?.length) {
        clauses.push(`project in (${filters.projects.join(',')})`)
      }
      
      if (filters.statusCategories?.length) {
        clauses.push(`statusCategory in ("${filters.statusCategories.join('","')}")`)
      }
      
      clauses.push('ORDER BY updated DESC')
      
      return clauses.join(' AND ')
    }
    
    private transformIssue(issue: any): JiraTicket {
      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: {
          name: issue.fields.status.name,
          category: issue.fields.status.statusCategory.name,
          color: issue.fields.status.statusCategory.colorName
        },
        priority: {
          name: issue.fields.priority?.name || 'None',
          iconUrl: issue.fields.priority?.iconUrl
        },
        assignee: issue.fields.assignee ? {
          displayName: issue.fields.assignee.displayName,
          avatarUrl: issue.fields.assignee.avatarUrls['24x24']
        } : null,
        project: {
          key: issue.fields.project.key,
          name: issue.fields.project.name
        },
        type: {
          name: issue.fields.issuetype.name,
          iconUrl: issue.fields.issuetype.iconUrl
        },
        created: new Date(issue.fields.created).getTime(),
        updated: new Date(issue.fields.updated).getTime(),
        dueDate: issue.fields.duedate 
          ? new Date(issue.fields.duedate).getTime() 
          : null,
        sprint: issue.fields.sprint
      }
    }
  }
  ```

#### Ticket 4.4.4: Add Ticket Filtering by Project/Assignee
- **Description:** Implement advanced filtering options for Jira tickets
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Multi-select project filter
  - Assignee filter with avatar display
  - Status category filter
  - Priority filter
  - Save filter preferences
  - Quick filter presets
- **Dependencies:** 4.4.3
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/jira/TicketFilters.tsx
  interface TicketFiltersProps {
    tickets: JiraTicket[]
    onFilterChange: (filters: JiraFilters) => void
  }
  
  export function TicketFilters({ tickets, onFilterChange }: TicketFiltersProps) {
    const [filters, setFilters] = useStorage<JiraFilters>("jira-filters", {
      projects: [],
      assignees: [],
      statuses: [],
      priorities: []
    })
    
    const uniqueProjects = useMemo(() => 
      Array.from(new Set(tickets.map(t => t.project.key))),
      [tickets]
    )
    
    const uniqueAssignees = useMemo(() => {
      const assigneeMap = new Map()
      tickets.forEach(t => {
        if (t.assignee) {
          assigneeMap.set(t.assignee.displayName, t.assignee)
        }
      })
      return Array.from(assigneeMap.values())
    }, [tickets])
    
    const updateFilter = (key: keyof JiraFilters, value: any) => {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      onFilterChange(newFilters)
    }
    
    return (
      <div className="space-y-3">
        {/* Project Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Projects
          </label>
          <MultiSelect
            options={uniqueProjects.map(p => ({ value: p, label: p }))}
            selected={filters.projects}
            onChange={(selected) => updateFilter('projects', selected)}
            placeholder="All projects"
          />
        </div>
        
        {/* Assignee Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assignees
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {uniqueAssignees.map(assignee => (
              <button
                key={assignee.displayName}
                onClick={() => {
                  const isSelected = filters.assignees.includes(assignee.displayName)
                  updateFilter(
                    'assignees',
                    isSelected
                      ? filters.assignees.filter(a => a !== assignee.displayName)
                      : [...filters.assignees, assignee.displayName]
                  )
                }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full",
                  "border transition-colors",
                  filters.assignees.includes(assignee.displayName)
                    ? "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                    : "bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                )}
              >
                <img
                  src={assignee.avatarUrl}
                  alt={assignee.displayName}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm">{assignee.displayName}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex gap-2">
          <QuickFilterButton
            label="My Open Tickets"
            onClick={() => {
              updateFilter('assignees', [currentUser.displayName])
              updateFilter('statuses', ['To Do', 'In Progress'])
            }}
          />
          <QuickFilterButton
            label="Due This Week"
            onClick={() => {
              // Filter logic for due dates
            }}
          />
          <QuickFilterButton
            label="High Priority"
            onClick={() => {
              updateFilter('priorities', ['Highest', 'High'])
            }}
          />
        </div>
      </div>
    )
  }
  ```

#### Ticket 4.4.5: Create Ticket Status Visualization
- **Description:** Build visual components to display ticket status and sprint progress
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Status badges with Jira colors
  - Sprint progress bar
  - Burndown chart mini view
  - Ticket type icons
  - Priority indicators
- **Dependencies:** 4.4.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/jira/SprintProgress.tsx
  interface SprintProgressProps {
    tickets: JiraTicket[]
    sprint?: Sprint
  }
  
  export function SprintProgress({ tickets, sprint }: SprintProgressProps) {
    const stats = useMemo(() => {
      const total = tickets.length
      const done = tickets.filter(t => t.status.category === 'Done').length
      const inProgress = tickets.filter(t => t.status.category === 'In Progress').length
      const todo = tickets.filter(t => t.status.category === 'To Do').length
      
      return {
        total,
        done,
        inProgress,
        todo,
        donePercentage: total > 0 ? (done / total) * 100 : 0,
        inProgressPercentage: total > 0 ? (inProgress / total) * 100 : 0
      }
    }, [tickets])
    
    const sprintDaysRemaining = sprint 
      ? Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
    
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Sprint Progress
          </h4>
          {sprintDaysRemaining !== null && (
            <span className="text-sm text-gray-500">
              {sprintDaysRemaining} days remaining
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
            style={{ width: `${stats.donePercentage}%` }}
          />
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
            style={{ 
              width: `${stats.donePercentage + stats.inProgressPercentage}%`,
              transform: `translateX(${stats.donePercentage}%)`
            }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white mix-blend-difference">
              {stats.done} / {stats.total} completed
            </span>
          </div>
        </div>
        
        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <StatusCard
            label="To Do"
            count={stats.todo}
            color="gray"
          />
          <StatusCard
            label="In Progress"
            count={stats.inProgress}
            color="blue"
          />
          <StatusCard
            label="Done"
            count={stats.done}
            color="green"
          />
        </div>
      </div>
    )
  }
  
  function StatusCard({ label, count, color }: {
    label: string
    count: number
    color: string
  }) {
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }
    
    return (
      <div className={cn(
        "rounded-lg p-2 text-center",
        colorClasses[color]
      )}>
        <div className="text-2xl font-semibold">{count}</div>
        <div className="text-xs">{label}</div>
      </div>
    )
  }
  ```

---

## Story 4.5: RSS Aggregator
**Description:** Build a flexible RSS feed aggregator that allows PMs to follow industry blogs, company updates, and custom news sources.

**Acceptance Criteria:**
- Support multiple RSS feed URLs
- Parse various RSS/Atom formats
- Categorize feeds by source
- Show article previews
- Mark articles as read

### Tickets:

#### Ticket 4.5.1: Build RssFeed Widget
- **Description:** Create the RSS aggregator widget with feed management UI
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Display articles from multiple feeds
  - Show source favicon and name
  - Support list and card view modes
  - Add/remove feed sources
  - Mark as read functionality
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/RssFeed.tsx
  export function RssFeed() {
    const [articles] = useStorage<RssArticle[]>("rss-articles", [])
    const [sources] = useStorage<RssSource[]>("rss-sources", [])
    const [selectedSource, setSelectedSource] = useState<string>("all")
    const [readArticles, setReadArticles] = useStorage<string[]>("rss-read", [])
    const [showManageSources, setShowManageSources] = useState(false)
    
    const filteredArticles = useMemo(() => {
      let filtered = selectedSource === "all" 
        ? articles 
        : articles.filter(a => a.sourceId === selectedSource)
        
      return filtered.sort((a, b) => b.publishedAt - a.publishedAt)
    }, [articles, selectedSource])
    
    const markAsRead = (articleId: string) => {
      if (!readArticles.includes(articleId)) {
        setReadArticles([...readArticles, articleId])
      }
    }
    
    return (
      <BaseWidget
        title="RSS Feeds"
        icon={<RssIcon />}
        onRefresh={refreshRssFeeds}
        headerActions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowManageSources(true)}
          >
            Manage Sources
          </Button>
        }
      >
        {() => (
          <>
            <div className="space-y-4">
              <SourceSelector
                sources={sources}
                selected={selectedSource}
                onChange={setSelectedSource}
              />
              
              <div className="space-y-3">
                {filteredArticles.map(article => (
                  <RssArticleCard
                    key={article.id}
                    article={article}
                    isRead={readArticles.includes(article.id)}
                    onRead={() => markAsRead(article.id)}
                    source={sources.find(s => s.id === article.sourceId)}
                  />
                ))}
              </div>
            </div>
            
            {showManageSources && (
              <ManageSourcesModal
                sources={sources}
                onClose={() => setShowManageSources(false)}
              />
            )}
          </>
        )}
      </BaseWidget>
    )
  }
  ```

#### Ticket 4.5.2: Implement RSS Parser
- **Description:** Create robust RSS/Atom feed parser in background script
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Support RSS 2.0, RSS 1.0, and Atom formats
  - Extract title, description, link, date, author
  - Handle various date formats
  - Parse HTML content safely
  - Extract images from content
- **Dependencies:** 4.1.1
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/rssParser.ts
  export class RssParser {
    async parse(xmlText: string, sourceUrl: string): Promise<RssArticle[]> {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlText, 'text/xml')
      
      // Check for parse errors
      const parseError = doc.querySelector('parsererror')
      if (parseError) {
        throw new Error('Invalid XML: ' + parseError.textContent)
      }
      
      // Detect feed type
      const feedType = this.detectFeedType(doc)
      
      switch (feedType) {
        case 'rss2':
          return this.parseRss2(doc, sourceUrl)
        case 'atom':
          return this.parseAtom(doc, sourceUrl)
        case 'rss1':
          return this.parseRss1(doc, sourceUrl)
        default:
          throw new Error('Unknown feed format')
      }
    }
    
    private detectFeedType(doc: Document): string {
      if (doc.querySelector('rss[version="2.0"]')) return 'rss2'
      if (doc.querySelector('feed[xmlns*="atom"]')) return 'atom'
      if (doc.querySelector('RDF')) return 'rss1'
      return 'unknown'
    }
    
    private parseRss2(doc: Document, sourceUrl: string): RssArticle[] {
      const items = doc.querySelectorAll('item')
      const articles: RssArticle[] = []
      
      items.forEach(item => {
        try {
          const article: RssArticle = {
            id: this.extractText(item, 'guid') || this.generateId(item),
            title: this.extractText(item, 'title') || 'Untitled',
            description: this.extractText(item, 'description') || '',
            link: this.extractText(item, 'link') || '',
            author: this.extractText(item, 'author') || 
                    this.extractText(item, 'dc:creator') || '',
            publishedAt: this.parseDate(
              this.extractText(item, 'pubDate') || 
              this.extractText(item, 'dc:date')
            ),
            categories: Array.from(item.querySelectorAll('category'))
              .map(cat => cat.textContent?.trim())
              .filter(Boolean),
            imageUrl: this.extractImage(item),
            sourceUrl
          }
          
          articles.push(article)
        } catch (error) {
          console.error('Failed to parse RSS item:', error)
        }
      })
      
      return articles
    }
    
    private parseAtom(doc: Document, sourceUrl: string): RssArticle[] {
      const entries = doc.querySelectorAll('entry')
      const articles: RssArticle[] = []
      
      entries.forEach(entry => {
        try {
          const article: RssArticle = {
            id: this.extractText(entry, 'id') || this.generateId(entry),
            title: this.extractText(entry, 'title') || 'Untitled',
            description: this.extractText(entry, 'summary') || 
                        this.extractText(entry, 'content') || '',
            link: entry.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
                  entry.querySelector('link')?.getAttribute('href') || '',
            author: this.extractText(entry, 'author name') || '',
            publishedAt: this.parseDate(
              this.extractText(entry, 'published') || 
              this.extractText(entry, 'updated')
            ),
            categories: Array.from(entry.querySelectorAll('category'))
              .map(cat => cat.getAttribute('term'))
              .filter(Boolean),
            imageUrl: this.extractAtomImage(entry),
            sourceUrl
          }
          
          articles.push(article)
        } catch (error) {
          console.error('Failed to parse Atom entry:', error)
        }
      })
      
      return articles
    }
    
    private extractText(parent: Element, selector: string): string {
      return parent.querySelector(selector)?.textContent?.trim() || ''
    }
    
    private extractImage(item: Element): string | null {
      // Try various common image locations
      const enclosure = item.querySelector('enclosure[type^="image"]')
      if (enclosure) {
        return enclosure.getAttribute('url')
      }
      
      // Check media:thumbnail
      const thumbnail = item.querySelector('thumbnail')
      if (thumbnail) {
        return thumbnail.getAttribute('url')
      }
      
      // Extract from description HTML
      const description = this.extractText(item, 'description')
      const imgMatch = description.match(/<img[^>]+src="([^"]+)"/)
      if (imgMatch) {
        return imgMatch[1]
      }
      
      return null
    }
    
    private parseDate(dateStr: string): number {
      if (!dateStr) return Date.now()
      
      // Try parsing with Date constructor first
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.getTime()
      }
      
      // Try common RSS date formats
      const formats = [
        /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
        /(\w{3}), (\d{2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})/
      ]
      
      // Fallback to current date
      return Date.now()
    }
  }
  ```

#### Ticket 4.5.3: Add Multiple Feed Support
- **Description:** Allow users to add and manage multiple RSS feed sources
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Add feed URL validation
  - Auto-detect feed title and description
  - Store feed metadata
  - Handle feed icons/favicons
  - Support OPML import/export
- **Dependencies:** 4.5.2
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/rss/ManageSourcesModal.tsx
  export function ManageSourcesModal({ sources, onClose }: {
    sources: RssSource[]
    onClose: () => void
  }) {
    const [newFeedUrl, setNewFeedUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>()
    
    const addFeed = async () => {
      setLoading(true)
      setError(undefined)
      
      try {
        // Validate URL
        const url = new URL(newFeedUrl)
        
        // Check if already exists
        if (sources.some(s => s.url === url.href)) {
          throw new Error('Feed already added')
        }
        
        // Fetch and validate feed
        const response = await sendToBackground({
          name: "validate-rss-feed",
          body: { url: url.href }
        })
        
        if (!response.success) {
          throw new Error(response.error)
        }
        
        // Add to sources
        const newSource: RssSource = {
          id: generateId(),
          url: url.href,
          title: response.data.title || url.hostname,
          description: response.data.description,
          favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}`,
          addedAt: Date.now(),
          enabled: true
        }
        
        await storage.set('rss-sources', [...sources, newSource])
        setNewFeedUrl('')
        
        // Fetch articles immediately
        await sendToBackground({
          name: "fetch-rss-feed",
          body: { sourceId: newSource.id }
        })
        
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    const importOPML = async (file: File) => {
      const text = await file.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      
      const outlines = doc.querySelectorAll('outline[xmlUrl]')
      const newSources: RssSource[] = []
      
      outlines.forEach(outline => {
        const url = outline.getAttribute('xmlUrl')
        if (url && !sources.some(s => s.url === url)) {
          newSources.push({
            id: generateId(),
            url,
            title: outline.getAttribute('title') || 
                   outline.getAttribute('text') || 
                   new URL(url).hostname,
            description: outline.getAttribute('description'),
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`,
            addedAt: Date.now(),
            enabled: true
          })
        }
      })
      
      if (newSources.length > 0) {
        await storage.set('rss-sources', [...sources, ...newSources])
        toast.success(`Imported ${newSources.length} feeds`)
      }
    }
    
    return (
      <Modal open onClose={onClose}>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Manage RSS Sources</h2>
          
          {/* Add New Feed */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Add New Feed
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="flex-1"
              />
              <Button
                onClick={addFeed}
                disabled={!newFeedUrl || loading}
              >
                {loading ? <Spinner /> : 'Add'}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
          
          {/* Current Sources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Current Sources ({sources.length})
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById('opml-import')?.click()}
                >
                  Import OPML
                </Button>
                <input
                  id="opml-import"
                  type="file"
                  accept=".opml,.xml"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && importOPML(e.target.files[0])}
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sources.map(source => (
                <SourceItem
                  key={source.id}
                  source={source}
                  onToggle={() => toggleSource(source.id)}
                  onRemove={() => removeSource(source.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    )
  }
  ```

#### Ticket 4.5.4: Create Feed Management UI
- **Description:** Build interface for users to organize and manage their RSS feeds
- **Story Points:** 1 SP
- **Technical Requirements:**
  - List all feed sources with metadata
  - Enable/disable feeds
  - Edit feed names and categories
  - Show last fetch time and status
  - Bulk actions (enable all, disable all, remove)
- **Dependencies:** 4.5.3
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/rss/SourceItem.tsx
  interface SourceItemProps {
    source: RssSource
    onToggle: () => void
    onRemove: () => void
    onEdit?: (updates: Partial<RssSource>) => void
  }
  
  export function SourceItem({ 
    source, 
    onToggle, 
    onRemove, 
    onEdit 
  }: SourceItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedTitle, setEditedTitle] = useState(source.title)
    const metrics = useStorage(`feed-metrics:rss-${source.id}`)
    
    const saveEdit = () => {
      if (onEdit && editedTitle !== source.title) {
        onEdit({ title: editedTitle })
      }
      setIsEditing(false)
    }
    
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        "bg-white dark:bg-gray-800",
        source.enabled
          ? "border-gray-200 dark:border-gray-700"
          : "border-gray-200 dark:border-gray-700 opacity-60"
      )}>
        {/* Favicon */}
        <img
          src={source.favicon}
          alt=""
          className="w-5 h-5 rounded"
          onError={(e) => {
            e.currentTarget.src = '/default-feed-icon.svg'
          }}
        />
        
        {/* Feed Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              className="h-6 text-sm"
              autoFocus
            />
          ) : (
            <h4 
              className="font-medium text-sm truncate cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {source.title}
            </h4>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="truncate">{new URL(source.url).hostname}</span>
            {metrics?.lastSuccess && (
              <span>
                Updated {formatTimeAgo(metrics.lastSuccess)}
              </span>
            )}
            <StatusIndicator status={metrics?.status || 'unknown'} />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Switch
            checked={source.enabled}
            onCheckedChange={onToggle}
            aria-label="Enable feed"
          />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }
  
  function StatusIndicator({ status }: { status: string }) {
    const config = {
      healthy: { color: 'text-green-600', label: 'Active' },
      degraded: { color: 'text-yellow-600', label: 'Issues' },
      down: { color: 'text-red-600', label: 'Error' },
      unknown: { color: 'text-gray-400', label: 'Unknown' }
    }
    
    const { color, label } = config[status] || config.unknown
    
    return (
      <span className={cn("flex items-center gap-1", color)}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
    )
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ Robust feed infrastructure with caching and error handling
- ✅ Product Hunt integration with beautiful product cards
- ✅ Hacker News feed with story ranking and metrics
- ✅ Jira integration with OAuth and ticket management
- ✅ RSS aggregator supporting multiple sources
- ✅ Modern, minimal UI design throughout

### Key Milestones:
1. **Feed Infrastructure Complete** - Background fetching and caching working
2. **All Feeds Integrated** - Product Hunt, HN, Jira, RSS functional
3. **UI Polish Complete** - All widgets following modern design principles
4. **Performance Optimized** - Efficient caching and data management

### Next Steps:
- Proceed to Epic 5: Web Clipper - Build content capture functionality
- Add more data sources based on user feedback
- Implement feed analytics and insights
- Create feed notification system for important updates