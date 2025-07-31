# PM Dashboard Extension - Development Context for Claude

## Project Overview

This is a Chrome extension for Product Managers built with the Plasmo Framework. The extension provides a comprehensive dashboard that overrides the new tab page, offering calculators, data feeds, and productivity tools tailored for PMs.

**Project Type**: Browser Extension (Chrome/Firefox)  
**Framework**: Plasmo Framework (Next.js-like for extensions)  
**Primary Language**: TypeScript  
**UI Framework**: React  
**Target Users**: Product Managers  

## Core Features

### 1. New Tab Dashboard
- **Location**: `src/newtab.tsx`
- Grid layout with customizable widgets
- Real-time data feeds from multiple sources
- Interactive PM calculators
- Keyboard navigation support
- URL-based deep linking for calculators and widgets

### 2. PM Calculators
- **RICE Score Calculator**: (Reach × Impact × Confidence) / Effort
- **TAM/SAM/SOM Calculator**: Market sizing tool
- **ROI Calculator**: Return on investment calculations
- **A/B Test Calculator**: Statistical significance testing

### 3. Dynamic Data Feeds
- Product Hunt feed (latest products)
- Hacker News feed (top stories)
- Jira ticket feed (via API integration)
- RSS feed aggregator

### 4. Web Clipper
- Capture screenshots, text, and metadata from any webpage
- Save competitive intelligence and user feedback
- Floating action button using Content Script UI (CSUI)

### 5. API Integrations
- Jira (ticket management)
- GitHub (repository insights)
- Product analytics platforms
- Custom company APIs

## Technical Architecture

### File Structure (Complete as of Epic 2)
```
project-root/
├── assets/                  # Icons (must be in root, NOT in src/)
├── src/
│   ├── newtab.tsx          # Main dashboard UI with URL param handling
│   ├── popup.tsx           # Quick actions menu with shortcuts
│   ├── options.tsx         # Settings page with tabs
│   ├── background.ts       # Service worker for API calls & navigation
│   ├── contents/           # Content scripts
│   │   └── web-clipper.tsx
│   ├── tabs/               # Custom pages
│   │   └── auth.tsx        # OAuth flow
│   ├── components/         # React components
│   │   ├── common/         # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ShortcutHint.tsx
│   │   ├── dashboard/      # Dashboard-specific components
│   │   │   ├── DashboardGrid.tsx
│   │   │   ├── WidgetContainer.tsx
│   │   │   ├── WidgetRenderer.tsx
│   │   │   ├── WidgetSettings.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── HiddenWidgetsDrawer.tsx
│   │   ├── help/           # Help and documentation
│   │   │   └── KeyboardShortcuts.tsx
│   │   ├── layout/         # Layout components
│   │   │   └── DashboardHeader.tsx
│   │   ├── popup/          # Popup-specific components
│   │   │   ├── QuickActionCard.tsx
│   │   │   ├── FeedStatusCard.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── settings/       # Settings components
│   │   │   ├── GeneralSettings.tsx
│   │   │   ├── ApiKeyManager.tsx
│   │   │   ├── WidgetPreferences.tsx
│   │   │   ├── DataSettings.tsx
│   │   │   └── BackupRestore.tsx
│   │   └── widgets/        # Widget components
│   │       ├── BaseWidget.tsx
│   │       ├── WidgetHeader.tsx
│   │       ├── WidgetSkeleton.tsx
│   │       ├── WidgetError.tsx
│   │       ├── WidgetErrorBoundary.tsx
│   │       ├── RiceCalculator.tsx
│   │       ├── ProductHuntFeed.tsx
│   │       └── hooks/      # Widget-specific hooks
│   ├── hooks/              # Custom React hooks
│   │   ├── useDashboardLayout.ts
│   │   ├── useSecureStorage.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useCalculatorUsage.ts
│   │   └── useFeedStatus.ts
│   ├── lib/                # Utilities
│   │   ├── navigation.ts   # Navigation utilities
│   │   ├── dashboard/      # Dashboard utilities
│   │   │   ├── widgetRegistry.ts
│   │   │   └── defaultLayout.ts
│   │   └── storage/        # Storage utilities
│   │       ├── migrations.ts
│   │       ├── layoutValidator.ts
│   │       ├── storageManager.ts
│   │       └── secureStorage.ts
│   └── types/              # TypeScript definitions
│       ├── index.ts
│       └── messages.ts     # Message types for Chrome APIs
├── package.json            # With Chrome commands manifest
├── tsconfig.json          # Paths: "~/*": ["src/*"]
├── tailwind.config.js     # Tailwind configuration
├── biome.json            # Code formatter/linter config
└── keys.json             # API credentials (gitignored)
```

## Architecture Patterns

### Widget Framework
The widget system is built on an extensible architecture:

```typescript
// Widget Definition
interface WidgetDefinition {
  id: string
  name: string
  description: string
  category: 'calculator' | 'feed' | 'analytics' | 'utility'
  component: React.LazyExoticComponent<any>
  defaultSize: { width: number; height: number }
  minSize: { width: number; height: number }
  maxSize: { width: number; height: number }
}

// Widget Registry with lazy loading
export const widgetRegistry = new Map<string, WidgetDefinition>([
  ['rice-calculator', {
    id: 'rice-calculator',
    name: 'RICE Score Calculator',
    category: 'calculator',
    component: lazy(() => import('~/components/widgets/RiceCalculator')),
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 4 }
  }],
])
```

### State Management
Using @plasmohq/storage for persistent state:

```typescript
// Custom hook for dashboard layout
export function useDashboardLayout() {
  const [layout, setLayout] = useStorage<WidgetConfig[]>(
    "dashboard-layout",
    defaultLayout,
    { area: "sync" }
  )
  
  // CRUD operations with debounced persistence
  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setLayout(prev => prev.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ))
  }, [setLayout])
  
  return { layout, updateWidget, addWidget, removeWidget, showWidget, hideWidget }
}
```

### Navigation System
Enhanced navigation with URL parameters and history:

```typescript
// Navigation utilities
export const navigation = {
  openDashboard: async (params?: { calculator?: string; widget?: string }) => {
    // Handle URL parameters for deep linking
  },
  openSettings: async (section?: string) => {
    // Navigate to specific settings section
  },
  focusWidget: async (widgetId: string) => {
    // Open dashboard and scroll to widget
  }
}
```

### Message Architecture
Type-safe messaging system for Chrome extension communication:

```typescript
// Message types using discriminated unions
export type MessageRequest =
  | { type: "FETCH_FEED"; feed: FeedSource; force?: boolean }
  | { type: "FOCUS_WIDGET"; widgetId: string }
  | { type: "NAVIGATE_TO"; destination: "dashboard" | "settings" | "calculator"; params?: Record<string, string> }
  // ... more message types

// Type-safe message sending
export async function sendMessage<K extends MessageRequest["type"]>(
  request: Extract<MessageRequest, { type: K }>
): Promise<MessageResponses[K]>
```

## Coding Guidelines

### Component Structure
```typescript
// Use TypeScript interfaces for props
interface ComponentProps {
  required: string
  optional?: number
  children?: React.ReactNode
}

// Functional components with explicit return types
export function Component({ required, optional = 0 }: ComponentProps): JSX.Element {
  // Hook usage at the top
  const [state, setState] = useState<string>("")
  
  // Event handlers as const functions
  const handleClick = useCallback(() => {
    // Implementation
  }, [dependencies])
  
  // Conditional rendering with early returns
  if (!required) return <EmptyState />
  
  // Main render
  return (
    <div className="component">
      {/* Content */}
    </div>
  )
}
```

### Hook Patterns
```typescript
// Custom hooks always start with 'use'
export function useCustomHook() {
  // Return consistent object structure
  return {
    data,
    loading,
    error,
    actions: { update, remove }
  }
}
```

### Storage Patterns
```typescript
// Use secure storage for sensitive data
const [apiKeys, setApiKeys] = useSecureStorage<ApiKeyConfig[]>("api-keys", [])

// Use regular storage for UI state
const [settings, setSettings] = useStorage<UserSettings>("settings", defaultSettings)
```

## Development Workflow

### Adding a New Widget
1. Create widget component in `src/components/widgets/YourWidget.tsx`
2. Extend BaseWidget for consistent behavior
3. Register in `src/lib/dashboard/widgetRegistry.ts`
4. Add TypeScript types if needed

### Adding a New Calculator
1. Create calculator component following RICE/TAM examples
2. Add to widget registry with 'calculator' category
3. Add keyboard shortcut if frequently used
4. Update popup quick actions

### Adding Keyboard Shortcuts
1. Add to Chrome commands in `package.json` manifest
2. Handle in `src/background.ts` command listener
3. Add to shortcuts array in `useKeyboardShortcuts.ts`
4. Document in KeyboardShortcuts modal

### Testing Approach
- Manual testing in Chrome extension environment
- Use development build: `npm run dev`
- Test across different viewport sizes
- Verify storage persistence
- Test keyboard shortcuts in all contexts

## Current Status

### Completed
- ✅ Epic 1: Project Setup & Configuration
- ✅ Epic 2: Dashboard Core Implementation
  - Story 2.1: New Tab Page Structure
  - Story 2.2: Widget Framework
  - Story 2.3: Dashboard State Management
  - Story 2.4: Quick Actions Popup
  - Story 2.5: Settings Page
  - Story 2.6: Navigation & Routing
- ⏳ Epic 3: PM Calculators (In Progress)
  - ✅ Story 3.1: RICE Score Calculator
  - ✅ Story 3.2: TAM/SAM/SOM Calculator
  - ✅ Story 3.3: ROI Calculator
  - 🔲 Story 3.4: A/B Test Calculator

### Ready for Implementation
- Epic 4: Data Feeds & Integrations
- Epic 5: Web Clipper & Content Scripts
- Epic 6: Advanced Features

## Key Technical Decisions

1. **Plasmo Framework**: Chosen for its Next.js-like DX and hot reload support
2. **TypeScript**: Strict typing for better maintainability
3. **Tailwind CSS**: Utility-first styling with dark mode support
4. **@plasmohq/storage**: Unified storage API with React hooks
5. **Biome**: Fast formatter/linter replacing ESLint + Prettier
6. **Widget Registry**: Lazy loading for performance
7. **Message Architecture**: Type-safe cross-context communication

## Memories

- Current year is 2025
- When designing frontend: Always think like a product designer and make frontend Modern, Clean and minimal
- Use Sequential thinking & Context 7 MCP as required
- Widget visibility is managed through a `visible` property, not by removing from layout
- All icons must be in the root `assets/` directory, not in `src/`
- Chrome commands (keyboard shortcuts) are limited to 4 per extension
- Use debounced persistence for frequently updated state
- Always validate layout changes to prevent widget collisions
- Error boundaries are critical for widget isolation
- URL parameters enable deep linking to specific features
- Do not mention claude code in commit message
- Never add claude code or claude in co authored