# Epic 5: Web Clipper

## Epic Overview
Build a powerful web clipper feature that allows Product Managers to capture competitive intelligence, user feedback, and market insights directly from any webpage. The clipper will use Plasmo's Content Script UI (CSUI) to provide a seamless, modern interface that floats over web pages, following clean and minimal design principles.

**Epic Goals:**
- Implement content script with floating action button
- Capture text, images, and metadata from web pages
- Organize clips with tags and categories
- Create searchable clip repository
- Enable quick annotations and highlights

**Total Story Points:** 18 SP  
**Total Stories:** 3  
**Total Tickets:** 14  

---

## Story 5.1: Content Script Implementation
**Description:** Create the core content script functionality that runs on all web pages, providing a floating action button and capture interface.

**Acceptance Criteria:**
- Floating action button appears on all pages
- Button is draggable and remembers position
- Quick capture modes (screenshot, selection, full page)
- Smooth animations and modern UI
- Respects page scroll and viewport changes

### Tickets:

#### Ticket 5.1.1: Create Web Clipper Content Script
- **Description:** Build the main content script file with Plasmo CSUI configuration
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Configure PlasmoCSConfig for all URLs
  - Setup React component for content script
  - Import necessary styles and dependencies
  - Handle script injection and cleanup
  - Ensure compatibility with various websites
- **Dependencies:** Epic 1 completion
- **Implementation Notes:**
  ```typescript
  // src/contents/web-clipper.tsx
  import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
  import { useState, useEffect } from "react"
  import { sendToBackground } from "@plasmohq/messaging"
  import { useStorage } from "@plasmohq/storage/hook"
  import cssText from "data-text:~/contents/web-clipper.css"
  
  export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    exclude_matches: [
      "chrome://*",
      "chrome-extension://*",
      "https://mail.google.com/*" // Exclude Gmail for performance
    ],
    all_frames: false,
    run_at: "document_idle"
  }
  
  export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
  }
  
  export default function WebClipper() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [position, setPosition] = useStorage<{ x: number; y: number }>(
      "clipper-position",
      { x: window.innerWidth - 80, y: window.innerHeight - 100 }
    )
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    
    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        setPosition(prev => ({
          x: Math.min(prev.x, window.innerWidth - 80),
          y: Math.min(prev.y, window.innerHeight - 100)
        }))
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    // Drag handling
    const handleMouseDown = (e: React.MouseEvent) => {
      if (isExpanded) return
      
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
    
    useEffect(() => {
      if (!isDragging) return
      
      const handleMouseMove = (e: MouseEvent) => {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 80))
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100))
        setPosition({ x: newX, y: newY })
      }
      
      const handleMouseUp = () => {
        setIsDragging(false)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isDragging, dragOffset])
    
    return (
      <>
        {/* Floating Action Button */}
        <div
          className="pm-clipper-fab"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onClick={() => !isDragging && setIsExpanded(true)}
        >
          <ClipperIcon />
        </div>
        
        {/* Expanded Clipper UI */}
        {isExpanded && (
          <ClipperPanel
            onClose={() => setIsExpanded(false)}
            position={position}
          />
        )}
      </>
    )
  }
  ```

#### Ticket 5.1.2: Implement Floating Action Button UI
- **Description:** Design and build the floating action button with modern styling and interactions
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Circular button with shadow and hover effects
  - Smooth scaling animations
  - Draggable with visual feedback
  - Tooltip on hover
  - Minimize/restore animations
  - Dark mode support
- **Dependencies:** 5.1.1
- **Implementation Notes:**
  ```typescript
  // src/contents/components/ClipperFAB.tsx
  interface ClipperFABProps {
    position: { x: number; y: number }
    isDragging: boolean
    onMouseDown: (e: React.MouseEvent) => void
    onClick: () => void
  }
  
  export function ClipperFAB({ 
    position, 
    isDragging, 
    onMouseDown, 
    onClick 
  }: ClipperFABProps) {
    const [showTooltip, setShowTooltip] = useState(false)
    
    return (
      <div
        className={cn(
          "pm-clipper-fab",
          "fixed z-[9999] w-14 h-14",
          "bg-blue-600 hover:bg-blue-700",
          "rounded-full shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-200",
          "group",
          isDragging && "scale-110 shadow-2xl"
        )}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'move'
        }}
        onMouseDown={onMouseDown}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Button Icon */}
        <button
          className="w-full h-full rounded-full flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white transform group-hover:scale-110 transition-transform"
          >
            <path
              d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 2V8H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 18V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9 15L12 12L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute inset-0 bg-white opacity-0",
            "group-active:opacity-20 transition-opacity"
          )} />
        </div>
        
        {/* Tooltip */}
        {showTooltip && !isDragging && (
          <div className={cn(
            "absolute right-full mr-2 top-1/2 -translate-y-1/2",
            "bg-gray-900 text-white text-sm",
            "px-3 py-1.5 rounded-md",
            "whitespace-nowrap",
            "animate-in fade-in slide-in-from-right-1"
          )}>
            Click to clip • Drag to move
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="border-8 border-transparent border-l-gray-900" />
            </div>
          </div>
        )}
      </div>
    )
  }
  
  /* src/contents/web-clipper.css */
  .pm-clipper-fab {
    /* Ensure FAB stays on top of most elements */
    z-index: 2147483647 !important;
    
    /* Prevent selection while dragging */
    -webkit-user-select: none;
    user-select: none;
    
    /* Smooth animations */
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.2s ease;
  }
  
  .pm-clipper-fab:active {
    transition: none;
  }
  
  /* Animation keyframes */
  @keyframes pm-clipper-pulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  
  .pm-clipper-fab.pm-has-new-clip {
    animation: pm-clipper-pulse 2s infinite;
  }
  ```

#### Ticket 5.1.3: Add Text Selection Detection
- **Description:** Implement detection and highlighting of text selections for quick capture
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Monitor text selection events
  - Show capture button near selection
  - Highlight selected text
  - Handle selection across multiple elements
  - Clean up on deselection
- **Dependencies:** 5.1.2
- **Implementation Notes:**
  ```typescript
  // src/contents/hooks/useTextSelection.ts
  interface SelectionInfo {
    text: string
    html: string
    bounds: DOMRect
    range: Range
  }
  
  export function useTextSelection(onSelection: (info: SelectionInfo | null) => void) {
    useEffect(() => {
      let selectionTimeout: NodeJS.Timeout
      
      const handleSelectionChange = () => {
        clearTimeout(selectionTimeout)
        
        selectionTimeout = setTimeout(() => {
          const selection = window.getSelection()
          
          if (!selection || selection.isCollapsed || !selection.toString().trim()) {
            onSelection(null)
            return
          }
          
          const range = selection.getRangeAt(0)
          const bounds = range.getBoundingClientRect()
          
          // Create a temporary container to get HTML
          const container = document.createElement('div')
          container.appendChild(range.cloneContents())
          
          const selectionInfo: SelectionInfo = {
            text: selection.toString(),
            html: container.innerHTML,
            bounds,
            range
          }
          
          onSelection(selectionInfo)
        }, 500) // Debounce selection
      }
      
      document.addEventListener('selectionchange', handleSelectionChange)
      document.addEventListener('mouseup', handleSelectionChange)
      
      return () => {
        clearTimeout(selectionTimeout)
        document.removeEventListener('selectionchange', handleSelectionChange)
        document.removeEventListener('mouseup', handleSelectionChange)
      }
    }, [onSelection])
  }
  
  // src/contents/components/SelectionPopup.tsx
  export function SelectionPopup({ selection }: { selection: SelectionInfo }) {
    const [position, setPosition] = useState({ top: 0, left: 0 })
    
    useEffect(() => {
      const { bounds } = selection
      const top = window.scrollY + bounds.top - 40
      const left = window.scrollX + bounds.left + (bounds.width / 2)
      
      setPosition({ 
        top: Math.max(10, top),
        left: Math.max(10, Math.min(left, window.innerWidth - 150))
      })
    }, [selection])
    
    const handleClip = async () => {
      const response = await sendToBackground({
        name: "save-clip",
        body: {
          type: 'text',
          content: selection.text,
          html: selection.html,
          url: window.location.href,
          title: document.title,
          timestamp: Date.now()
        }
      })
      
      if (response.success) {
        // Show success animation
        showSuccessAnimation(selection.bounds)
        // Clear selection
        window.getSelection()?.removeAllRanges()
      }
    }
    
    return (
      <div
        className={cn(
          "pm-selection-popup",
          "fixed z-[9999] bg-white dark:bg-gray-800",
          "rounded-lg shadow-xl border border-gray-200 dark:border-gray-700",
          "p-1 flex items-center gap-1",
          "animate-in fade-in slide-in-from-bottom-2"
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <button
          onClick={handleClip}
          className={cn(
            "px-3 py-1.5 rounded-md",
            "bg-blue-600 hover:bg-blue-700 text-white",
            "text-sm font-medium",
            "transition-colors"
          )}
        >
          <ClipIcon className="w-4 h-4 inline mr-1" />
          Clip Text
        </button>
        
        <button
          onClick={() => highlightSelection(selection)}
          className={cn(
            "p-1.5 rounded-md",
            "hover:bg-gray-100 dark:hover:bg-gray-700",
            "transition-colors"
          )}
        >
          <HighlightIcon className="w-4 h-4" />
        </button>
        
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <div className="w-2 h-2 bg-white dark:bg-gray-800 rotate-45 border-r border-b border-gray-200 dark:border-gray-700" />
        </div>
      </div>
    )
  }
  ```

#### Ticket 5.1.4: Build Screenshot Capture Functionality
- **Description:** Implement screenshot capture for visible area, full page, and selected regions
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Capture visible viewport
  - Full page screenshot with scrolling
  - Region selection with crosshair
  - Handle fixed/sticky elements
  - Optimize image size and quality
- **Dependencies:** 5.1.1
- **Implementation Notes:**
  ```typescript
  // src/contents/utils/screenshotCapture.ts
  export class ScreenshotCapture {
    async captureVisibleArea(): Promise<string> {
      // Send message to background to use chrome.tabs.captureVisibleTab
      const response = await sendToBackground({
        name: "capture-visible-tab"
      })
      
      return response.dataUrl
    }
    
    async captureFullPage(): Promise<string> {
      const originalScrollPosition = {
        x: window.scrollX,
        y: window.scrollY
      }
      
      // Calculate page dimensions
      const pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      )
      const pageWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth
      )
      
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Create canvas for full page
      const canvas = document.createElement('canvas')
      canvas.width = pageWidth
      canvas.height = pageHeight
      const ctx = canvas.getContext('2d')!
      
      // Capture in chunks
      const chunks: Array<{ x: number; y: number; dataUrl: string }> = []
      
      for (let y = 0; y < pageHeight; y += viewportHeight) {
        for (let x = 0; x < pageWidth; x += viewportWidth) {
          window.scrollTo(x, y)
          
          // Wait for scroll to complete and content to load
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const chunkDataUrl = await this.captureVisibleArea()
          chunks.push({ x, y, dataUrl: chunkDataUrl })
        }
      }
      
      // Stitch chunks together
      for (const chunk of chunks) {
        const img = await this.loadImage(chunk.dataUrl)
        ctx.drawImage(img, chunk.x, chunk.y)
      }
      
      // Restore scroll position
      window.scrollTo(originalScrollPosition.x, originalScrollPosition.y)
      
      // Convert to data URL with compression
      return canvas.toDataURL('image/jpeg', 0.8)
    }
    
    async captureRegion(): Promise<string> {
      return new Promise((resolve, reject) => {
        const overlay = this.createRegionSelector()
        document.body.appendChild(overlay)
        
        let isSelecting = false
        let startX = 0, startY = 0
        let endX = 0, endY = 0
        
        const updateSelection = (e: MouseEvent) => {
          if (!isSelecting) return
          
          endX = e.clientX
          endY = e.clientY
          
          const left = Math.min(startX, endX)
          const top = Math.min(startY, endY)
          const width = Math.abs(endX - startX)
          const height = Math.abs(endY - startY)
          
          const selection = overlay.querySelector('.pm-region-selection') as HTMLElement
          selection.style.left = `${left}px`
          selection.style.top = `${top}px`
          selection.style.width = `${width}px`
          selection.style.height = `${height}px`
        }
        
        const startSelection = (e: MouseEvent) => {
          isSelecting = true
          startX = e.clientX
          startY = e.clientY
          
          const selection = overlay.querySelector('.pm-region-selection') as HTMLElement
          selection.style.display = 'block'
        }
        
        const endSelection = async () => {
          if (!isSelecting) return
          
          isSelecting = false
          overlay.remove()
          
          const bounds = {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY)
          }
          
          // Capture the selected region
          const response = await sendToBackground({
            name: "capture-region",
            body: bounds
          })
          
          resolve(response.dataUrl)
        }
        
        overlay.addEventListener('mousedown', startSelection)
        overlay.addEventListener('mousemove', updateSelection)
        overlay.addEventListener('mouseup', endSelection)
        
        // Cancel on escape
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            overlay.remove()
            reject(new Error('Selection cancelled'))
          }
        }
        document.addEventListener('keydown', handleEscape)
      })
    }
    
    private createRegionSelector(): HTMLElement {
      const overlay = document.createElement('div')
      overlay.className = 'pm-region-overlay'
      overlay.innerHTML = `
        <div class="pm-region-selection"></div>
        <div class="pm-region-instructions">
          Click and drag to select region
        </div>
      `
      
      // Add styles
      const style = document.createElement('style')
      style.textContent = `
        .pm-region-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2147483647;
          cursor: crosshair;
          background: rgba(0, 0, 0, 0.3);
        }
        
        .pm-region-selection {
          position: absolute;
          border: 2px solid #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          display: none;
        }
        
        .pm-region-instructions {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
        }
      `
      overlay.appendChild(style)
      
      return overlay
    }
    
    private loadImage(dataUrl: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = dataUrl
      })
    }
  }
  ```

---

## Story 5.2: Clip Storage & Management
**Description:** Implement the storage system for clips, including categorization, tagging, and metadata management.

**Acceptance Criteria:**
- Clips stored efficiently in chrome.storage
- Support for text, image, and mixed content clips
- Automatic metadata extraction
- Tag and category system
- Search functionality

### Tickets:

#### Ticket 5.2.1: Design Clip Data Structure
- **Description:** Create comprehensive data schema for storing clips with all metadata
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Define TypeScript interfaces for clips
  - Support multiple content types
  - Include source page metadata
  - Add timestamps and user annotations
  - Plan for storage limitations
- **Dependencies:** None
- **Implementation Notes:**
  ```typescript
  // src/types/clips.ts
  export interface Clip {
    id: string
    type: 'text' | 'image' | 'mixed' | 'page'
    content: ClipContent
    metadata: ClipMetadata
    annotations: ClipAnnotation[]
    tags: string[]
    category: string
    createdAt: number
    updatedAt: number
    isFavorite: boolean
    isArchived: boolean
  }
  
  export interface ClipContent {
    text?: string
    html?: string
    imageUrl?: string
    imageData?: string // Base64 for small images
    markdown?: string
    selection?: {
      start: number
      end: number
      context: string
    }
  }
  
  export interface ClipMetadata {
    url: string
    domain: string
    title: string
    description?: string
    favicon?: string
    author?: string
    publishedDate?: number
    ogImage?: string
    keywords?: string[]
    language?: string
  }
  
  export interface ClipAnnotation {
    id: string
    text: string
    color: string
    position?: {
      x: number
      y: number
    }
    createdAt: number
  }
  
  export interface ClipFilter {
    search?: string
    type?: Clip['type']
    tags?: string[]
    category?: string
    dateRange?: {
      start: number
      end: number
    }
    isFavorite?: boolean
    isArchived?: boolean
  }
  
  // Storage helpers
  export class ClipStorage {
    private readonly STORAGE_KEY = 'clips'
    private readonly MAX_CLIPS = 1000
    private readonly IMAGE_SIZE_LIMIT = 500 * 1024 // 500KB
    
    async saveClip(clip: Omit<Clip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Clip> {
      const newClip: Clip = {
        ...clip,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      // Optimize image storage
      if (newClip.content.imageData) {
        newClip.content.imageData = await this.optimizeImage(newClip.content.imageData)
      }
      
      const clips = await this.getAllClips()
      
      // Check storage limit
      if (clips.length >= this.MAX_CLIPS) {
        // Remove oldest archived clips
        const sortedClips = clips
          .filter(c => c.isArchived)
          .sort((a, b) => a.createdAt - b.createdAt)
        
        if (sortedClips.length > 0) {
          await this.deleteClip(sortedClips[0].id)
        } else {
          throw new Error('Storage limit reached. Please delete some clips.')
        }
      }
      
      clips.push(newClip)
      await chrome.storage.local.set({ [this.STORAGE_KEY]: clips })
      
      return newClip
    }
    
    async getAllClips(): Promise<Clip[]> {
      const result = await chrome.storage.local.get(this.STORAGE_KEY)
      return result[this.STORAGE_KEY] || []
    }
    
    async getClipById(id: string): Promise<Clip | null> {
      const clips = await this.getAllClips()
      return clips.find(c => c.id === id) || null
    }
    
    async updateClip(id: string, updates: Partial<Clip>): Promise<void> {
      const clips = await this.getAllClips()
      const index = clips.findIndex(c => c.id === id)
      
      if (index === -1) throw new Error('Clip not found')
      
      clips[index] = {
        ...clips[index],
        ...updates,
        updatedAt: Date.now()
      }
      
      await chrome.storage.local.set({ [this.STORAGE_KEY]: clips })
    }
    
    async deleteClip(id: string): Promise<void> {
      const clips = await this.getAllClips()
      const filtered = clips.filter(c => c.id !== id)
      await chrome.storage.local.set({ [this.STORAGE_KEY]: filtered })
    }
    
    async searchClips(filter: ClipFilter): Promise<Clip[]> {
      const clips = await this.getAllClips()
      
      return clips.filter(clip => {
        // Text search
        if (filter.search) {
          const searchLower = filter.search.toLowerCase()
          const searchableText = [
            clip.content.text,
            clip.content.html,
            clip.metadata.title,
            clip.metadata.description,
            ...clip.tags,
            clip.category
          ].filter(Boolean).join(' ').toLowerCase()
          
          if (!searchableText.includes(searchLower)) return false
        }
        
        // Type filter
        if (filter.type && clip.type !== filter.type) return false
        
        // Tags filter
        if (filter.tags?.length) {
          const hasAllTags = filter.tags.every(tag => clip.tags.includes(tag))
          if (!hasAllTags) return false
        }
        
        // Category filter
        if (filter.category && clip.category !== filter.category) return false
        
        // Date range filter
        if (filter.dateRange) {
          if (clip.createdAt < filter.dateRange.start || 
              clip.createdAt > filter.dateRange.end) return false
        }
        
        // Boolean filters
        if (filter.isFavorite !== undefined && clip.isFavorite !== filter.isFavorite) return false
        if (filter.isArchived !== undefined && clip.isArchived !== filter.isArchived) return false
        
        return true
      })
    }
    
    private generateId(): string {
      return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    private async optimizeImage(base64: string): Promise<string> {
      // Implement image optimization logic
      // Resize large images, compress, etc.
      return base64
    }
  }
  ```

#### Ticket 5.2.2: Implement Clip Saving to Storage
- **Description:** Create background message handlers for saving clips from content script
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Handle different clip types
  - Validate clip data
  - Extract metadata asynchronously
  - Handle storage errors gracefully
  - Send success/failure notifications
- **Dependencies:** 5.2.1
- **Implementation Notes:**
  ```typescript
  // src/background/messages/save-clip.ts
  import type { PlasmoMessaging } from "@plasmohq/messaging"
  import { ClipStorage } from "~/lib/storage/ClipStorage"
  import { MetadataExtractor } from "~/lib/utils/MetadataExtractor"
  
  const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const clipStorage = new ClipStorage()
    const metadataExtractor = new MetadataExtractor()
    
    try {
      const { type, content, url, title, selection } = req.body
      
      // Extract metadata from URL
      const metadata = await metadataExtractor.extract(url)
      
      // Create clip object
      const clip = {
        type,
        content: {
          text: content.text,
          html: content.html,
          imageUrl: content.imageUrl,
          imageData: content.imageData,
          selection
        },
        metadata: {
          url,
          domain: new URL(url).hostname,
          title: title || metadata.title,
          description: metadata.description,
          favicon: metadata.favicon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`,
          author: metadata.author,
          publishedDate: metadata.publishedDate,
          ogImage: metadata.ogImage,
          keywords: metadata.keywords,
          language: metadata.language
        },
        annotations: [],
        tags: this.suggestTags(content.text, metadata),
        category: this.suggestCategory(url, metadata),
        isFavorite: false,
        isArchived: false
      }
      
      // Save to storage
      const savedClip = await clipStorage.saveClip(clip)
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon-128.png',
        title: 'Clip Saved!',
        message: `"${savedClip.metadata.title}" has been saved to your clips.`,
        buttons: [{ title: 'View' }, { title: 'Edit' }]
      })
      
      res.send({ success: true, clipId: savedClip.id })
      
    } catch (error) {
      console.error('Failed to save clip:', error)
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon-128.png',
        title: 'Failed to Save Clip',
        message: error.message
      })
      
      res.send({ success: false, error: error.message })
    }
  }
  
  // Helper methods
  const suggestTags = (text: string, metadata: any): string[] => {
    const tags = new Set<string>()
    
    // Add domain as tag
    if (metadata.domain) {
      tags.add(metadata.domain.replace('www.', ''))
    }
    
    // Extract hashtags from text
    const hashtags = text.match(/#\w+/g) || []
    hashtags.forEach(tag => tags.add(tag.slice(1)))
    
    // Add keywords
    if (metadata.keywords) {
      metadata.keywords.slice(0, 5).forEach(k => tags.add(k))
    }
    
    // Common PM-related keywords
    const pmKeywords = ['product', 'feature', 'user', 'feedback', 'competitor', 'market']
    pmKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        tags.add(keyword)
      }
    })
    
    return Array.from(tags).slice(0, 10)
  }
  
  const suggestCategory = (url: string, metadata: any): string => {
    const domain = new URL(url).hostname
    
    // Category mapping
    const categoryMap = {
      'producthunt.com': 'products',
      'news.ycombinator.com': 'tech-news',
      'github.com': 'development',
      'twitter.com': 'social-feedback',
      'linkedin.com': 'professional',
      'medium.com': 'articles',
      'reddit.com': 'discussions'
    }
    
    for (const [site, category] of Object.entries(categoryMap)) {
      if (domain.includes(site)) return category
    }
    
    // Default categories based on content
    if (metadata.keywords?.some(k => ['product', 'feature'].includes(k))) {
      return 'product-insights'
    }
    
    return 'general'
  }
  
  export default handler
  ```

#### Ticket 5.2.3: Create Clip Categorization System
- **Description:** Build system for organizing clips into categories with smart suggestions
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Predefined category list for PMs
  - Auto-categorization based on content
  - Custom category creation
  - Category icons and colors
  - Bulk categorization tools
- **Dependencies:** 5.2.2
- **Implementation Notes:**
  ```typescript
  // src/lib/clips/CategoryManager.ts
  export interface Category {
    id: string
    name: string
    slug: string
    icon: string
    color: string
    description?: string
    isCustom: boolean
    clipCount?: number
  }
  
  export class CategoryManager {
    private static defaultCategories: Category[] = [
      {
        id: 'cat_1',
        name: 'Product Ideas',
        slug: 'product-ideas',
        icon: '💡',
        color: '#f59e0b',
        description: 'New features and product concepts',
        isCustom: false
      },
      {
        id: 'cat_2',
        name: 'User Feedback',
        slug: 'user-feedback',
        icon: '💬',
        color: '#3b82f6',
        description: 'Customer comments and reviews',
        isCustom: false
      },
      {
        id: 'cat_3',
        name: 'Competitor Analysis',
        slug: 'competitor-analysis',
        icon: '🔍',
        color: '#ef4444',
        description: 'Competitive intelligence and insights',
        isCustom: false
      },
      {
        id: 'cat_4',
        name: 'Market Research',
        slug: 'market-research',
        icon: '📊',
        color: '#10b981',
        description: 'Industry trends and market data',
        isCustom: false
      },
      {
        id: 'cat_5',
        name: 'Technical Specs',
        slug: 'technical-specs',
        icon: '⚙️',
        color: '#6366f1',
        description: 'Technical documentation and specs',
        isCustom: false
      },
      {
        id: 'cat_6',
        name: 'Design Inspiration',
        slug: 'design-inspiration',
        icon: '🎨',
        color: '#ec4899',
        description: 'UI/UX examples and patterns',
        isCustom: false
      }
    ]
    
    async getAllCategories(): Promise<Category[]> {
      const customCategories = await this.getCustomCategories()
      const categories = [...CategoryManager.defaultCategories, ...customCategories]
      
      // Add clip counts
      const clips = await new ClipStorage().getAllClips()
      const countMap = clips.reduce((acc, clip) => {
        acc[clip.category] = (acc[clip.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return categories.map(cat => ({
        ...cat,
        clipCount: countMap[cat.slug] || 0
      }))
    }
    
    async createCustomCategory(category: Omit<Category, 'id' | 'isCustom'>): Promise<Category> {
      const customCategories = await this.getCustomCategories()
      
      // Validate slug is unique
      const slugExists = [...CategoryManager.defaultCategories, ...customCategories]
        .some(cat => cat.slug === category.slug)
      
      if (slugExists) {
        throw new Error('Category with this slug already exists')
      }
      
      const newCategory: Category = {
        ...category,
        id: `cat_custom_${Date.now()}`,
        isCustom: true
      }
      
      customCategories.push(newCategory)
      await chrome.storage.local.set({ 'custom-categories': customCategories })
      
      return newCategory
    }
    
    async suggestCategory(clip: Clip): Promise<string> {
      const categories = await this.getAllCategories()
      
      // Score each category based on content matching
      const scores = categories.map(category => {
        let score = 0
        const content = `${clip.content.text} ${clip.metadata.title} ${clip.tags.join(' ')}`.toLowerCase()
        
        // Check category keywords
        const keywords = this.getCategoryKeywords(category.slug)
        keywords.forEach(keyword => {
          if (content.includes(keyword)) score += 2
        })
        
        // Check domain patterns
        const domainPatterns = this.getDomainPatterns(category.slug)
        if (domainPatterns.some(pattern => clip.metadata.domain.includes(pattern))) {
          score += 3
        }
        
        // Check existing clips in category for similarity
        // (Implement similarity algorithm)
        
        return { category: category.slug, score }
      })
      
      // Return highest scoring category
      const bestMatch = scores.sort((a, b) => b.score - a.score)[0]
      return bestMatch.score > 0 ? bestMatch.category : 'general'
    }
    
    private getCategoryKeywords(slug: string): string[] {
      const keywordMap: Record<string, string[]> = {
        'product-ideas': ['feature', 'idea', 'concept', 'innovation', 'mvp'],
        'user-feedback': ['user', 'customer', 'feedback', 'review', 'complaint', 'testimonial'],
        'competitor-analysis': ['competitor', 'competition', 'rival', 'alternative', 'vs'],
        'market-research': ['market', 'industry', 'trend', 'statistics', 'growth', 'forecast'],
        'technical-specs': ['api', 'documentation', 'technical', 'implementation', 'architecture'],
        'design-inspiration': ['design', 'ui', 'ux', 'interface', 'mockup', 'wireframe']
      }
      
      return keywordMap[slug] || []
    }
    
    private getDomainPatterns(slug: string): string[] {
      const domainMap: Record<string, string[]> = {
        'product-ideas': ['producthunt.com', 'kickstarter.com', 'indiegogo.com'],
        'user-feedback': ['twitter.com', 'reddit.com', 'trustpilot.com', 'g2.com'],
        'competitor-analysis': ['similarweb.com', 'crunchbase.com'],
        'market-research': ['statista.com', 'gartner.com', 'forrester.com'],
        'technical-specs': ['github.com', 'stackoverflow.com', 'developers.'],
        'design-inspiration': ['dribbble.com', 'behance.net', 'figma.com']
      }
      
      return domainMap[slug] || []
    }
    
    private async getCustomCategories(): Promise<Category[]> {
      const result = await chrome.storage.local.get('custom-categories')
      return result['custom-categories'] || []
    }
  }
  ```

#### Ticket 5.2.4: Add Metadata Extraction
- **Description:** Extract rich metadata from clipped pages including OpenGraph, meta tags, and structured data
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Parse meta tags and OpenGraph data
  - Extract structured data (JSON-LD)
  - Get page description and keywords
  - Extract author information
  - Handle various date formats
- **Dependencies:** 5.2.2
- **Implementation Notes:**
  ```typescript
  // src/lib/utils/MetadataExtractor.ts
  export class MetadataExtractor {
    async extract(url: string): Promise<Partial<ClipMetadata>> {
      try {
        // For content script context, we can extract from current page
        if (typeof window !== 'undefined' && window.location.href === url) {
          return this.extractFromDOM()
        }
        
        // For background script, fetch and parse
        return await this.fetchAndExtract(url)
      } catch (error) {
        console.error('Metadata extraction failed:', error)
        return {}
      }
    }
    
    private extractFromDOM(): Partial<ClipMetadata> {
      const metadata: Partial<ClipMetadata> = {}
      
      // Title
      metadata.title = document.title || 
        this.getMetaContent('og:title') || 
        this.getMetaContent('twitter:title')
      
      // Description
      metadata.description = this.getMetaContent('description') ||
        this.getMetaContent('og:description') ||
        this.getMetaContent('twitter:description')
      
      // Image
      metadata.ogImage = this.getMetaContent('og:image') ||
        this.getMetaContent('twitter:image')
      
      // Author
      metadata.author = this.getMetaContent('author') ||
        this.getMetaContent('article:author') ||
        this.getJsonLdAuthor()
      
      // Published date
      metadata.publishedDate = this.extractPublishedDate()
      
      // Keywords
      const keywordsStr = this.getMetaContent('keywords')
      if (keywordsStr) {
        metadata.keywords = keywordsStr.split(',').map(k => k.trim())
      }
      
      // Language
      metadata.language = document.documentElement.lang || 
        this.getMetaContent('language')
      
      // Favicon
      metadata.favicon = this.extractFavicon()
      
      return metadata
    }
    
    private async fetchAndExtract(url: string): Promise<Partial<ClipMetadata>> {
      const response = await fetch(url)
      const html = await response.text()
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Use similar extraction logic on parsed document
      // ...
      
      return {}
    }
    
    private getMetaContent(name: string): string | null {
      const meta = document.querySelector(
        `meta[property="${name}"], meta[name="${name}"]`
      ) as HTMLMetaElement
      
      return meta?.content || null
    }
    
    private getJsonLdAuthor(): string | null {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '')
          
          if (data.author) {
            return typeof data.author === 'string' 
              ? data.author 
              : data.author.name
          }
          
          if (data['@type'] === 'Person' && data.name) {
            return data.name
          }
        } catch (e) {
          continue
        }
      }
      
      return null
    }
    
    private extractPublishedDate(): number | null {
      // Try various date sources
      const dateStrings = [
        this.getMetaContent('article:published_time'),
        this.getMetaContent('datePublished'),
        this.getMetaContent('pubdate'),
        this.getMetaContent('publish_date'),
        document.querySelector('time[datetime]')?.getAttribute('datetime'),
        document.querySelector('.published-date')?.textContent,
        document.querySelector('.post-date')?.textContent
      ].filter(Boolean)
      
      for (const dateStr of dateStrings) {
        const date = new Date(dateStr!)
        if (!isNaN(date.getTime())) {
          return date.getTime()
        }
      }
      
      return null
    }
    
    private extractFavicon(): string {
      // Try various favicon locations
      const favicon = 
        document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
        document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
        document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
        '/favicon.ico'
      
      // Make absolute URL
      if (favicon.startsWith('http')) return favicon
      if (favicon.startsWith('//')) return `https:${favicon}`
      if (favicon.startsWith('/')) return `${window.location.origin}${favicon}`
      
      return new URL(favicon, window.location.href).href
    }
  }
  ```

---

## Story 5.3: Clips Dashboard Widget
**Description:** Create a dashboard widget that displays saved clips with search, filter, and quick actions.

**Acceptance Criteria:**
- Display recent clips in widget
- Search clips by content
- Filter by type and category
- Quick preview on hover
- Export clips functionality

### Tickets:

#### Ticket 5.3.1: Build ClipsWidget for Dashboard
- **Description:** Create the main clips widget component for the dashboard
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Grid/list view toggle
  - Pagination or infinite scroll
  - Loading states
  - Empty state with CTA
  - Responsive design
- **Dependencies:** Epic 2, 5.2.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/ClipsWidget.tsx
  export function ClipsWidget() {
    const [clips, setClips] = useState<Clip[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useStorage('clips-view-mode', 'grid')
    const [filter, setFilter] = useState<ClipFilter>({})
    const [selectedClips, setSelectedClips] = useState<string[]>([])
    
    const clipStorage = new ClipStorage()
    
    useEffect(() => {
      loadClips()
    }, [filter])
    
    const loadClips = async () => {
      setLoading(true)
      try {
        const results = await clipStorage.searchClips(filter)
        setClips(results.sort((a, b) => b.createdAt - a.createdAt))
      } finally {
        setLoading(false)
      }
    }
    
    const handleDelete = async (clipId: string) => {
      await clipStorage.deleteClip(clipId)
      await loadClips()
    }
    
    const handleBulkAction = async (action: 'delete' | 'archive' | 'export') => {
      switch (action) {
        case 'delete':
          for (const id of selectedClips) {
            await clipStorage.deleteClip(id)
          }
          break
        case 'archive':
          for (const id of selectedClips) {
            await clipStorage.updateClip(id, { isArchived: true })
          }
          break
        case 'export':
          await exportClips(selectedClips)
          break
      }
      
      setSelectedClips([])
      await loadClips()
    }
    
    return (
      <BaseWidget
        title="Web Clips"
        icon={<ClipIcon />}
        onRefresh={loadClips}
        headerActions={
          <div className="flex items-center gap-2">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openClipManager()}
            >
              Manage
            </Button>
          </div>
        }
      >
        {() => (
          <div className="space-y-4">
            {/* Search and Filters */}
            <ClipFilters
              filter={filter}
              onChange={setFilter}
              clipCount={clips.length}
            />
            
            {/* Bulk Actions */}
            {selectedClips.length > 0 && (
              <BulkActionBar
                selectedCount={selectedClips.length}
                onAction={handleBulkAction}
                onClear={() => setSelectedClips([])}
              />
            )}
            
            {/* Clips Display */}
            {loading ? (
              <ClipSkeleton count={6} viewMode={viewMode} />
            ) : clips.length === 0 ? (
              <EmptyState
                icon={<ClipIcon className="w-12 h-12" />}
                title="No clips yet"
                description="Start clipping content from around the web"
                action={{
                  label: "Learn how to clip",
                  onClick: () => openTutorial()
                }}
              />
            ) : (
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}>
                {clips.map(clip => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    viewMode={viewMode}
                    selected={selectedClips.includes(clip.id)}
                    onSelect={(selected) => {
                      setSelectedClips(prev => 
                        selected 
                          ? [...prev, clip.id]
                          : prev.filter(id => id !== clip.id)
                      )
                    }}
                    onDelete={() => handleDelete(clip.id)}
                    onUpdate={(updates) => clipStorage.updateClip(clip.id, updates)}
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

#### Ticket 5.3.2: Create Clip Card Components
- **Description:** Build beautiful clip card components with preview and actions
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Show clip preview (text/image)
  - Display metadata and tags
  - Quick actions (favorite, archive, delete)
  - Hover preview for more detail
  - Selection checkbox for bulk actions
- **Dependencies:** 5.3.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/clips/ClipCard.tsx
  interface ClipCardProps {
    clip: Clip
    viewMode: 'grid' | 'list'
    selected: boolean
    onSelect: (selected: boolean) => void
    onDelete: () => void
    onUpdate: (updates: Partial<Clip>) => void
  }
  
  export function ClipCard({ 
    clip, 
    viewMode, 
    selected,
    onSelect,
    onDelete,
    onUpdate 
  }: ClipCardProps) {
    const [showPreview, setShowPreview] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    
    const handleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation()
      onUpdate({ isFavorite: !clip.isFavorite })
    }
    
    const handleArchive = (e: React.MouseEvent) => {
      e.stopPropagation()
      onUpdate({ isArchived: !clip.isArchived })
    }
    
    if (viewMode === 'list') {
      return <ClipListItem {...props} />
    }
    
    return (
      <div
        className={cn(
          "group relative bg-white dark:bg-gray-800",
          "rounded-lg border border-gray-200 dark:border-gray-700",
          "hover:shadow-lg transition-all duration-200",
          "overflow-hidden",
          selected && "ring-2 ring-blue-500"
        )}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {/* Selection Checkbox */}
        <div className={cn(
          "absolute top-2 left-2 z-10",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          selected && "opacity-100"
        )}>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="bg-white dark:bg-gray-800"
          />
        </div>
        
        {/* Clip Content Preview */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-900">
          {clip.type === 'image' && clip.content.imageUrl ? (
            <>
              {!imageLoaded && <Skeleton className="absolute inset-0" />}
              <img
                src={clip.content.imageUrl}
                alt={clip.metadata.title}
                className={cn(
                  "w-full h-full object-cover",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : clip.type === 'text' ? (
            <div className="p-4 overflow-hidden">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
                {clip.content.text}
              </p>
            </div>
          ) : clip.metadata.ogImage ? (
            <img
              src={clip.metadata.ogImage}
              alt={clip.metadata.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <img
                src={clip.metadata.favicon}
                alt=""
                className="w-12 h-12 opacity-50"
              />
            </div>
          )}
          
          {/* Type Badge */}
          <div className="absolute top-2 right-2">
            <ClipTypeBadge type={clip.type} />
          </div>
        </div>
        
        {/* Clip Info */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 mb-1">
            {clip.metadata.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <img
              src={clip.metadata.favicon}
              alt=""
              className="w-4 h-4"
            />
            <span>{clip.metadata.domain}</span>
            <span>•</span>
            <span>{formatTimeAgo(clip.createdAt)}</span>
          </div>
          
          {/* Tags */}
          {clip.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {clip.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {clip.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{clip.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <CategoryBadge categorySlug={clip.category} />
            
            <div className="flex items-center gap-1">
              <IconButton
                icon={clip.isFavorite ? <StarFilledIcon /> : <StarIcon />}
                onClick={handleFavorite}
                className={clip.isFavorite ? "text-yellow-500" : ""}
              />
              <IconButton
                icon={<ArchiveIcon />}
                onClick={handleArchive}
              />
              <IconButton
                icon={<TrashIcon />}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-red-600"
              />
            </div>
          </div>
        </div>
        
        {/* Hover Preview */}
        {showPreview && (
          <ClipPreviewTooltip clip={clip} />
        )}
      </div>
    )
  }
  
  function ClipTypeBadge({ type }: { type: Clip['type'] }) {
    const config = {
      text: { icon: <TextIcon />, color: 'bg-blue-500' },
      image: { icon: <ImageIcon />, color: 'bg-green-500' },
      mixed: { icon: <MixedIcon />, color: 'bg-purple-500' },
      page: { icon: <PageIcon />, color: 'bg-orange-500' }
    }
    
    const { icon, color } = config[type]
    
    return (
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        color,
        "text-white"
      )}>
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </div>
    )
  }
  ```

#### Ticket 5.3.3: Implement Search and Filter
- **Description:** Add search and filtering capabilities to the clips widget
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Full-text search across clips
  - Filter by type, category, tags
  - Date range picker
  - Saved filter presets
  - Clear all filters option
- **Dependencies:** 5.3.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/clips/ClipFilters.tsx
  interface ClipFiltersProps {
    filter: ClipFilter
    onChange: (filter: ClipFilter) => void
    clipCount: number
  }
  
  export function ClipFilters({ filter, onChange, clipCount }: ClipFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [categories] = useState<Category[]>([])
    const [availableTags] = useState<string[]>([])
    
    useEffect(() => {
      loadFilterOptions()
    }, [])
    
    const loadFilterOptions = async () => {
      const categoryManager = new CategoryManager()
      const cats = await categoryManager.getAllCategories()
      setCategories(cats)
      
      // Get all unique tags
      const clips = await new ClipStorage().getAllClips()
      const tags = new Set<string>()
      clips.forEach(clip => clip.tags.forEach(tag => tags.add(tag)))
      setAvailableTags(Array.from(tags).sort())
    }
    
    const updateFilter = (key: keyof ClipFilter, value: any) => {
      onChange({ ...filter, [key]: value })
    }
    
    const clearFilters = () => {
      onChange({})
      setShowAdvanced(false)
    }
    
    const hasActiveFilters = Object.keys(filter).length > 0
    
    return (
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filter.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search clips..."
            className={cn(
              "w-full pl-10 pr-4 py-2",
              "bg-white dark:bg-gray-800",
              "border border-gray-300 dark:border-gray-600",
              "rounded-lg",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            )}
          />
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "px-2 py-1 rounded",
              "text-sm font-medium",
              hasActiveFilters
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            )}
          >
            <FilterIcon className="w-4 h-4 inline mr-1" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                {Object.keys(filter).length}
              </span>
            )}
          </button>
        </div>
        
        {/* Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <QuickFilter
            label="Favorites"
            active={filter.isFavorite === true}
            onClick={() => updateFilter('isFavorite', filter.isFavorite === true ? undefined : true)}
            icon={<StarIcon />}
          />
          <QuickFilter
            label="Today"
            active={isToday(filter.dateRange)}
            onClick={() => setTodayFilter()}
          />
          <QuickFilter
            label="This Week"
            active={isThisWeek(filter.dateRange)}
            onClick={() => setThisWeekFilter()}
          />
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          )}
        </div>
        
        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <div className="flex gap-2">
                {(['text', 'image', 'mixed', 'page'] as const).map(type => (
                  <FilterChip
                    key={type}
                    label={type}
                    active={filter.type === type}
                    onClick={() => updateFilter('type', filter.type === type ? undefined : type)}
                  />
                ))}
              </div>
            </div>
            
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                value={filter.category || 'all'}
                onChange={(e) => updateFilter('category', e.target.value === 'all' ? undefined : e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name} ({cat.clipCount})
                  </option>
                ))}
              </Select>
            </div>
            
            {/* Tags Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tags</label>
              <TagSelector
                availableTags={availableTags}
                selectedTags={filter.tags || []}
                onChange={(tags) => updateFilter('tags', tags.length > 0 ? tags : undefined)}
              />
            </div>
            
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DateRangePicker
                value={filter.dateRange}
                onChange={(range) => updateFilter('dateRange', range)}
              />
            </div>
          </div>
        )}
        
        {/* Results Count */}
        <div className="text-sm text-gray-500">
          {clipCount} clips found
        </div>
      </div>
    )
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ Floating action button content script on all pages
- ✅ Multiple capture modes (text, screenshot, full page)
- ✅ Comprehensive clip storage system
- ✅ Smart categorization and tagging
- ✅ Beautiful clips dashboard widget
- ✅ Search and filter functionality

### Key Milestones:
1. **Content Script Working** - FAB appears and captures content
2. **Storage System Complete** - Clips saved with metadata
3. **Dashboard Integration** - Clips viewable in main dashboard
4. **Full Feature Set** - All capture modes and organization tools working

### Next Steps:
- Proceed to Epic 6: API Integrations & Authentication
- Add advanced annotation tools
- Implement clip sharing functionality
- Create browser action for quick access