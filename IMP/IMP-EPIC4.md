# Epic 4: Data Feeds

## Epic Overview
Implement real-time data feeds from various sources to provide PMs with up-to-date industry insights, product launches, engineering discussions, and team activity. This epic focuses on building a robust feed infrastructure with caching, error handling, and beautiful data presentation following modern, clean, and minimal design principles.

**Epic Goals:**
- Build scalable feed fetching infrastructure in background script
- Implement feeds for Product Hunt, Hacker News, Jira, and RSS
- Create responsive, minimal feed widgets
- Ensure reliable data updates with proper error handling
- Optimize performance with intelligent caching

**Total Story Points:** 54 SP  
**Total Stories:** 5  
**Total Tickets:** 33  

---

## Story 4.1: Feed Infrastructure
**Description:** Create a robust, scalable foundation for fetching, caching, and managing data feeds with advanced error handling, performance optimization, and security features using Chrome's alarm API and Plasmo's storage system.

**Acceptance Criteria:**
- Background worker with intelligent feed orchestration and priority management
- Advanced caching with compression, ETags, and delta updates
- Comprehensive error handling with circuit breakers and offline support
- Real-time feed monitoring with performance profiling and quality metrics
- Configurable refresh intervals with A/B testing capabilities
- Security layer with CORS proxy and content sanitization
- Performance optimization using WebWorkers and request batching
- Network resilience with graceful degradation

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

#### Ticket 4.1.2: Implement Advanced Feed Caching System
- **Description:** Build intelligent caching system with compression, ETags, and image optimization to minimize API calls and maximize storage efficiency
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Cache responses with TTL and ETag support for conditional requests
  - Implement LZString compression for text content
  - Add image optimization with lazy loading and thumbnail generation
  - Smart cache invalidation with partial updates (delta sync)
  - Store cache in chrome.storage.local with IndexedDB fallback
  - Add comprehensive cache hit/miss/stale metrics
  - Implement cache warming for frequently accessed feeds
  - Handle cache size limits with intelligent eviction policies
  - Support offline mode with stale-while-revalidate strategy
- **Dependencies:** 4.1.1
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/FeedCache.ts
  import LZString from 'lz-string'
  
  interface CacheEntry<T> {
    data: T
    compressed?: boolean
    timestamp: number
    ttl: number
    etag?: string
    lastModified?: string
    size: number
    accessCount: number
    lastAccessed: number
  }
  
  interface CacheStrategy {
    compress: boolean
    ttl: number
    maxSize: number
    staleWhileRevalidate: boolean
  }
  
  export class FeedCache {
    private readonly COMPRESSION_THRESHOLD = 1024 // 1KB
    private readonly MAX_CACHE_SIZE = 4 * 1024 * 1024 // 4MB (leaving 1MB buffer)
    private currentSize = 0
    
    constructor(
      private storage: Storage,
      private indexedDB?: IDBDatabase
    ) {
      this.initializeCache()
    }
    
    async get<T>(key: string, strategy?: CacheStrategy): Promise<{
      data: T | null
      stale?: boolean
      etag?: string
    }> {
      const cacheKey = `cache:${key}`
      const entry = await this.getFromStorage<CacheEntry<T>>(cacheKey)
      
      if (!entry) return { data: null }
      
      // Update access metrics
      entry.accessCount++
      entry.lastAccessed = Date.now()
      
      // Check if cache is still valid
      const now = Date.now()
      const isExpired = now - entry.timestamp > entry.ttl
      
      if (isExpired && !strategy?.staleWhileRevalidate) {
        await this.remove(cacheKey)
        return { data: null }
      }
      
      // Decompress if needed
      let data = entry.data
      if (entry.compressed && typeof data === 'string') {
        data = JSON.parse(LZString.decompressFromUTF16(data))
      }
      
      return {
        data,
        stale: isExpired,
        etag: entry.etag
      }
    }
    
    async set<T>(
      key: string, 
      data: T, 
      strategy: CacheStrategy,
      headers?: {
        etag?: string
        lastModified?: string
      }
    ): Promise<void> {
      const cacheKey = `cache:${key}`
      const dataStr = JSON.stringify(data)
      const shouldCompress = strategy.compress && 
                           dataStr.length > this.COMPRESSION_THRESHOLD
      
      let processedData: any = data
      let size = dataStr.length
      
      if (shouldCompress) {
        processedData = LZString.compressToUTF16(dataStr)
        size = processedData.length * 2 // UTF-16 chars are 2 bytes
      }
      
      // Check if we need to evict before adding
      if (this.currentSize + size > this.MAX_CACHE_SIZE) {
        await this.evictWithLRU(size)
      }
      
      const entry: CacheEntry<T> = {
        data: processedData,
        compressed: shouldCompress,
        timestamp: Date.now(),
        ttl: strategy.ttl,
        size,
        accessCount: 0,
        lastAccessed: Date.now(),
        ...headers
      }
      
      await this.setToStorage(cacheKey, entry)
      this.currentSize += size
    }
    
    async validateWithEtag(key: string, currentEtag: string): Promise<boolean> {
      const result = await this.get(key)
      return result.etag === currentEtag
    }
    
    async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
      const promises = keys.map(async (key) => {
        const cached = await this.get(key)
        if (!cached.data) {
          const data = await fetcher(key)
          await this.set(key, data, { 
            compress: true, 
            ttl: 3600000,
            maxSize: 1024 * 1024,
            staleWhileRevalidate: true 
          })
        }
      })
      
      await Promise.allSettled(promises)
    }
    
    private async evictWithLRU(requiredSpace: number): Promise<void> {
      const allEntries = await this.getAllCacheEntries()
      
      // Sort by LRU score (combination of access count and last accessed)
      allEntries.sort((a, b) => {
        const scoreA = a.entry.accessCount * 0.3 + 
                      (Date.now() - a.entry.lastAccessed) * 0.7
        const scoreB = b.entry.accessCount * 0.3 + 
                      (Date.now() - b.entry.lastAccessed) * 0.7
        return scoreB - scoreA // Higher score = less likely to evict
      })
      
      let freedSpace = 0
      let i = allEntries.length - 1
      
      while (freedSpace < requiredSpace && i >= 0) {
        const entry = allEntries[i]
        await this.remove(entry.key)
        freedSpace += entry.entry.size
        i--
      }
    }
    
    private async getFromStorage<T>(key: string): Promise<T | null> {
      // Try chrome.storage first
      try {
        return await this.storage.get(key)
      } catch (error) {
        // Fallback to IndexedDB for large items
        if (this.indexedDB) {
          return await this.getFromIndexedDB(key)
        }
        return null
      }
    }
    
    private async setToStorage(key: string, value: any): Promise<void> {
      try {
        await this.storage.set(key, value)
      } catch (error) {
        // Fallback to IndexedDB for large items
        if (this.indexedDB && error.message?.includes('QUOTA_BYTES')) {
          await this.setToIndexedDB(key, value)
        } else {
          throw error
        }
      }
    }
    
    // Image optimization methods
    async cacheImage(url: string, options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
    } = {}): Promise<string> {
      const cached = await this.get(`img:${url}`)
      if (cached.data) return cached.data as string
      
      const optimized = await this.optimizeImage(url, options)
      await this.set(`img:${url}`, optimized, {
        compress: false, // Already optimized
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxSize: 500 * 1024, // 500KB max
        staleWhileRevalidate: true
      })
      
      return optimized
    }
    
    private async optimizeImage(url: string, options: any): Promise<string> {
      // Implementation would use Canvas API to resize/compress
      // This is a placeholder for the actual implementation
      return url
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

#### Ticket 4.1.4: Advanced Feed Monitoring and Analytics
- **Description:** Build comprehensive monitoring system with performance profiling, quality metrics, and user engagement tracking
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Performance profiling with detailed fetch timing breakdown
  - Feed quality metrics (duplicate content, broken links, parse errors)
  - User engagement tracking (views, clicks, time spent)
  - Calculate success/failure rates with categorized error analysis
  - Store metrics in rolling windows (1h, 24h, 7d, 30d)
  - Real-time alerting thresholds with customizable triggers
  - A/B testing framework for optimizing fetch intervals
  - Historical trend analysis and anomaly detection
  - Export metrics to external monitoring services
  - Dashboard with visualizations and insights
- **Dependencies:** 4.1.3
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/FeedMonitor.ts
  interface PerformanceProfile {
    networkTime: number
    parseTime: number
    cacheTime: number
    totalTime: number
    memoryUsed: number
    itemsProcessed: number
  }
  
  interface QualityMetrics {
    duplicateCount: number
    brokenLinksCount: number
    parseErrorCount: number
    contentQualityScore: number
    freshContentRatio: number
  }
  
  interface EngagementMetrics {
    views: number
    clicks: number
    avgTimeSpent: number
    interactionRate: number
    bookmarks: number
  }
  
  interface FeedMetrics {
    lastSuccess: number
    lastAttempt: number
    successRate: number
    avgResponseTime: number
    status: 'healthy' | 'degraded' | 'down' | 'critical'
    performance: PerformanceProfile
    quality: QualityMetrics
    engagement: EngagementMetrics
    history: {
      '1h': MetricWindow
      '24h': MetricWindow
      '7d': MetricWindow
      '30d': MetricWindow
    }
    alerts: Alert[]
  }
  
  interface MetricWindow {
    dataPoints: Array<{
      timestamp: number
      success: boolean
      duration: number
      performance?: PerformanceProfile
      errors?: string[]
    }>
    aggregates: {
      successRate: number
      avgDuration: number
      p95Duration: number
      errorBreakdown: Record<string, number>
    }
  }
  
  export class FeedMonitor {
    private metrics = new Map<string, FeedMetrics>()
    private alertThresholds: AlertThresholds
    private abTests = new Map<string, ABTest>()
    
    constructor(
      private storage: Storage,
      private analytics?: AnalyticsService
    ) {
      this.initializeMonitoring()
    }
    
    async recordFetch(
      feedType: string,
      result: FetchResult,
      profile: PerformanceProfile
    ): Promise<void> {
      const metrics = this.getOrCreateMetrics(feedType)
      const timestamp = Date.now()
      
      // Update basic metrics
      metrics.lastAttempt = timestamp
      if (result.success) metrics.lastSuccess = timestamp
      
      // Record performance profile
      metrics.performance = this.updatePerformanceProfile(
        metrics.performance,
        profile
      )
      
      // Update quality metrics if successful
      if (result.success && result.data) {
        metrics.quality = await this.analyzeQuality(result.data, feedType)
      }
      
      // Add to appropriate time windows
      this.updateTimeWindows(metrics, {
        timestamp,
        success: result.success,
        duration: profile.totalTime,
        performance: profile,
        errors: result.errors
      })
      
      // Calculate aggregates
      this.calculateAggregates(metrics)
      
      // Check alerts
      await this.checkAlerts(feedType, metrics)
      
      // Run A/B tests
      await this.runABTests(feedType, metrics)
      
      // Detect anomalies
      await this.detectAnomalies(feedType, metrics)
      
      // Store metrics
      await this.storage.set(`feed-metrics:${feedType}`, metrics)
      
      // Send to external monitoring
      if (this.analytics) {
        await this.analytics.track('feed_fetch', {
          feedType,
          success: result.success,
          duration: profile.totalTime,
          quality: metrics.quality.contentQualityScore
        })
      }
    }
    
    async recordEngagement(
      feedType: string,
      action: 'view' | 'click' | 'bookmark',
      itemId?: string,
      duration?: number
    ): Promise<void> {
      const metrics = this.getOrCreateMetrics(feedType)
      
      switch (action) {
        case 'view':
          metrics.engagement.views++
          if (duration) {
            metrics.engagement.avgTimeSpent = 
              (metrics.engagement.avgTimeSpent * (metrics.engagement.views - 1) + duration) / 
              metrics.engagement.views
          }
          break
        case 'click':
          metrics.engagement.clicks++
          break
        case 'bookmark':
          metrics.engagement.bookmarks++
          break
      }
      
      // Calculate interaction rate
      metrics.engagement.interactionRate = 
        (metrics.engagement.clicks + metrics.engagement.bookmarks) / 
        Math.max(metrics.engagement.views, 1)
      
      await this.storage.set(`feed-metrics:${feedType}`, metrics)
    }
    
    private async analyzeQuality(
      data: FeedItem[],
      feedType: string
    ): Promise<QualityMetrics> {
      const quality: QualityMetrics = {
        duplicateCount: 0,
        brokenLinksCount: 0,
        parseErrorCount: 0,
        contentQualityScore: 0,
        freshContentRatio: 0
      }
      
      // Check for duplicates
      const uniqueIds = new Set<string>()
      const uniqueContent = new Set<string>()
      
      for (const item of data) {
        if (uniqueIds.has(item.id)) {
          quality.duplicateCount++
        }
        uniqueIds.add(item.id)
        
        // Content hash for near-duplicate detection
        const contentHash = this.hashContent(item.title + item.description)
        if (uniqueContent.has(contentHash)) {
          quality.duplicateCount++
        }
        uniqueContent.add(contentHash)
        
        // Check for broken links (would be async in real implementation)
        if (!item.url || item.url.includes('undefined')) {
          quality.brokenLinksCount++
        }
        
        // Check parse quality
        if (!item.title || !item.description) {
          quality.parseErrorCount++
        }
      }
      
      // Calculate content quality score (0-100)
      quality.contentQualityScore = Math.round(
        100 * (1 - (quality.duplicateCount + quality.brokenLinksCount + quality.parseErrorCount) / 
        Math.max(data.length, 1))
      )
      
      // Calculate fresh content ratio (items from last 24h)
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000
      const freshItems = data.filter(item => item.publishedAt > dayAgo).length
      quality.freshContentRatio = freshItems / Math.max(data.length, 1)
      
      return quality
    }
    
    private async checkAlerts(
      feedType: string,
      metrics: FeedMetrics
    ): Promise<void> {
      const alerts: Alert[] = []
      
      // Performance alerts
      if (metrics.avgResponseTime > this.alertThresholds.maxResponseTime) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `Average response time (${metrics.avgResponseTime}ms) exceeds threshold`,
          timestamp: Date.now()
        })
      }
      
      // Quality alerts
      if (metrics.quality.contentQualityScore < this.alertThresholds.minQualityScore) {
        alerts.push({
          type: 'quality',
          severity: 'error',
          message: `Content quality score (${metrics.quality.contentQualityScore}) below threshold`,
          timestamp: Date.now()
        })
      }
      
      // Availability alerts
      if (metrics.successRate < this.alertThresholds.minSuccessRate) {
        alerts.push({
          type: 'availability',
          severity: 'critical',
          message: `Success rate (${metrics.successRate}%) critically low`,
          timestamp: Date.now()
        })
      }
      
      // Store and notify
      metrics.alerts = alerts
      if (alerts.length > 0) {
        await this.notifyAlerts(feedType, alerts)
      }
    }
    
    private async runABTests(
      feedType: string,
      metrics: FeedMetrics
    ): Promise<void> {
      const test = this.abTests.get(feedType)
      if (!test || !test.active) return
      
      // Determine variant based on current config
      const variant = Math.random() < 0.5 ? 'control' : 'test'
      
      // Apply variant config (e.g., different fetch intervals)
      if (variant === 'test') {
        await this.applyTestConfig(feedType, test.testConfig)
      }
      
      // Record results
      test.results[variant].samples++
      test.results[variant].avgPerformance = 
        (test.results[variant].avgPerformance * (test.results[variant].samples - 1) + 
         metrics.avgResponseTime) / test.results[variant].samples
      
      // Check for statistical significance
      if (test.results.control.samples > 100 && test.results.test.samples > 100) {
        const improvement = 
          (test.results.control.avgPerformance - test.results.test.avgPerformance) / 
          test.results.control.avgPerformance
        
        if (Math.abs(improvement) > 0.1) { // 10% improvement threshold
          await this.concludeABTest(feedType, test, improvement > 0)
        }
      }
    }
    
    async exportMetrics(format: 'json' | 'csv' | 'prometheus'): Promise<string> {
      const allMetrics = Array.from(this.metrics.entries())
      
      switch (format) {
        case 'json':
          return JSON.stringify(allMetrics, null, 2)
        case 'csv':
          return this.convertToCSV(allMetrics)
        case 'prometheus':
          return this.convertToPrometheus(allMetrics)
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
    }
    
    getDashboardData(): DashboardData {
      const feeds = Array.from(this.metrics.entries())
      
      return {
        overview: {
          totalFeeds: feeds.length,
          healthyFeeds: feeds.filter(([_, m]) => m.status === 'healthy').length,
          avgResponseTime: this.calculateGlobalAvg(feeds, 'avgResponseTime'),
          totalEngagement: this.calculateTotalEngagement(feeds)
        },
        feeds: feeds.map(([type, metrics]) => ({
          type,
          status: metrics.status,
          performance: metrics.performance,
          quality: metrics.quality,
          engagement: metrics.engagement,
          trend: this.calculateTrend(metrics)
        })),
        alerts: this.getAllActiveAlerts(feeds),
        insights: this.generateInsights(feeds)
      }
    }
  }
  ```

#### Ticket 4.1.5: FeedManager Orchestration
- **Description:** Implement central FeedManager class to coordinate all feed operations with intelligent prioritization and resource management
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Create unified feed item interface for all feed types
  - Implement feed deduplication across different sources
  - Build priority queue for critical vs non-critical feeds
  - Add memory management with LRU eviction for feed items
  - Create feed aggregation and sorting strategies
  - Implement feed coordination to prevent simultaneous fetches
  - Add resource pooling for network connections
  - Support dynamic feed registration and removal
  - Create feed dependency management
  - Implement backpressure handling for slow consumers
- **Dependencies:** 4.1.1, 4.1.2, 4.1.3, 4.1.4
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/FeedManager.ts
  interface UnifiedFeedItem {
    id: string
    sourceType: 'product-hunt' | 'hacker-news' | 'jira' | 'rss'
    sourceId: string
    title: string
    description: string
    url: string
    author: {
      name: string
      avatar?: string
    }
    publishedAt: number
    updatedAt: number
    engagement: {
      views?: number
      votes?: number
      comments?: number
    }
    metadata: Record<string, any>
    contentHash: string
  }
  
  interface FeedConfig {
    id: string
    type: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    interval: number
    maxItems: number
    dependencies?: string[]
    filters?: FeedFilter[]
    transform?: (data: any) => UnifiedFeedItem[]
  }
  
  export class FeedManager {
    private feeds = new Map<string, FeedConfig>()
    private feedQueue = new PriorityQueue<FeedTask>()
    private activeFeeds = new Set<string>()
    private feedItems = new LRUCache<string, UnifiedFeedItem>(10000)
    private dedupeIndex = new Map<string, Set<string>>() // contentHash -> feedIds
    
    constructor(
      private storage: Storage,
      private cache: FeedCache,
      private monitor: FeedMonitor,
      private errorHandler: FeedErrorHandler
    ) {
      this.initialize()
    }
    
    async registerFeed(config: FeedConfig): Promise<void> {
      // Validate dependencies
      if (config.dependencies) {
        for (const dep of config.dependencies) {
          if (!this.feeds.has(dep)) {
            throw new Error(`Dependency ${dep} not found`)
          }
        }
      }
      
      this.feeds.set(config.id, config)
      
      // Schedule initial fetch based on priority
      const delay = this.calculateInitialDelay(config.priority)
      this.scheduleFetch(config.id, delay)
    }
    
    async fetchFeed(feedId: string): Promise<UnifiedFeedItem[]> {
      const config = this.feeds.get(feedId)
      if (!config) {
        throw new Error(`Feed ${feedId} not registered`)
      }
      
      // Check if feed is already being fetched
      if (this.activeFeeds.has(feedId)) {
        console.log(`Feed ${feedId} already being fetched, skipping`)
        return []
      }
      
      // Check dependencies
      if (config.dependencies) {
        const pendingDeps = config.dependencies.filter(dep => 
          !this.isFeedReady(dep)
        )
        if (pendingDeps.length > 0) {
          console.log(`Feed ${feedId} waiting for dependencies:`, pendingDeps)
          this.requeueFeed(feedId, 60000) // Retry in 1 minute
          return []
        }
      }
      
      this.activeFeeds.add(feedId)
      const startTime = performance.now()
      
      try {
        // Check cache with ETag
        const cached = await this.cache.get(feedId, {
          staleWhileRevalidate: true
        })
        
        if (cached.data && !cached.stale) {
          return cached.data as UnifiedFeedItem[]
        }
        
        // Fetch fresh data
        const fetcher = this.getFetcher(config.type)
        const rawData = await fetcher(feedId, {
          etag: cached.etag,
          maxItems: config.maxItems
        })
        
        // Transform to unified format
        const items = config.transform 
          ? config.transform(rawData)
          : this.defaultTransform(config.type, rawData)
        
        // Apply filters
        const filtered = this.applyFilters(items, config.filters)
        
        // Deduplicate
        const deduped = await this.deduplicateItems(filtered, feedId)
        
        // Store in cache
        await this.cache.set(feedId, deduped, {
          compress: true,
          ttl: config.interval * 60 * 1000,
          maxSize: 1024 * 1024,
          staleWhileRevalidate: true
        })
        
        // Update feed items in memory
        this.updateFeedItems(deduped, feedId)
        
        // Record metrics
        const duration = performance.now() - startTime
        await this.monitor.recordFetch(feedId, {
          success: true,
          data: deduped
        }, {
          networkTime: duration * 0.6,
          parseTime: duration * 0.3,
          cacheTime: duration * 0.1,
          totalTime: duration,
          memoryUsed: this.estimateMemoryUsage(deduped),
          itemsProcessed: deduped.length
        })
        
        return deduped
        
      } catch (error) {
        // Handle error
        const shouldRetry = await this.errorHandler.handleError(feedId, error)
        if (shouldRetry) {
          const retryDelay = this.calculateRetryDelay(config.priority)
          this.scheduleFetch(feedId, retryDelay)
        }
        
        throw error
        
      } finally {
        this.activeFeeds.delete(feedId)
      }
    }
    
    private async deduplicateItems(
      items: UnifiedFeedItem[],
      feedId: string
    ): Promise<UnifiedFeedItem[]> {
      const deduped: UnifiedFeedItem[] = []
      
      for (const item of items) {
        const hash = this.calculateContentHash(item)
        item.contentHash = hash
        
        // Check if we've seen this content before
        const existingFeeds = this.dedupeIndex.get(hash)
        if (existingFeeds && existingFeeds.size > 0) {
          // Content exists in other feeds
          console.log(`Duplicate content found in feeds:`, Array.from(existingFeeds))
          
          // Still add if it's from a higher priority feed
          const currentPriority = this.feeds.get(feedId)?.priority || 'low'
          const shouldKeep = this.shouldKeepDuplicate(currentPriority, existingFeeds)
          
          if (!shouldKeep) continue
        }
        
        // Add to dedupe index
        if (!existingFeeds) {
          this.dedupeIndex.set(hash, new Set([feedId]))
        } else {
          existingFeeds.add(feedId)
        }
        
        deduped.push(item)
      }
      
      return deduped
    }
    
    async getAggregatedFeed(options: {
      types?: string[]
      limit?: number
      since?: number
      sortBy?: 'date' | 'engagement' | 'relevance'
    } = {}): Promise<UnifiedFeedItem[]> {
      const { 
        types = Array.from(this.feeds.keys()),
        limit = 50,
        since = Date.now() - 24 * 60 * 60 * 1000,
        sortBy = 'date'
      } = options
      
      // Collect items from requested feed types
      const allItems: UnifiedFeedItem[] = []
      
      for (const feedId of types) {
        const items = this.getFeedItemsFromMemory(feedId)
          .filter(item => item.publishedAt > since)
        allItems.push(...items)
      }
      
      // Remove duplicates across feeds
      const uniqueItems = this.removeCrossFeedDuplicates(allItems)
      
      // Sort items
      const sorted = this.sortItems(uniqueItems, sortBy)
      
      // Apply limit
      return sorted.slice(0, limit)
    }
    
    private sortItems(
      items: UnifiedFeedItem[],
      sortBy: 'date' | 'engagement' | 'relevance'
    ): UnifiedFeedItem[] {
      switch (sortBy) {
        case 'date':
          return items.sort((a, b) => b.publishedAt - a.publishedAt)
          
        case 'engagement':
          return items.sort((a, b) => {
            const scoreA = (a.engagement.votes || 0) + 
                          (a.engagement.comments || 0) * 2
            const scoreB = (b.engagement.votes || 0) + 
                          (b.engagement.comments || 0) * 2
            return scoreB - scoreA
          })
          
        case 'relevance':
          // Implement relevance scoring based on user preferences
          return this.sortByRelevance(items)
          
        default:
          return items
      }
    }
    
    private scheduleFetch(feedId: string, delayMs: number): void {
      const config = this.feeds.get(feedId)
      if (!config) return
      
      const task: FeedTask = {
        feedId,
        priority: config.priority,
        scheduledTime: Date.now() + delayMs,
        execute: () => this.fetchFeed(feedId)
      }
      
      this.feedQueue.enqueue(task)
      
      // Process queue
      this.processQueue()
    }
    
    private async processQueue(): Promise<void> {
      if (this.isProcessingQueue) return
      this.isProcessingQueue = true
      
      while (!this.feedQueue.isEmpty()) {
        const task = this.feedQueue.peek()
        
        // Check if it's time to execute
        if (task.scheduledTime > Date.now()) {
          // Schedule next check
          setTimeout(() => this.processQueue(), task.scheduledTime - Date.now())
          break
        }
        
        // Check resource constraints
        if (this.activeFeeds.size >= this.maxConcurrentFeeds) {
          // Wait for a feed to complete
          setTimeout(() => this.processQueue(), 1000)
          break
        }
        
        // Execute task
        this.feedQueue.dequeue()
        task.execute().catch(error => {
          console.error(`Feed task failed for ${task.feedId}:`, error)
        })
      }
      
      this.isProcessingQueue = false
    }
    
    // Memory management
    private updateFeedItems(items: UnifiedFeedItem[], feedId: string): void {
      const feedKey = `feed:${feedId}`
      const existingIds = new Set(
        this.getFeedItemsFromMemory(feedId).map(item => item.id)
      )
      
      for (const item of items) {
        const itemKey = `${feedKey}:${item.id}`
        
        // Update LRU cache
        this.feedItems.set(itemKey, item)
        
        // Track new items
        if (!existingIds.has(item.id)) {
          this.emit('newItem', { feedId, item })
        }
      }
      
      // Clean up old items if memory pressure
      if (this.feedItems.size > this.feedItems.maxSize * 0.9) {
        this.performMemoryCleanup()
      }
    }
    
    private performMemoryCleanup(): void {
      // Remove least recently used items
      const itemsToRemove = Math.floor(this.feedItems.maxSize * 0.1)
      const removed = this.feedItems.prune(itemsToRemove)
      
      // Update dedupe index
      for (const item of removed) {
        const feeds = this.dedupeIndex.get(item.contentHash)
        if (feeds) {
          feeds.delete(item.sourceId)
          if (feeds.size === 0) {
            this.dedupeIndex.delete(item.contentHash)
          }
        }
      }
      
      console.log(`Memory cleanup: removed ${removed.length} items`)
    }
  }
  ```

#### Ticket 4.1.6: Network Resilience and Offline Support
- **Description:** Implement comprehensive network resilience with offline capabilities and graceful degradation
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Implement network connectivity detection and monitoring
  - Add circuit breaker pattern for failing endpoints
  - Create request queuing with offline persistence
  - Handle browser suspension and hibernation events
  - Implement progressive enhancement for slow connections
  - Add offline-first architecture with background sync
  - Create network quality detection and adaptation
  - Implement request prioritization during poor connectivity
  - Add automatic retry with intelligent backoff
  - Support partial content loading and progressive rendering
- **Dependencies:** 4.1.3, 4.1.5
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/NetworkResilience.ts
  interface NetworkState {
    online: boolean
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown'
    downlink: number // Mbps
    rtt: number // Round trip time in ms
    saveData: boolean
  }
  
  interface CircuitBreakerConfig {
    failureThreshold: number
    resetTimeout: number
    halfOpenRequests: number
  }
  
  export class NetworkResilience {
    private networkState: NetworkState
    private circuitBreakers = new Map<string, CircuitBreaker>()
    private offlineQueue = new PersistentQueue<QueuedRequest>('offline-requests')
    private activeRequests = new Map<string, AbortController>()
    
    constructor(
      private storage: Storage,
      private monitor: FeedMonitor
    ) {
      this.initializeNetworkMonitoring()
    }
    
    private initializeNetworkMonitoring(): void {
      // Monitor online/offline events
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      
      // Monitor connection changes
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection.addEventListener('change', () => this.updateNetworkState())
        this.updateNetworkState()
      }
      
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.handleResume()
        } else {
          this.handleSuspend()
        }
      })
      
      // Handle browser hibernation
      let lastActiveTime = Date.now()
      setInterval(() => {
        const now = Date.now()
        const timeDiff = now - lastActiveTime
        
        if (timeDiff > 10000) { // More than 10 seconds
          console.log('Detected browser hibernation, reinitializing...')
          this.handleHibernationRecovery(timeDiff)
        }
        
        lastActiveTime = now
      }, 5000)
    }
    
    async makeResilientRequest(
      url: string,
      options: RequestInit & { 
        priority?: 'high' | 'medium' | 'low'
        retryable?: boolean
        offlineCache?: boolean
      } = {}
    ): Promise<Response> {
      const { priority = 'medium', retryable = true, offlineCache = true } = options
      
      // Check network state
      if (!this.networkState.online && offlineCache) {
        return this.handleOfflineRequest(url, options)
      }
      
      // Check circuit breaker
      const domain = new URL(url).hostname
      const breaker = this.getOrCreateCircuitBreaker(domain)
      
      if (breaker.state === 'open') {
        throw new Error(`Circuit breaker open for ${domain}`)
      }
      
      // Adapt request based on network quality
      const adaptedOptions = this.adaptRequestToNetwork(options)
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeout = this.calculateTimeout()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      try {
        const requestId = this.generateRequestId()
        this.activeRequests.set(requestId, controller)
        
        const response = await fetch(url, {
          ...adaptedOptions,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        this.activeRequests.delete(requestId)
        
        // Record success
        breaker.recordSuccess()
        
        // Cache response if needed
        if (offlineCache && response.ok) {
          await this.cacheResponse(url, response.clone())
        }
        
        return response
        
      } catch (error) {
        clearTimeout(timeoutId)
        
        // Record failure
        breaker.recordFailure()
        
        // Handle different error types
        if (error.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        
        if (retryable && this.shouldRetry(error)) {
          return this.retryWithBackoff(url, options, error)
        }
        
        // Queue for offline if appropriate
        if (!this.networkState.online && retryable) {
          await this.queueOfflineRequest(url, options)
          throw new Error('Request queued for offline processing')
        }
        
        throw error
      }
    }
    
    private adaptRequestToNetwork(options: RequestInit): RequestInit {
      const adapted = { ...options }
      
      // Adjust based on connection type
      switch (this.networkState.effectiveType) {
        case 'slow-2g':
        case '2g':
          // Request minimal data
          adapted.headers = {
            ...adapted.headers,
            'Accept': 'application/json',
            'X-Requested-Quality': 'minimal'
          }
          break
          
        case '3g':
          // Request reduced data
          adapted.headers = {
            ...adapted.headers,
            'X-Requested-Quality': 'reduced'
          }
          break
          
        case '4g':
        default:
          // Full quality
          break
      }
      
      // Honor save data preference
      if (this.networkState.saveData) {
        adapted.headers = {
          ...adapted.headers,
          'Save-Data': 'on'
        }
      }
      
      return adapted
    }
    
    private async handleOfflineRequest(
      url: string,
      options: RequestInit
    ): Promise<Response> {
      // Try to serve from cache first
      const cached = await this.getCachedResponse(url)
      if (cached) {
        return new Response(cached.body, {
          status: 200,
          statusText: 'OK (from cache)',
          headers: {
            ...cached.headers,
            'X-From-Cache': 'true',
            'X-Cache-Age': String(Date.now() - cached.timestamp)
          }
        })
      }
      
      // Queue for later if not cached
      await this.queueOfflineRequest(url, options)
      
      return new Response(null, {
        status: 503,
        statusText: 'Offline - Request Queued'
      })
    }
    
    private async queueOfflineRequest(
      url: string,
      options: RequestInit
    ): Promise<void> {
      const request: QueuedRequest = {
        id: this.generateRequestId(),
        url,
        options,
        timestamp: Date.now(),
        retryCount: 0,
        priority: options.priority || 'medium'
      }
      
      await this.offlineQueue.enqueue(request)
      
      // Show notification to user
      this.notifyOfflineQueue(request)
    }
    
    private async processOfflineQueue(): Promise<void> {
      if (!this.networkState.online) return
      
      const requests = await this.offlineQueue.getAll()
      const prioritized = this.prioritizeRequests(requests)
      
      for (const request of prioritized) {
        try {
          const response = await fetch(request.url, request.options)
          
          if (response.ok) {
            await this.offlineQueue.remove(request.id)
            this.notifyRequestCompleted(request)
          } else {
            request.retryCount++
            if (request.retryCount >= 3) {
              await this.offlineQueue.remove(request.id)
              this.notifyRequestFailed(request)
            } else {
              await this.offlineQueue.update(request)
            }
          }
        } catch (error) {
          console.error('Failed to process offline request:', error)
        }
      }
    }
    
    private getOrCreateCircuitBreaker(domain: string): CircuitBreaker {
      if (!this.circuitBreakers.has(domain)) {
        const breaker = new CircuitBreaker({
          failureThreshold: 5,
          resetTimeout: 60000, // 1 minute
          halfOpenRequests: 3
        })
        
        this.circuitBreakers.set(domain, breaker)
      }
      
      return this.circuitBreakers.get(domain)!
    }
    
    private async retryWithBackoff(
      url: string,
      options: RequestInit,
      error: Error,
      attempt = 1
    ): Promise<Response> {
      const maxAttempts = 3
      const baseDelay = 1000
      
      if (attempt > maxAttempts) {
        throw error
      }
      
      // Calculate exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        10000
      )
      
      console.log(`Retrying request to ${url} in ${delay}ms (attempt ${attempt})`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      
      try {
        return await this.makeResilientRequest(url, {
          ...options,
          retryable: false // Prevent infinite recursion
        })
      } catch (retryError) {
        return this.retryWithBackoff(url, options, retryError, attempt + 1)
      }
    }
    
    private calculateTimeout(): number {
      // Adjust timeout based on network conditions
      const baseTimeout = 30000 // 30 seconds
      
      switch (this.networkState.effectiveType) {
        case 'slow-2g':
          return baseTimeout * 3
        case '2g':
          return baseTimeout * 2
        case '3g':
          return baseTimeout * 1.5
        default:
          return baseTimeout
      }
    }
    
    private handleOnline(): void {
      console.log('Network: Online')
      this.networkState.online = true
      
      // Process offline queue
      this.processOfflineQueue()
      
      // Reset circuit breakers gradually
      this.circuitBreakers.forEach(breaker => {
        breaker.halfOpen()
      })
      
      // Notify components
      this.emit('network-state-change', { online: true })
    }
    
    private handleOffline(): void {
      console.log('Network: Offline')
      this.networkState.online = false
      
      // Cancel active requests
      this.activeRequests.forEach(controller => {
        controller.abort()
      })
      this.activeRequests.clear()
      
      // Notify components
      this.emit('network-state-change', { online: false })
    }
    
    private handleHibernationRecovery(suspendDuration: number): void {
      console.log(`Recovering from ${suspendDuration}ms hibernation`)
      
      // Reset circuit breakers
      this.circuitBreakers.forEach(breaker => {
        breaker.reset()
      })
      
      // Update network state
      this.updateNetworkState()
      
      // Emit recovery event
      this.emit('hibernation-recovery', { duration: suspendDuration })
    }
    
    async getNetworkQuality(): Promise<{
      quality: 'excellent' | 'good' | 'fair' | 'poor'
      recommendation: string
    }> {
      if (!this.networkState.online) {
        return {
          quality: 'poor',
          recommendation: 'Currently offline. Cached content only.'
        }
      }
      
      const { effectiveType, downlink, rtt } = this.networkState
      
      if (effectiveType === '4g' && downlink > 5 && rtt < 100) {
        return {
          quality: 'excellent',
          recommendation: 'Full quality content available'
        }
      }
      
      if (effectiveType === '3g' || (downlink > 1 && rtt < 300)) {
        return {
          quality: 'good',
          recommendation: 'Standard quality recommended'
        }
      }
      
      if (effectiveType === '2g' || downlink < 1) {
        return {
          quality: 'fair',
          recommendation: 'Reduced quality for faster loading'
        }
      }
      
      return {
        quality: 'poor',
        recommendation: 'Minimal data mode active'
      }
    }
  }
  
  class CircuitBreaker {
    state: 'closed' | 'open' | 'half-open' = 'closed'
    private failures = 0
    private lastFailureTime = 0
    private successesInHalfOpen = 0
    
    constructor(private config: CircuitBreakerConfig) {}
    
    recordSuccess(): void {
      if (this.state === 'half-open') {
        this.successesInHalfOpen++
        if (this.successesInHalfOpen >= this.config.halfOpenRequests) {
          this.close()
        }
      }
      this.failures = 0
    }
    
    recordFailure(): void {
      this.failures++
      this.lastFailureTime = Date.now()
      
      if (this.failures >= this.config.failureThreshold) {
        this.open()
      }
    }
    
    private open(): void {
      this.state = 'open'
      setTimeout(() => this.halfOpen(), this.config.resetTimeout)
    }
    
    halfOpen(): void {
      this.state = 'half-open'
      this.successesInHalfOpen = 0
    }
    
    private close(): void {
      this.state = 'closed'
      this.failures = 0
    }
    
    reset(): void {
      this.close()
    }
  }
  ```

#### Ticket 4.1.7: Security & Privacy Layer
- **Description:** Implement comprehensive security measures for feed fetching with privacy-preserving features
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Implement CORS proxy for feeds that don't support cross-origin requests
  - Add advanced content sanitization (XSS prevention)
  - Create rate limiting per domain to avoid being blocked
  - Implement user agent rotation and request header randomization
  - Add privacy-preserving analytics (no PII logging)
  - Support authenticated feeds with secure credential storage
  - Implement content validation and malicious payload detection
  - Add request signing for API authentication
  - Create audit logging for security events
  - Implement feed source verification
- **Dependencies:** 4.1.5, 4.1.6
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/SecurityLayer.ts
  import DOMPurify from 'isomorphic-dompurify'
  import { createHash, randomBytes } from 'crypto'
  
  interface SecurityConfig {
    corsProxy?: string
    rateLimits: Map<string, RateLimit>
    userAgents: string[]
    allowedDomains?: string[]
    blockedDomains?: string[]
    contentSecurityPolicy: ContentSecurityPolicy
  }
  
  interface RateLimit {
    requests: number
    window: number // milliseconds
    burst?: number
  }
  
  export class SecurityLayer {
    private requestCounts = new Map<string, RequestTracker>()
    private corsProxyUrl: string
    private auditLog: AuditLogger
    
    constructor(
      private config: SecurityConfig,
      private storage: Storage,
      private monitor: FeedMonitor
    ) {
      this.corsProxyUrl = config.corsProxy || this.setupInternalProxy()
      this.auditLog = new AuditLogger(storage)
    }
    
    async secureRequest(
      url: string,
      options: RequestInit = {},
      feedConfig?: {
        requiresAuth?: boolean
        credentials?: string
        validateContent?: boolean
      }
    ): Promise<Response> {
      // Validate URL and domain
      const validatedUrl = await this.validateAndSanitizeUrl(url)
      
      // Check rate limits
      await this.checkRateLimit(validatedUrl)
      
      // Prepare secure headers
      const secureOptions = await this.prepareSecureRequest(options, feedConfig)
      
      // Determine if CORS proxy is needed
      const finalUrl = this.needsCorsProxy(validatedUrl) 
        ? this.buildProxyUrl(validatedUrl)
        : validatedUrl
      
      try {
        // Make request
        const response = await fetch(finalUrl, secureOptions)
        
        // Validate response
        await this.validateResponse(response, feedConfig?.validateContent)
        
        // Log successful request
        await this.auditLog.logRequest({
          url: validatedUrl,
          status: response.status,
          timestamp: Date.now(),
          success: true
        })
        
        return response
        
      } catch (error) {
        // Log failed request
        await this.auditLog.logRequest({
          url: validatedUrl,
          error: error.message,
          timestamp: Date.now(),
          success: false
        })
        
        throw error
      }
    }
    
    async sanitizeContent(
      content: string,
      type: 'html' | 'json' | 'xml'
    ): Promise<string> {
      switch (type) {
        case 'html':
          return this.sanitizeHtml(content)
          
        case 'json':
          return this.sanitizeJson(content)
          
        case 'xml':
          return this.sanitizeXml(content)
          
        default:
          throw new Error(`Unsupported content type: ${type}`)
      }
    }
    
    private sanitizeHtml(html: string): string {
      // Configure DOMPurify for maximum safety
      const config = {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'a', 'img', 
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SAFE_FOR_TEMPLATES: true,
        WHOLE_DOCUMENT: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        FORCE_BODY: true,
        SANITIZE_DOM: true,
        KEEP_CONTENT: true,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
      }
      
      // Additional custom sanitization
      let sanitized = DOMPurify.sanitize(html, config)
      
      // Remove any remaining suspicious patterns
      sanitized = this.removeSupiciousPatterns(sanitized)
      
      return sanitized
    }
    
    private sanitizeJson(jsonStr: string): string {
      try {
        const parsed = JSON.parse(jsonStr)
        
        // Recursively sanitize all string values
        const sanitized = this.sanitizeJsonObject(parsed)
        
        return JSON.stringify(sanitized)
      } catch (error) {
        throw new Error('Invalid JSON content')
      }
    }
    
    private sanitizeJsonObject(obj: any): any {
      if (typeof obj === 'string') {
        // Remove potential XSS vectors from strings
        return this.sanitizeString(obj)
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => this.sanitizeJsonObject(item))
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {}
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize keys as well
          const safeKey = this.sanitizeString(key)
          sanitized[safeKey] = this.sanitizeJsonObject(value)
        }
        return sanitized
      }
      
      return obj
    }
    
    private async validateAndSanitizeUrl(url: string): Promise<string> {
      try {
        const parsed = new URL(url)
        
        // Check protocol
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Invalid protocol')
        }
        
        // Check against allowed/blocked domains
        if (this.config.blockedDomains?.includes(parsed.hostname)) {
          throw new Error('Domain is blocked')
        }
        
        if (this.config.allowedDomains && 
            !this.config.allowedDomains.includes(parsed.hostname)) {
          throw new Error('Domain not in allowlist')
        }
        
        // Remove suspicious query parameters
        const suspiciousParams = ['callback', 'jsonp', '_', 'eval']
        suspiciousParams.forEach(param => {
          parsed.searchParams.delete(param)
        })
        
        return parsed.toString()
        
      } catch (error) {
        throw new Error(`Invalid URL: ${error.message}`)
      }
    }
    
    private async checkRateLimit(url: string): Promise<void> {
      const domain = new URL(url).hostname
      const limit = this.config.rateLimits.get(domain) || {
        requests: 60,
        window: 60000 // 1 minute
      }
      
      const tracker = this.getOrCreateTracker(domain)
      const now = Date.now()
      
      // Clean old entries
      tracker.requests = tracker.requests.filter(
        time => now - time < limit.window
      )
      
      // Check if limit exceeded
      if (tracker.requests.length >= limit.requests) {
        const oldestRequest = Math.min(...tracker.requests)
        const waitTime = limit.window - (now - oldestRequest)
        
        throw new Error(
          `Rate limit exceeded for ${domain}. Retry in ${Math.ceil(waitTime / 1000)}s`
        )
      }
      
      // Add current request
      tracker.requests.push(now)
    }
    
    private async prepareSecureRequest(
      options: RequestInit,
      feedConfig?: any
    ): Promise<RequestInit> {
      const secureOptions = { ...options }
      
      // Rotate user agent
      const userAgent = this.selectUserAgent()
      
      // Build secure headers
      secureOptions.headers = {
        ...secureOptions.headers,
        'User-Agent': userAgent,
        'Accept': 'application/json, application/xml, text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      }
      
      // Add authentication if needed
      if (feedConfig?.requiresAuth && feedConfig?.credentials) {
        const authHeader = await this.getAuthHeader(feedConfig.credentials)
        secureOptions.headers['Authorization'] = authHeader
      }
      
      // Add request signing if configured
      if (feedConfig?.signRequests) {
        const signature = await this.signRequest(options)
        secureOptions.headers['X-Request-Signature'] = signature
      }
      
      // Randomize header order (implementation specific)
      secureOptions.headers = this.randomizeHeaderOrder(secureOptions.headers)
      
      return secureOptions
    }
    
    private selectUserAgent(): string {
      // Weighted selection based on real browser usage
      const weights = [40, 30, 20, 10] // Chrome, Firefox, Safari, Edge
      const random = Math.random() * 100
      let cumulative = 0
      
      for (let i = 0; i < this.config.userAgents.length; i++) {
        cumulative += weights[i] || 10
        if (random <= cumulative) {
          return this.config.userAgents[i]
        }
      }
      
      return this.config.userAgents[0]
    }
    
    private needsCorsProxy(url: string): boolean {
      // Check if URL requires CORS proxy
      const domain = new URL(url).hostname
      
      // Known domains that don't support CORS
      const noCorsSupport = [
        'example-feed.com',
        'legacy-rss.org'
      ]
      
      return noCorsSupport.some(d => domain.includes(d))
    }
    
    private buildProxyUrl(targetUrl: string): string {
      const encoded = encodeURIComponent(targetUrl)
      return `${this.corsProxyUrl}?url=${encoded}`
    }
    
    async storeCredentials(
      feedId: string,
      credentials: {
        type: 'apiKey' | 'oauth' | 'basic'
        data: any
      }
    ): Promise<void> {
      // Encrypt credentials before storage
      const encrypted = await this.encryptData(credentials)
      
      await this.storage.set(`feed-credentials:${feedId}`, {
        encrypted,
        timestamp: Date.now(),
        type: credentials.type
      })
      
      // Audit log
      await this.auditLog.logSecurityEvent({
        type: 'credentials_stored',
        feedId,
        timestamp: Date.now()
      })
    }
    
    private async encryptData(data: any): Promise<string> {
      // Use Web Crypto API for encryption
      const key = await this.getDerivedKey()
      const iv = randomBytes(16)
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        new TextEncoder().encode(JSON.stringify(data))
      )
      
      return btoa(
        String.fromCharCode(...new Uint8Array(iv)) +
        String.fromCharCode(...new Uint8Array(encrypted))
      )
    }
    
    private async validateResponse(
      response: Response,
      validateContent?: boolean
    ): Promise<void> {
      // Check response headers for security issues
      const contentType = response.headers.get('content-type') || ''
      
      // Validate content type
      const validTypes = [
        'application/json',
        'application/xml',
        'text/xml',
        'application/rss+xml',
        'application/atom+xml',
        'text/html'
      ]
      
      if (!validTypes.some(type => contentType.includes(type))) {
        throw new Error(`Unexpected content type: ${contentType}`)
      }
      
      // Check for suspicious headers
      const suspiciousHeaders = [
        'x-xss-protection',
        'x-content-type-options',
        'x-frame-options'
      ]
      
      for (const header of suspiciousHeaders) {
        if (!response.headers.has(header)) {
          console.warn(`Missing security header: ${header}`)
        }
      }
      
      // Validate content if requested
      if (validateContent && response.ok) {
        const text = await response.text()
        await this.validateContentSafety(text, contentType)
        
        // Return new response with validated content
        return new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
      }
    }
    
    private async validateContentSafety(
      content: string,
      contentType: string
    ): Promise<void> {
      // Check for malicious patterns
      const maliciousPatterns = [
        /<script[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
      ]
      
      for (const pattern of maliciousPatterns) {
        if (pattern.test(content)) {
          throw new Error('Potentially malicious content detected')
        }
      }
      
      // Additional validation based on content type
      if (contentType.includes('json')) {
        try {
          JSON.parse(content)
        } catch {
          throw new Error('Invalid JSON content')
        }
      }
    }
    
    getSecurityMetrics(): SecurityMetrics {
      const requests = Array.from(this.requestCounts.entries())
      
      return {
        totalRequests: requests.reduce((sum, [_, t]) => sum + t.requests.length, 0),
        blockedRequests: this.auditLog.getBlockedCount(),
        rateLimitHits: this.auditLog.getRateLimitHits(),
        maliciousContentDetected: this.auditLog.getMaliciousCount(),
        averageRequestsPerDomain: this.calculateAverageRequests(requests),
        securityScore: this.calculateSecurityScore()
      }
    }
  }
  
  class AuditLogger {
    private readonly MAX_LOGS = 10000
    
    constructor(private storage: Storage) {}
    
    async logRequest(entry: AuditEntry): Promise<void> {
      const logs = await this.getLogs()
      logs.push(entry)
      
      // Maintain size limit
      if (logs.length > this.MAX_LOGS) {
        logs.splice(0, logs.length - this.MAX_LOGS)
      }
      
      await this.storage.set('security-audit-log', logs)
    }
    
    async logSecurityEvent(event: SecurityEvent): Promise<void> {
      const events = await this.getSecurityEvents()
      events.push({
        ...event,
        id: this.generateEventId(),
        timestamp: Date.now()
      })
      
      await this.storage.set('security-events', events)
    }
    
    private generateEventId(): string {
      return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }
  ```

#### Ticket 4.1.8: Performance Optimization with WebWorkers
- **Description:** Implement WebWorkers for CPU-intensive feed processing to maintain UI responsiveness
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create WebWorker pool for parallel feed processing
  - Implement feed parsing in WebWorkers
  - Add request batching and deduplication
  - Create lazy loading for feed content
  - Implement virtual scrolling for large feed lists
  - Add preloading for anticipated user actions
  - Optimize memory usage with weak references
  - Implement progressive rendering strategies
  - Add performance budgets and monitoring
  - Create request prioritization based on viewport
- **Dependencies:** 4.1.5
- **Implementation Notes:**
  ```typescript
  // src/lib/feeds/workers/FeedProcessor.worker.ts
  import { expose } from 'comlink'
  
  interface ProcessorConfig {
    maxBatchSize: number
    processingTimeout: number
    memoryLimit: number
  }
  
  class FeedProcessor {
    private config: ProcessorConfig
    private abortController: AbortController | null = null
    
    constructor() {
      this.config = {
        maxBatchSize: 50,
        processingTimeout: 5000,
        memoryLimit: 50 * 1024 * 1024 // 50MB
      }
    }
    
    async processFeedBatch(
      feeds: RawFeedData[],
      options: ProcessingOptions
    ): Promise<ProcessedFeedResult[]> {
      this.abortController = new AbortController()
      const signal = this.abortController.signal
      
      try {
        // Process feeds in parallel with batching
        const batches = this.createBatches(feeds, this.config.maxBatchSize)
        const results: ProcessedFeedResult[] = []
        
        for (const batch of batches) {
          if (signal.aborted) break
          
          const batchResults = await Promise.all(
            batch.map(feed => this.processSingleFeed(feed, options))
          )
          
          results.push(...batchResults)
          
          // Check memory usage
          if (this.getMemoryUsage() > this.config.memoryLimit) {
            await this.performMemoryCleanup()
          }
        }
        
        return results
        
      } finally {
        this.abortController = null
      }
    }
    
    private async processSingleFeed(
      feed: RawFeedData,
      options: ProcessingOptions
    ): Promise<ProcessedFeedResult> {
      const startTime = performance.now()
      
      try {
        // Parse feed based on type
        const parsed = await this.parseFeed(feed)
        
        // Extract and optimize content
        const optimized = await this.optimizeContent(parsed, options)
        
        // Generate metadata
        const metadata = this.generateMetadata(optimized)
        
        return {
          feedId: feed.id,
          items: optimized,
          metadata,
          processingTime: performance.now() - startTime,
          memoryUsed: this.estimateMemoryUsage(optimized)
        }
        
      } catch (error) {
        return {
          feedId: feed.id,
          error: error.message,
          processingTime: performance.now() - startTime
        }
      }
    }
    
    private async parseFeed(feed: RawFeedData): Promise<ParsedFeed> {
      // Heavy parsing logic moved to worker
      switch (feed.type) {
        case 'rss':
          return this.parseRSS(feed.content)
        case 'atom':
          return this.parseAtom(feed.content)
        case 'json':
          return this.parseJSON(feed.content)
        default:
          throw new Error(`Unsupported feed type: ${feed.type}`)
      }
    }
    
    private async optimizeContent(
      parsed: ParsedFeed,
      options: ProcessingOptions
    ): Promise<OptimizedFeedItem[]> {
      return parsed.items.map(item => ({
        ...item,
        // Extract text summary
        summary: this.extractSummary(item.content, options.summaryLength),
        
        // Extract main image
        thumbnail: this.extractThumbnail(item.content),
        
        // Clean and minify HTML
        content: options.includeFullContent 
          ? this.minifyHTML(item.content)
          : undefined,
        
        // Calculate reading time
        readingTime: this.calculateReadingTime(item.content),
        
        // Extract keywords
        keywords: this.extractKeywords(item.content)
      }))
    }
    
    abort(): void {
      if (this.abortController) {
        this.abortController.abort()
      }
    }
    
    private createBatches<T>(items: T[], batchSize: number): T[][] {
      const batches: T[][] = []
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize))
      }
      return batches
    }
    
    private getMemoryUsage(): number {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    }
    
    private async performMemoryCleanup(): Promise<void> {
      // Force garbage collection if available
      if ('gc' in globalThis) {
        (globalThis as any).gc()
      }
      
      // Clear any caches
      this.clearCaches()
      
      // Small delay to allow cleanup
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
  
  // Expose worker API
  expose(new FeedProcessor())
  
  // src/lib/feeds/WorkerPool.ts
  import { wrap, releaseProxy } from 'comlink'
  
  interface PooledWorker {
    worker: Worker
    proxy: any
    busy: boolean
    lastUsed: number
  }
  
  export class WorkerPool {
    private workers: PooledWorker[] = []
    private queue: Array<{
      task: any
      resolve: Function
      reject: Function
    }> = []
    
    constructor(
      private workerPath: string,
      private minWorkers = 2,
      private maxWorkers = navigator.hardwareConcurrency || 4
    ) {
      this.initializePool()
    }
    
    private initializePool(): void {
      // Create minimum number of workers
      for (let i = 0; i < this.minWorkers; i++) {
        this.createWorker()
      }
      
      // Monitor and scale based on queue size
      setInterval(() => this.scalePool(), 1000)
    }
    
    private createWorker(): PooledWorker {
      const worker = new Worker(this.workerPath, { type: 'module' })
      const proxy = wrap(worker)
      
      const pooledWorker: PooledWorker = {
        worker,
        proxy,
        busy: false,
        lastUsed: Date.now()
      }
      
      this.workers.push(pooledWorker)
      return pooledWorker
    }
    
    async execute<T>(
      method: string,
      ...args: any[]
    ): Promise<T> {
      return new Promise((resolve, reject) => {
        const task = { method, args, resolve, reject }
        this.queue.push(task)
        this.processQueue()
      })
    }
    
    private async processQueue(): Promise<void> {
      if (this.queue.length === 0) return
      
      // Find available worker
      let worker = this.workers.find(w => !w.busy)
      
      // Create new worker if needed and under limit
      if (!worker && this.workers.length < this.maxWorkers) {
        worker = this.createWorker()
      }
      
      if (!worker) return // All workers busy
      
      // Get next task
      const task = this.queue.shift()
      if (!task) return
      
      // Mark worker as busy
      worker.busy = true
      worker.lastUsed = Date.now()
      
      try {
        // Execute task
        const result = await worker.proxy[task.method](...task.args)
        task.resolve(result)
      } catch (error) {
        task.reject(error)
      } finally {
        worker.busy = false
        
        // Process next task
        this.processQueue()
      }
    }
    
    private scalePool(): void {
      const now = Date.now()
      const idleTimeout = 30000 // 30 seconds
      
      // Scale up if queue is growing
      if (this.queue.length > 5 && this.workers.length < this.maxWorkers) {
        this.createWorker()
      }
      
      // Scale down idle workers
      const idleWorkers = this.workers.filter(
        w => !w.busy && now - w.lastUsed > idleTimeout
      )
      
      if (idleWorkers.length > this.minWorkers) {
        const toRemove = idleWorkers[0]
        const index = this.workers.indexOf(toRemove)
        
        if (index > -1) {
          this.workers.splice(index, 1)
          releaseProxy(toRemove.proxy)
          toRemove.worker.terminate()
        }
      }
    }
    
    async terminate(): Promise<void> {
      // Clear queue
      this.queue.forEach(task => {
        task.reject(new Error('Worker pool terminated'))
      })
      this.queue = []
      
      // Terminate all workers
      await Promise.all(
        this.workers.map(async w => {
          releaseProxy(w.proxy)
          w.worker.terminate()
        })
      )
      
      this.workers = []
    }
  }
  
  // src/lib/feeds/PerformanceOptimizer.ts
  export class PerformanceOptimizer {
    private workerPool: WorkerPool
    private renderQueue = new RenderQueue()
    private intersectionObserver: IntersectionObserver
    private weakCache = new WeakMap<object, any>()
    
    constructor() {
      this.workerPool = new WorkerPool('/workers/FeedProcessor.worker.js')
      this.initializeObservers()
    }
    
    private initializeObservers(): void {
      // Intersection observer for lazy loading
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadFeedItem(entry.target)
            }
          })
        },
        {
          rootMargin: '100px' // Preload 100px before visible
        }
      )
    }
    
    async processFeedsWithWorkers(
      feeds: RawFeedData[]
    ): Promise<ProcessedFeedResult[]> {
      // Deduplicate requests
      const uniqueFeeds = this.deduplicateFeeds(feeds)
      
      // Process in worker pool
      const results = await this.workerPool.execute(
        'processFeedBatch',
        uniqueFeeds,
        {
          summaryLength: 200,
          includeFullContent: false
        }
      )
      
      // Cache results with weak references
      results.forEach(result => {
        this.weakCache.set({ feedId: result.feedId }, result)
      })
      
      return results
    }
    
    private deduplicateFeeds(feeds: RawFeedData[]): RawFeedData[] {
      const seen = new Set<string>()
      return feeds.filter(feed => {
        const key = `${feed.id}:${feed.lastModified}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
    
    observeFeedItem(element: HTMLElement): void {
      this.intersectionObserver.observe(element)
    }
    
    private async loadFeedItem(element: Element): Promise<void> {
      const feedId = element.getAttribute('data-feed-id')
      const itemId = element.getAttribute('data-item-id')
      
      if (!feedId || !itemId) return
      
      // Check if already loaded
      if (element.hasAttribute('data-loaded')) return
      
      // Load content
      const content = await this.fetchItemContent(feedId, itemId)
      
      // Render with progressive enhancement
      this.renderQueue.enqueue(() => {
        this.renderContent(element, content)
        element.setAttribute('data-loaded', 'true')
      })
    }
    
    setupVirtualScrolling(
      container: HTMLElement,
      items: FeedItem[],
      itemHeight = 100
    ): VirtualScroller {
      return new VirtualScroller({
        container,
        items,
        itemHeight,
        renderItem: (item, element) => {
          element.setAttribute('data-feed-id', item.feedId)
          element.setAttribute('data-item-id', item.id)
          this.observeFeedItem(element)
        },
        buffer: 5 // Render 5 items outside viewport
      })
    }
    
    async preloadUserActions(
      currentFeed: string,
      userHistory: UserAction[]
    ): Promise<void> {
      // Analyze user patterns
      const predictions = this.predictNextActions(userHistory)
      
      // Preload likely feeds
      for (const prediction of predictions) {
        if (prediction.probability > 0.7) {
          this.preloadFeed(prediction.feedId)
        }
      }
    }
    
    private async preloadFeed(feedId: string): Promise<void> {
      // Check if already cached
      if (this.weakCache.has({ feedId })) return
      
      // Fetch in background with low priority
      requestIdleCallback(async () => {
        const feed = await this.fetchFeedData(feedId)
        const processed = await this.workerPool.execute(
          'processSingleFeed',
          feed,
          { summaryLength: 200 }
        )
        
        this.weakCache.set({ feedId }, processed)
      })
    }
    
    getPerformanceMetrics(): PerformanceMetrics {
      return {
        workerPoolSize: this.workerPool.size,
        renderQueueLength: this.renderQueue.length,
        cacheHitRate: this.calculateCacheHitRate(),
        avgProcessingTime: this.calculateAvgProcessingTime(),
        memoryUsage: performance.memory?.usedJSHeapSize || 0,
        recommendations: this.generateOptimizationRecommendations()
      }
    }
  }
  
  class RenderQueue {
    private queue: Function[] = []
    private isProcessing = false
    
    enqueue(task: Function): void {
      this.queue.push(task)
      if (!this.isProcessing) {
        this.process()
      }
    }
    
    private process(): void {
      if (this.queue.length === 0) {
        this.isProcessing = false
        return
      }
      
      this.isProcessing = true
      
      requestAnimationFrame(() => {
        const startTime = performance.now()
        const timeLimit = 16 // One frame (60fps)
        
        while (this.queue.length > 0 && 
               performance.now() - startTime < timeLimit) {
          const task = this.queue.shift()!
          task()
        }
        
        this.process()
      })
    }
    
    get length(): number {
      return this.queue.length
    }
  }
  ```

### Story 4.1 Summary
**Total Story Points:** 16 SP (increased from 7 SP)  
**Total Tickets:** 8 (increased from 4)  
**Key Enhancements:**
- Advanced caching with compression and ETags
- Comprehensive monitoring with quality metrics
- Central FeedManager orchestration
- Network resilience and offline support
- Security layer with CORS proxy
- Performance optimization with WebWorkers

---

## Story 4.2: Product Hunt Feed
**Description:** Implement a comprehensive Product Hunt integration with real-time updates, advanced filtering, offline support, and analytics to help PMs track product launches and market trends effectively.

**Acceptance Criteria:**
- Fetch products from Product Hunt GraphQL API with multiple collection support
- Display responsive product cards with interactive features
- Support advanced filtering by category, date, product type, and custom searches
- Implement real-time updates via webhooks for new product launches
- Enable offline functionality with background sync
- Add interactive upvoting and bookmarking capabilities
- Include analytics tracking for user engagement insights
- Ensure accessibility compliance (WCAG 2.1 AA)
- Achieve performance target of < 200ms initial load time
- Support pagination and infinite scroll for large datasets

**Story Points:** 14 SP (was 6 SP)
**Total Tickets:** 8 (was 5)

### Tickets:

#### Ticket 4.2.1: Create ProductHuntFeed Widget Component
- **Description:** Build the main Product Hunt feed widget with modern design, real-time updates, and accessibility features
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create responsive grid layout with CSS Grid for product cards
  - Implement skeleton loading states with shimmer effect
  - Add empty state with actionable suggestions
  - Support compact, expanded, and list view modes
  - Implement error boundary specific to Product Hunt widget
  - Add pagination with infinite scroll support
  - Enable real-time updates via WebSocket connection
  - Implement keyboard navigation (arrow keys, tab) for accessibility
  - Add widget performance monitoring with Web Vitals
  - Support widget resizing and drag-to-reorder
  - Include pull-to-refresh functionality
  - Add view mode persistence in user preferences
- **Dependencies:** Epic 2 completion, 4.1.5
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
- **Description:** Create robust background script handler for Product Hunt GraphQL API with real-time updates and advanced querying
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Implement OAuth2 authentication flow with token refresh
  - Support multiple API keys for load balancing
  - Query posts with all available fields including media galleries
  - Handle cursor-based pagination for large datasets
  - Transform API response to unified data model
  - Respect API rate limits with exponential backoff
  - Implement GraphQL-specific error handling and retry logic
  - Add webhook support for real-time product launches
  - Cache GraphQL queries at the query level
  - Support fetching multiple collections:
    - Today's Products
    - This Week's Products
    - This Month's Products
    - Trending Products
    - Product Collections by Topic
  - Handle API deprecation notices gracefully
  - Implement request batching for efficiency
  - Add support for Product Hunt Ship (upcoming products)
  - Include API health monitoring and alerting
- **Dependencies:** 4.1.1, 4.1.3, 4.1.6
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
- **Description:** Create comprehensive utilities to parse, validate, and normalize Product Hunt data with type safety
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Implement Zod schemas for type-safe API response validation
  - Handle missing or null fields with sensible defaults
  - Format dates with timezone awareness and relative time
  - Extract and normalize topic tags with category mapping
  - Sanitize HTML/Markdown in descriptions with DOMPurify
  - Parse special Product Hunt entities:
    - "Coming Soon" products with launch dates
    - Golden Kitty Award winners and nominees
    - Product badges (Product of the Day/Week/Month)
    - Maker achievements and badges
  - Extract full media galleries, not just thumbnails
  - Parse pricing information and business models
  - Distinguish between launch date and featured date
  - Handle product variants (iOS, Android, Web, etc.)
  - Extract social links and company information
  - Parse user roles (hunter vs maker vs contributor)
  - Normalize vote counts with abbreviations (1.2k, 10k+)
  - Implement data quality scoring for products
- **Dependencies:** 4.2.2, 4.1.7
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
- **Description:** Build interactive product card components with rich features and smooth animations
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Design responsive cards with multiple layout modes
  - Add smooth hover animations and micro-interactions
  - Implement interactive upvote with optimistic updates
  - Display real-time vote count changes with animations
  - Show maker avatars in overlapping stack with tooltips
  - Create quick preview modal/popover for product details
  - Add social sharing buttons (Twitter, LinkedIn, etc.)
  - Implement save/bookmark functionality with sync
  - Progressive image loading with blur-up effect
  - Support responsive images based on device pixel ratio
  - Full dark mode support with theme transitions
  - Add product badges and awards display
  - Show "New" indicator for recently launched products
  - Display comment count with preview on hover
  - Implement swipe gestures for mobile devices
  - Add loading skeleton specific to card layout
  - Include accessibility labels and ARIA attributes
  - Support keyboard interactions (Enter to open, Space to upvote)
- **Dependencies:** 4.2.1, 4.2.3
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

#### Ticket 4.2.5: Add Advanced Filtering and Sorting
- **Description:** Implement comprehensive filter bar with multiple criteria and intelligent sorting options
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Filter by multiple criteria simultaneously:
    - Product categories/topics (with multi-select)
    - Date ranges (today, this week, this month, custom)
    - Product types (Mobile App, Web App, Hardware, Books, Podcasts, Newsletter)
    - Platform (iOS, Android, Web, Mac, Windows, Chrome Extension)
    - Price (Free, Freemium, Paid, Enterprise)
    - Maker status (Verified, Top Hunter, First-time Maker)
  - Advanced sorting options:
    - Most Upvoted (with time decay algorithm)
    - Newest First
    - Trending (velocity-based algorithm)
    - Most Discussed (by comment count)
    - Maker Reputation Score
    - Relevance (based on user preferences)
  - Search within products with fuzzy matching
  - Show active filter count with badges
  - One-click clear all filters
  - Save filter presets (e.g., "AI Products", "Developer Tools")
  - Filter suggestions based on current view
  - Persist filter preferences per user
  - Export filtered results to CSV/JSON
  - Smart filters based on user interaction history
  - Real-time filter updates without page reload
- **Dependencies:** 4.2.4
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/productHunt/FilterBar.tsx
  import { useState, useMemo } from 'react'
  import { useStorage } from '@plasmohq/storage/hook'
  import { Calendar, Search, Filter, Download } from 'lucide-react'
  
  interface FilterState {
    categories: string[]
    dateRange: 'today' | 'week' | 'month' | 'all' | 'custom'
    productTypes: ProductType[]
    platforms: Platform[]
    priceModel: PriceModel[]
    sortBy: SortOption
    searchQuery: string
  }
  
  interface FilterBarProps {
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
    availableCategories: string[]
    onExport: (format: 'csv' | 'json') => void
  }
  
  export function FilterBar({ 
    filters, 
    onFiltersChange,
    availableCategories,
    onExport
  }: FilterBarProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [savedPresets] = useStorage<FilterPreset[]>('ph-filter-presets', [])
    const [searchQuery, setSearchQuery] = useState(filters.searchQuery)
    
    const activeFilterCount = useMemo(() => {
      let count = 0
      if (filters.categories.length > 0) count += filters.categories.length
      if (filters.dateRange !== 'all') count++
      if (filters.productTypes.length > 0) count += filters.productTypes.length
      if (filters.platforms.length > 0) count += filters.platforms.length
      if (filters.priceModel.length > 0) count += filters.priceModel.length
      if (filters.searchQuery) count++
      return count
    }, [filters])
    
    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onFiltersChange({ ...filters, searchQuery })
    }
    
    const clearAllFilters = () => {
      onFiltersChange({
        categories: [],
        dateRange: 'all',
        productTypes: [],
        platforms: [],
        priceModel: [],
        sortBy: 'trending',
        searchQuery: ''
      })
      setSearchQuery('')
    }
    
    return (
      <div className="space-y-3">
        {/* Search and Quick Actions */}
        <div className="flex gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              />
            </div>
          </form>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-colors",
              showAdvanced 
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <div className="flex gap-2">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, sortBy: option.value })}
                className={cn(
                  "px-3 py-1 rounded-full text-sm transition-colors",
                  filters.sortBy === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Date Range
              </label>
              <DateRangePicker 
                value={filters.dateRange}
                onChange={(dateRange) => onFiltersChange({ ...filters, dateRange })}
              />
            </div>
            
            {/* Categories */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Categories
              </label>
              <MultiSelect
                options={availableCategories}
                selected={filters.categories}
                onChange={(categories) => onFiltersChange({ ...filters, categories })}
              />
            </div>
            
            {/* Product Types */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Product Types
              </label>
              <div className="flex flex-wrap gap-2">
                {productTypes.map(type => (
                  <FilterChip
                    key={type.value}
                    label={type.label}
                    active={filters.productTypes.includes(type.value)}
                    onClick={() => {
                      const productTypes = filters.productTypes.includes(type.value)
                        ? filters.productTypes.filter(t => t !== type.value)
                        : [...filters.productTypes, type.value]
                      onFiltersChange({ ...filters, productTypes })
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Filter Presets */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {savedPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => onFiltersChange(preset.filters)}
                    className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onExport('csv')}
                  className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export CSV
                </button>
                <button
                  onClick={() => onExport('json')}
                  className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  const sortOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'votes', label: 'Most Upvoted' },
    { value: 'newest', label: 'Newest' },
    { value: 'discussed', label: 'Most Discussed' },
    { value: 'relevance', label: 'Relevant to You' }
  ]
  
  const productTypes = [
    { value: 'mobile', label: 'Mobile App' },
    { value: 'web', label: 'Web App' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'books', label: 'Books' },
    { value: 'podcasts', label: 'Podcasts' },
    { value: 'newsletter', label: 'Newsletter' }
  ]
  ```

#### Ticket 4.2.6: Analytics & Tracking
- **Description:** Implement comprehensive analytics to track user engagement with Product Hunt feed
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Track user interactions:
    - Product clicks (with destination tracking)
    - Upvote actions (successful vs failed)
    - Bookmark/save actions
    - Time spent viewing products
    - Scroll depth and engagement patterns
  - Measure engagement metrics:
    - Click-through rate by product category
    - Most viewed product types
    - Peak usage times
    - User preference learning
  - Generate insights:
    - Trending categories based on user behavior
    - Personalized product recommendations
    - Engagement heatmaps
  - Privacy-preserving implementation:
    - Local analytics processing
    - No PII in analytics data
    - User consent for tracking
    - Export anonymized data only
  - Integration with dashboard analytics:
    - Unified analytics dashboard
    - Cross-widget insights
    - Export reports for PM teams
- **Dependencies:** 4.2.1, 4.2.5, 4.1.4
- **Implementation Notes:**
  ```typescript
  // src/lib/analytics/productHuntAnalytics.ts
  import { Analytics } from '~/lib/analytics/core'
  
  export class ProductHuntAnalytics extends Analytics {
    async trackProductView(product: ProductHuntItem, context: ViewContext) {
      const event = {
        type: 'product_view',
        productId: product.id,
        category: product.topics[0],
        position: context.position,
        viewMode: context.viewMode,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      }
      
      await this.recordEvent(event)
      await this.updateUserPreferences(product.topics)
    }
    
    async trackInteraction(
      type: 'click' | 'upvote' | 'bookmark' | 'share',
      product: ProductHuntItem,
      success: boolean
    ) {
      const event = {
        type: `product_${type}`,
        productId: product.id,
        success,
        voteCount: product.votes,
        userEngagementScore: this.calculateEngagementScore(product),
        timestamp: Date.now()
      }
      
      await this.recordEvent(event)
      
      if (type === 'click') {
        await this.trackClickDestination(product.url)
      }
    }
    
    async generateInsights(): Promise<ProductHuntInsights> {
      const events = await this.getEvents('7d')
      
      return {
        topCategories: this.analyzeTopCategories(events),
        engagementTrends: this.analyzeEngagementTrends(events),
        userPreferences: this.analyzeUserPreferences(events),
        recommendations: await this.generateRecommendations(events),
        peakUsageTimes: this.analyzePeakTimes(events)
      }
    }
  }
  ```

#### Ticket 4.2.7: Advanced Features
- **Description:** Implement advanced features for power users including maker following, integrations, and competitive analysis
- **Story Points:** 3 SP
- **Technical Requirements:**
  - Maker following system:
    - Follow/unfollow makers
    - Notifications for new launches by followed makers
    - Maker leaderboard and statistics
    - Track maker launch history
  - External integrations:
    - Export to Notion database
    - Save to Airtable base
    - Send to Slack channels
    - Create Jira tickets for interesting products
    - Add to Google Sheets tracker
  - Competitive analysis features:
    - Compare similar products side-by-side
    - Track competitor product launches
    - Market positioning analysis
    - Feature comparison matrices
  - Product Hunt Ship integration:
    - Show upcoming products
    - Subscribe to launch notifications
    - Early access signup tracking
  - Collections and lists:
    - Create custom product collections
    - Share collections with team
    - Collaborative voting on products
  - Golden Kitty Awards:
    - Highlight award winners
    - Filter by award categories
    - Historical award data
- **Dependencies:** 4.2.1, 4.2.5, 4.2.6
- **Implementation Notes:**
  ```typescript
  // src/lib/features/productHuntAdvanced.ts
  interface AdvancedFeatures {
    makerFollowing: MakerFollowingService
    integrations: IntegrationManager
    competitiveAnalysis: CompetitiveAnalyzer
    collections: CollectionManager
    awards: AwardsTracker
  }
  
  export class ProductHuntAdvanced {
    async followMaker(makerId: string) {
      await this.storage.add('followed-makers', makerId)
      await this.notifications.subscribe(`maker-${makerId}-launches`)
      await this.analytics.track('maker_followed', { makerId })
    }
    
    async exportToNotion(products: ProductHuntItem[], config: NotionConfig) {
      const notion = new NotionClient(config.apiKey)
      const database = await notion.getDatabase(config.databaseId)
      
      for (const product of products) {
        await notion.createPage({
          parent: { database_id: config.databaseId },
          properties: this.mapProductToNotionProperties(product)
        })
      }
    }
    
    async compareProducts(productIds: string[]): Promise<ComparisonMatrix> {
      const products = await this.fetchProductDetails(productIds)
      
      return {
        features: this.extractFeatures(products),
        metrics: this.compareMetrics(products),
        positioning: this.analyzePositioning(products),
        insights: this.generateComparisonInsights(products)
      }
    }
  }
  ```

#### Ticket 4.2.8: Offline Support
- **Description:** Implement comprehensive offline functionality with background sync and progressive enhancement
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Offline data caching:
    - Cache product data in IndexedDB
    - Store images with service worker
    - Implement cache versioning
    - Smart cache eviction policies
  - Background sync:
    - Queue user actions when offline
    - Sync upvotes/bookmarks when online
    - Handle conflict resolution
    - Retry failed syncs automatically
  - Offline indicators:
    - Show offline status badge
    - Indicate cached vs fresh data
    - Display last sync timestamp
    - Warn before actions that require internet
  - Progressive enhancement:
    - Basic features work offline
    - Enhanced features when online
    - Graceful degradation
  - Data persistence:
    - Save user preferences offline
    - Persist filter states
    - Cache analytics data
    - Export data while offline
  - Sync strategies:
    - Periodic background sync
    - Sync on network recovery
    - Manual sync trigger
    - Selective sync for data types
- **Dependencies:** 4.1.6, 4.2.1
- **Implementation Notes:**
  ```typescript
  // src/lib/offline/productHuntOffline.ts
  import { openDB } from 'idb'
  
  export class ProductHuntOfflineManager {
    private db: IDBDatabase
    private syncQueue: SyncQueue
    
    async initialize() {
      this.db = await openDB('product-hunt-offline', 1, {
        upgrade(db) {
          db.createObjectStore('products', { keyPath: 'id' })
          db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
          db.createObjectStore('images', { keyPath: 'url' })
        }
      })
      
      await this.registerBackgroundSync()
    }
    
    async cacheProducts(products: ProductHuntItem[]) {
      const tx = this.db.transaction('products', 'readwrite')
      
      for (const product of products) {
        await tx.store.put({
          ...product,
          cachedAt: Date.now(),
          isOffline: true
        })
        
        // Cache images
        if (product.thumbnail) {
          await this.cacheImage(product.thumbnail)
        }
      }
      
      await tx.done
    }
    
    async queueAction(action: UserAction) {
      if (!navigator.onLine) {
        await this.syncQueue.add(action)
        
        // Optimistic update
        if (action.type === 'upvote') {
          await this.updateLocalVoteCount(action.productId, 1)
        }
        
        return { queued: true, id: action.id }
      }
      
      return this.executeAction(action)
    }
    
    async sync() {
      const actions = await this.syncQueue.getAll()
      const results = []
      
      for (const action of actions) {
        try {
          const result = await this.executeAction(action)
          await this.syncQueue.remove(action.id)
          results.push({ action, success: true, result })
        } catch (error) {
          results.push({ action, success: false, error })
        }
      }
      
      return results
    }
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
- ✅ Enterprise-grade feed infrastructure with advanced caching, monitoring, and security
- ✅ Central FeedManager with intelligent orchestration and deduplication
- ✅ Network resilience with offline support and circuit breakers
- ✅ WebWorker-based performance optimization for UI responsiveness
- ✅ Product Hunt integration with beautiful product cards
- ✅ Hacker News feed with story ranking and metrics
- ✅ Jira integration with OAuth and ticket management
- ✅ RSS aggregator supporting multiple sources
- ✅ Modern, minimal UI design throughout

### Key Milestones:
1. **Enhanced Feed Infrastructure** - Production-ready with compression, ETags, and monitoring
2. **Security & Resilience Layer** - CORS proxy, rate limiting, and offline support
3. **Performance Optimization** - WebWorkers, lazy loading, and virtual scrolling
4. **All Feeds Integrated** - Product Hunt, HN, Jira, RSS functional
5. **UI Polish Complete** - All widgets following modern design principles

### Next Steps:
- Proceed to Epic 5: Web Clipper - Build content capture functionality
- Add more data sources based on user feedback
- Implement feed analytics and insights
- Create feed notification system for important updates