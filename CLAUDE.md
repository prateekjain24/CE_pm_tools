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

### File Structure (src directory pattern)
```
project-root/
├── assets/           # Icons (must be in root, NOT in src/)
├── src/
│   ├── newtab.tsx    # Main dashboard UI
│   ├── popup.tsx     # Quick actions menu
│   ├── options.tsx   # Settings page
│   ├── background.ts # Service worker for API calls
│   ├── contents/     # Content scripts
│   │   └── web-clipper.tsx
│   ├── tabs/         # Custom pages
│   │   └── auth.tsx  # OAuth flow
│   ├── components/   # React components
│   │   ├── widgets/
│   │   │   ├── RiceCalculator.tsx
│   │   │   └── ProductHuntFeed.tsx
│   │   └── common/
│   ├── lib/          # Utilities
│   └── types/        # TypeScript definitions
├── package.json
├── tsconfig.json     # Update paths: "~/*": ["src/*"]
└── keys.json         # API credentials (gitignored)
```

[... rest of the existing content remains the same ...]

## Memories

- Current year is 2025
- When designing frontend Always think like a product designer and make frontend Modern, Clean and minimal
- Use Sequential thinking & Context 7 mcp as required