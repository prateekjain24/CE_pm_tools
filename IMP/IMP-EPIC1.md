# Epic 1: Project Setup & Infrastructure

## Epic Overview
Establish the foundational architecture and development environment for the PM Dashboard Chrome Extension using the Plasmo Framework. This epic ensures proper project structure, TypeScript configuration, and base UI components are in place.

**Epic Goals:**
- Initialize Plasmo project with proper directory structure
- Configure development environment and tooling
- Setup type definitions and base components
- Establish coding standards and git workflow

**Total Story Points:** 25 SP  
**Total Stories:** 5  
**Total Tickets:** 18  

---

## Story 1.1: Initialize Plasmo Project ✅
**Description:** Create the initial project structure using Plasmo CLI and configure the manifest for Chrome extension development.

**Acceptance Criteria:**
- ✅ Project initialized with Plasmo's src directory pattern
- ✅ Manifest permissions properly configured
- ✅ Project runs in development mode
- ✅ Basic extension loads in Chrome

### Tickets:

#### Ticket 1.1.1: Initialize Plasmo Project ✅
- **Description:** Run `pnpm create plasmo --with-src pm-dashboard` and verify the generated structure matches requirements
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Use pnpm as package manager
  - Ensure --with-src flag is used for src directory pattern
  - Verify node_modules and build directories are created
- **Dependencies:** None
- **Status:** COMPLETED - Project successfully initialized with Plasmo CLI
- **Implementation Notes:**
  ```bash
  pnpm create plasmo --with-src pm-dashboard
  cd pm-dashboard
  pnpm dev # Verify it runs
  ```

#### Ticket 1.1.2: Configure TypeScript Path Aliases ✅
- **Description:** Update tsconfig.json to support path aliases for cleaner imports
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Add `"paths": { "~/*": ["src/*"] }` to compilerOptions
  - Ensure baseUrl is set correctly
  - Test that imports like `import { Button } from '~/components'` work
- **Dependencies:** 1.1.1
- **Status:** COMPLETED - Path aliases configured in tsconfig.json
- **Implementation Notes:**
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "~/*": ["src/*"]
      }
    }
  }
  ```

#### Ticket 1.1.3: Setup Git Repository ✅
- **Description:** Initialize git repo and configure .gitignore with proper exclusions
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Add keys.json to .gitignore
  - Exclude build/, dist/, and .plasmo directories
  - Include .env* files in gitignore
  - Add node_modules and .DS_Store
- **Dependencies:** 1.1.1
- **Status:** COMPLETED - Git initialized with comprehensive .gitignore file
- **Implementation Notes:**
  ```gitignore
  # Sensitive files
  keys.json
  .env*
  
  # Build outputs
  build/
  dist/
  .plasmo/
  
  # Dependencies
  node_modules/
  
  # System files
  .DS_Store
  ```

#### Ticket 1.1.4: Configure Extension Manifest ✅
- **Description:** Setup manifest permissions in package.json for required Chrome APIs
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Add storage, alarms, activeTab permissions
  - Configure host_permissions for API domains
  - Set extension name and description
  - Configure new tab override
- **Dependencies:** 1.1.1
- **Status:** COMPLETED - Manifest configured with all required permissions and API domains
- **Implementation Notes:**
  ```json
  {
    "name": "pm-dashboard",
    "displayName": "PM Dashboard",
    "version": "0.0.1",
    "description": "A comprehensive dashboard for Product Managers",
    "manifest": {
      "permissions": ["storage", "alarms", "activeTab", "clipboardWrite"],
      "host_permissions": [
        "https://api.producthunt.com/*",
        "https://hacker-news.firebaseio.com/*",
        "https://*.atlassian.net/*"
      ]
    }
  }
  ```

---

## Story 1.2: Development Environment Setup ✅
**Description:** Configure development tools, linting, formatting, and git hooks for consistent code quality.

**Acceptance Criteria:**
- ✅ Biome configured for TypeScript/React (replaced ESLint and Prettier)
- ✅ Pre-commit hooks running on git commit
- ✅ Environment variables properly configured
- ✅ VS Code settings optimized for project

### Tickets:

#### Ticket 1.2.1: Configure Biome (replaced ESLint and Prettier) ✅
- **Description:** Setup Biome for linting and formatting TypeScript/React code
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Install @biomejs/biome
  - Configure biome.json with TypeScript/React rules
  - Setup formatting rules (2 spaces, semicolons optional, etc.)
  - Add lint, format, and check scripts to package.json
- **Dependencies:** 1.1.1
- **Status:** COMPLETED - Biome configured with comprehensive rules
- **Implementation Notes:**
  ```bash
  pnpm remove prettier @ianvs/prettier-plugin-sort-imports
  pnpm add -D @biomejs/biome
  ```
  ```json
  // biome.json - Fast all-in-one linter and formatter
  {
    "$schema": "https://biomejs.dev/schemas/2.1.2/schema.json",
    "formatter": {
      "indentStyle": "space",
      "indentWidth": 2,
      "lineWidth": 100
    },
    "linter": {
      "rules": {
        "recommended": true
      }
    }
  }
  ```

#### Ticket 1.2.2: Setup Git Hooks with Husky ✅
- **Description:** Configure pre-commit hooks to run linting and formatting
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Install and configure Husky
  - Setup lint-staged for efficient linting
  - Add pre-commit hook for Biome
  - Test hooks work on commit
- **Dependencies:** 1.2.1
- **Status:** COMPLETED - Husky pre-commit hook runs Biome on staged files
- **Implementation Notes:**
  ```bash
  pnpm add -D husky lint-staged
  pnpm husky init
  ```
  ```json
  // package.json
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json}": ["biome check --write"]
  }
  ```

#### Ticket 1.2.3: Create Environment Configuration ✅
- **Description:** Setup .env files for development and production environments
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create .env.development and .env.production
  - Add PLASMO_PUBLIC_API_URL variables
  - Document available environment variables
  - Test env var loading in code
- **Dependencies:** 1.1.3
- **Status:** COMPLETED - Environment files created with example documentation
- **Implementation Notes:**
  Created three environment files:
  - `.env.development` - Development environment variables
  - `.env.production` - Production environment variables  
  - `.env.example` - Example file with documentation
  
  ```bash
  # .env.development
  PLASMO_PUBLIC_API_URL=http://localhost:3000
  PLASMO_PUBLIC_JIRA_CLIENT_ID=dev-client-id
  PLASMO_PUBLIC_PRODUCT_HUNT_API_KEY=
  PLASMO_PUBLIC_GITHUB_TOKEN=
  PLASMO_PUBLIC_ANALYTICS_KEY=dev-analytics-key
  ```

---

## Story 1.3: Core File Structure ✅
**Description:** Create the foundational directory structure and placeholder files for the extension.

**Acceptance Criteria:**
- ✅ All required directories created under src/
- ✅ Main entry point files created with basic structure
- ✅ Background service worker configured
- ✅ File organization follows Plasmo conventions

### Tickets:

#### Ticket 1.3.1: Create Directory Structure ✅
- **Description:** Setup all required folders under src/ directory
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create components/, lib/, types/, contents/, tabs/ directories
  - Add widgets/ and common/ subdirectories under components/
  - Create background/messages/ directory structure
  - Ensure assets/ stays in root (Plasmo requirement)
- **Dependencies:** 1.1.1
- **Status:** COMPLETED - All directories created with proper structure
- **Implementation Notes:**
  ```bash
  mkdir -p src/{components/{widgets,common},lib,types,background/messages,tabs,styles}
  mkdir -p assets/icons
  ```
  
  Created directory structure:
  - `src/components/` - React components
    - `widgets/` - Dashboard widgets
    - `common/` - Reusable components
  - `src/lib/` - Utility functions
  - `src/types/` - TypeScript types
  - `src/background/messages/` - Message handlers
  - `src/tabs/` - Custom tab pages
  - `src/styles/` - Global styles
  - `assets/icons/` - Extension icons

#### Ticket 1.3.2: Create Main Entry Files ✅
- **Description:** Update entry files with PM Dashboard specific content
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create basic React component for each file
  - Add proper TypeScript types
  - Include basic styling
  - Ensure hot reload works for each
- **Dependencies:** 1.3.1
- **Status:** COMPLETED - All entry files updated with PM Dashboard UI
- **Implementation Notes:**
  
  **Updated Files:**
  1. **newtab.tsx** - Main dashboard with grid layout for widgets
     - PM Dashboard header with tagline
     - Grid layout for calculators and feeds
     - Clean, minimal design
  
  2. **popup.tsx** - Quick actions menu (320px wide)
     - Open Dashboard button
     - Settings button
     - Quick tools list
     - Version footer
  
  3. **options.tsx** - Settings page
     - General settings (refresh interval, theme)
     - Feed toggles (Product Hunt, Hacker News, Jira)
     - API keys section (placeholder)
     - Save functionality with Chrome storage
  
  4. **styles/globals.css** - Moved from style.css
     - Modern reset and base styles
     - Typography system
     - Utility classes
     - Extension-specific styles

#### Ticket 1.3.3: Setup Background Service Worker ✅
- **Description:** Create background.ts with basic service worker structure and alarm setup
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Import necessary Chrome APIs
  - Setup onInstalled listener
  - Configure basic alarm for feed updates
  - Add message handling structure
- **Dependencies:** 1.3.1
- **Status:** COMPLETED - Background service worker configured with alarms and messaging
- **Implementation Notes:**
  
  **Installed dependency:**
  ```bash
  pnpm add @plasmohq/storage
  ```
  
  **Background service worker features:**
  1. **Storage initialization** - Using Plasmo storage wrapper
  2. **Installation handler**:
     - Sets default settings on first install
     - Creates feed update alarm
  3. **Alarm system**:
     - "fetch-feeds" alarm - runs every 15 minutes
     - First run after 1 minute
  4. **Message handling**:
     - FETCH_FEED - Initiates feed fetch
     - GET_SETTINGS - Returns user settings
     - UPDATE_SETTINGS - Updates settings
  5. **Update handler** - Logs available updates
  
  **Chrome APIs used:**
  - chrome.runtime.onInstalled
  - chrome.alarms.create/onAlarm
  - chrome.runtime.onMessage
  - chrome.storage.sync
  - chrome.runtime.onUpdateAvailable

---

## Story 1.4: Type Definitions
**Description:** Create comprehensive TypeScript type definitions for the entire application.

**Acceptance Criteria:**
- Core interfaces defined for all data structures
- Message types for Plasmo messaging
- Storage types properly typed
- Exported from central location

### Tickets:

#### Ticket 1.4.1: Create Core Type Definitions
- **Description:** Define interfaces for calculators, feeds, and widget data
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create types/index.ts as main export
  - Define Calculator types (RICE, TAM, ROI, A/B)
  - Define Feed types (ProductHunt, HackerNews, etc.)
  - Add Widget configuration types
- **Dependencies:** 1.3.1
- **Implementation Notes:**
  ```typescript
  // src/types/index.ts
  export interface RiceScore {
    reach: number
    impact: number
    confidence: number
    effort: number
    score: number
    savedAt: Date
  }
  
  export interface FeedItem {
    id: string
    title: string
    url: string
    description?: string
    timestamp: number
    source: 'product-hunt' | 'hacker-news' | 'jira' | 'rss'
  }
  
  export interface WidgetConfig {
    id: string
    type: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    visible: boolean
  }
  ```

#### Ticket 1.4.2: Define Plasmo Message Types
- **Description:** Create type definitions for all background message handlers
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Define message payloads for each handler
  - Create response types
  - Use discriminated unions for type safety
  - Export from types/messages.ts
- **Dependencies:** 1.4.1
- **Implementation Notes:**
  ```typescript
  // src/types/messages.ts
  export type MessageRequest = 
    | { type: "FETCH_FEED"; feed: "product-hunt" | "hacker-news" }
    | { type: "SAVE_CLIP"; data: ClipData }
    | { type: "REFRESH_JIRA"; projectKey: string }
  
  export interface MessageResponse<T = any> {
    success: boolean
    data?: T
    error?: string
  }
  ```

#### Ticket 1.4.3: Create Storage Type Definitions
- **Description:** Define types for all data stored in chrome.storage
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create StorageSchema interface
  - Define types for each storage key
  - Include area specifications (local vs sync)
  - Add JSDoc comments for clarity
- **Dependencies:** 1.4.1
- **Implementation Notes:**
  ```typescript
  // src/types/storage.ts
  export interface StorageSchema {
    "dashboard-layout": WidgetConfig[]
    "product-hunt-feed": FeedItem[]
    "calculator-history": {
      rice: RiceScore[]
      roi: RoiCalculation[]
    }
    "user-preferences": {
      theme: "light" | "dark"
      refreshInterval: number
    }
  }
  ```

---

## Story 1.5: Base UI Components
**Description:** Setup CSS framework and create reusable UI components for consistent design.

**Acceptance Criteria:**
- Tailwind CSS configured and working
- Base component library created
- Components follow design system
- Dark mode support included

### Tickets:

#### Ticket 1.5.1: Setup Tailwind CSS
- **Description:** Install and configure Tailwind CSS with Plasmo
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Install tailwindcss and dependencies
  - Create tailwind.config.js with custom theme
  - Setup CSS entry point
  - Verify styles work in all contexts (popup, newtab, options)
- **Dependencies:** 1.3.2
- **Implementation Notes:**
  ```bash
  pnpm add -D tailwindcss postcss autoprefixer
  pnpm tailwindcss init -p
  ```
  ```css
  /* src/styles/globals.css */
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

#### Ticket 1.5.2: Create Common UI Components
- **Description:** Build reusable Button, Card, and Input components with TypeScript
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create components/common/ directory
  - Build Button with variants (primary, secondary, danger)
  - Create Card with header and content areas
  - Build Input with validation states
  - Add proper TypeScript props interfaces
- **Dependencies:** 1.5.1
- **Implementation Notes:**
  ```typescript
  // src/components/common/Button.tsx
  interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    onClick?: () => void
    children: React.ReactNode
    disabled?: boolean
  }
  
  export function Button({ 
    variant = 'primary', 
    size = 'md', 
    ...props 
  }: ButtonProps) {
    return (
      <button 
        className={cn(
          'rounded-md font-medium transition-colors',
          variantStyles[variant],
          sizeStyles[size]
        )}
        {...props}
      />
    )
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ Fully initialized Plasmo project with proper structure
- ✅ Configured development environment with linting and formatting
- ✅ Complete file structure following Plasmo conventions  
- ✅ Comprehensive TypeScript type definitions
- ✅ Base UI component library with Tailwind CSS

### Key Milestones:
1. **Project Initialization Complete** - Basic extension loads in browser
2. **Dev Environment Ready** - Team can start development with consistent tooling
3. **Type Safety Established** - All data structures properly typed
4. **UI Foundation Ready** - Base components available for feature development

### Next Steps:
- Proceed to Epic 2: Dashboard Core Implementation
- Team can begin parallel work on calculators and feeds
- Design team can start creating widget mockups using base components