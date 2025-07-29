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

## Story 1.4: Type Definitions ✅
**Description:** Create comprehensive TypeScript type definitions for the entire application.

**Acceptance Criteria:**
- ✅ Core interfaces defined for all data structures
- ✅ Message types for Plasmo messaging
- ✅ Storage types properly typed
- ✅ Exported from central location

### Tickets:

#### Ticket 1.4.1: Create Core Type Definitions ✅
- **Description:** Define interfaces for calculators, feeds, and widget data
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create types/index.ts as main export
  - Define Calculator types (RICE, TAM, ROI, A/B)
  - Define Feed types (ProductHunt, HackerNews, etc.)
  - Add Widget configuration types
- **Dependencies:** 1.3.1
- **Status:** COMPLETED - Comprehensive type definitions created
- **Implementation Notes:**
  
  **Created src/types/index.ts with:**
  1. **Calculator Types**:
     - `RiceScore` - RICE prioritization with calculated score
     - `MarketSize` - TAM/SAM/SOM market sizing
     - `RoiCalculation` - ROI with annualized calculations
     - `AbTestResult` - A/B test with statistical significance
  
  2. **Feed Types**:
     - Base `FeedItem` interface
     - Specific types: `ProductHuntItem`, `HackerNewsItem`, `JiraTicket`, `RssFeedItem`
     - `FeedSource` union type
     - Feed metadata and pagination types
  
  3. **Widget & Settings Types**:
     - `WidgetConfig` with position and size
     - `WidgetType` union for all widget types
     - `UserSettings` with API key support
     - Default values and constants
  
  4. **Utility Features**:
     - Type guards for runtime validation
     - Helper constants (RICE_IMPACT_VALUES, DEFAULT_WIDGET_SIZES)
     - JSDoc comments for all types

#### Ticket 1.4.2: Define Plasmo Message Types ✅
- **Description:** Create type definitions for all background message handlers
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Define message payloads for each handler
  - Create response types
  - Use discriminated unions for type safety
  - Export from types/messages.ts
- **Dependencies:** 1.4.1
- **Status:** COMPLETED - Message types with discriminated unions implemented
- **Implementation Notes:**
  
  **Created src/types/messages.ts with:**
  1. **Request Types** (discriminated unions):
     - Feed operations (FETCH_FEED, GET_FEED_ITEMS, etc.)
     - Settings operations (GET_SETTINGS, UPDATE_SETTINGS)
     - Calculator operations (SAVE_CALCULATION, GET_HISTORY)
     - Jira operations (REFRESH_JIRA, SEARCH_JIRA)
     - Web clipper operations (SAVE_CLIP, GET_CLIPS)
     - Cache operations (CLEAR_CACHE, GET_CACHE_SIZE)
  
  2. **Response Types**:
     - Generic `MessageResponse<T>` wrapper
     - Specific response types for each request
     - Error handling support
  
  3. **Helper Functions**:
     - `createSuccessResponse()` and `createErrorResponse()`
     - `sendMessage()` for type-safe messaging
     - Type guards for validation
     - Constants for timeouts and retries

#### Ticket 1.4.3: Create Storage Type Definitions ✅
- **Description:** Define types for all data stored in chrome.storage
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Create StorageSchema interface
  - Define types for each storage key
  - Include area specifications (local vs sync)
  - Add JSDoc comments for clarity
- **Dependencies:** 1.4.1
- **Status:** COMPLETED - Complete storage schema with area specifications
- **Implementation Notes:**
  
  **Created src/types/storage.ts with:**
  1. **Complete StorageSchema**:
     - Sync storage: userSettings, dashboard-layout, rss-feeds
     - Local storage: feed caches, calculator history, web clips
     - Metadata: cache versions, timestamps, usage stats
  
  2. **Storage Management**:
     - Area specifications (sync vs local)
     - Storage quotas per key
     - Default values for all keys
     - Helper types for partial updates
  
  3. **Utility Functions**:
     - `getStorageArea()` - Get correct storage area
     - `estimateStorageSize()` - Check data size
     - `isQuotaExceeded()` - Validate against quotas
     - Type guards for storage keys
  
  4. **Integration**:
     - Updated background.ts to use new types
     - Updated options.tsx with UserSettings type
     - Build verified - all types compile correctly

---

## Story 1.5: Base UI Components ✅
**Description:** Setup CSS framework and create reusable UI components for consistent design.

**Acceptance Criteria:**
- ✅ Tailwind CSS configured and working
- ✅ Base component library created
- ✅ Components follow design system
- ✅ Dark mode support included

### Tickets:

#### Ticket 1.5.1: Setup Tailwind CSS ✅
- **Description:** Install and configure Tailwind CSS with Plasmo
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Install tailwindcss and dependencies
  - Create tailwind.config.js with custom theme
  - Setup CSS entry point
  - Verify styles work in all contexts (popup, newtab, options)
- **Dependencies:** 1.3.2
- **Status:** COMPLETED - Tailwind CSS v3.4.17 installed and configured
- **Implementation Notes:**
  - Installed Tailwind CSS v3.4.17 (v4 had compatibility issues)
  - Created tailwind.config.js with custom theme:
    - Extended color palette (primary colors, grays)
    - Custom fonts and animations
    - Dark mode support enabled
  - Updated globals.css with Tailwind directives
  - Added custom component classes (.card, .widget-grid)
  - Configured PostCSS for Plasmo compatibility

#### Ticket 1.5.2: Create Common UI Components ✅
- **Description:** Build reusable Button, Card, and Input components with TypeScript
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Create components/common/ directory
  - Build Button with variants (primary, secondary, danger)
  - Create Card with header and content areas
  - Build Input with validation states
  - Add proper TypeScript props interfaces
- **Dependencies:** 1.5.1
- **Status:** COMPLETED - Comprehensive component library created
- **Implementation Notes:**
  **Created Components:**
  1. **Button.tsx** - Multiple variants (primary, secondary, danger, ghost)
     - Size options (sm, md, lg)
     - Loading state with spinner
     - Full width option
  
  2. **Card.tsx** - Flexible card component
     - Optional title, description, footer
     - Hoverable state
     - Sub-components: CardHeader, CardBody, CardFooter
  
  3. **Input.tsx** - Form input with validation
     - Label, error, and helper text support
     - Left/right icon slots
     - Textarea variant included
  
  4. **Select.tsx** - Dropdown select component
     - Option disable support
     - Placeholder text
     - Consistent styling with inputs
  
  5. **Switch.tsx** - Toggle components
     - Checkbox-style switch
     - iOS-style toggle with animation
     - Label and description support
  
  6. **Badge.tsx** - Status indicators
     - Multiple variants (default, primary, success, warning, danger, info)
     - DotBadge for minimal indicators
     - Pulse animation option
  
  **Additional Work:**
  - Created lib/utils.ts with utility functions:
    - cn() for class name combination
    - formatCurrency(), formatPercentage(), formatRelativeTime()
    - debounce() and generateId() helpers
  - Updated all entry files to use new components
  - All components are fully typed with TypeScript
  - Export barrel in components/common/index.ts

---

## Epic Summary

### Deliverables:
- ✅ Fully initialized Plasmo project with proper structure
- ✅ Configured development environment with Biome (replaced ESLint/Prettier)
- ✅ Complete file structure following Plasmo conventions  
- ✅ Comprehensive TypeScript type definitions
- ✅ Base UI component library with Tailwind CSS v3
- ✅ All entry files (newtab, popup, options) using new components
- ✅ Build verified - extension compiles successfully

### Key Milestones:
1. **Project Initialization Complete** - Basic extension loads in browser
2. **Dev Environment Ready** - Team can start development with consistent tooling
3. **Type Safety Established** - All data structures properly typed
4. **UI Foundation Ready** - Base components available for feature development

### Next Steps:
- Proceed to Epic 2: Dashboard Core Implementation
- Team can begin parallel work on calculators and feeds
- Design team can start creating widget mockups using base components