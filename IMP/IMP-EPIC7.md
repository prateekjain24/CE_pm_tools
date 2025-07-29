# Epic 7: Settings & Configuration

## Epic Overview
Build comprehensive settings and configuration management system that allows users to customize their PM Dashboard experience. This includes theme preferences, widget settings, data management, and import/export functionality, all with a modern, clean interface.

**Epic Goals:**
- Create intuitive settings interface
- Enable theme customization
- Build import/export functionality
- Implement data management tools
- Provide granular widget configuration

**Total Story Points:** 16 SP  
**Total Stories:** 3  
**Total Tickets:** 12  

---

## Story 7.1: User Preferences
**Description:** Implement user preference system for personalizing the dashboard appearance and behavior.

**Acceptance Criteria:**
- Theme selection with live preview
- Widget default configurations
- Notification preferences
- Keyboard shortcut customization
- Language/locale settings

### Tickets:

#### Ticket 7.1.1: Create Theme Selection
- **Description:** Build theme selector with light/dark modes and custom accent colors
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Light and dark theme presets
  - System theme detection
  - Custom accent color picker
  - Live preview without saving
  - Smooth theme transitions
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/settings/ThemeSettings.tsx
  import { useTheme } from "~/hooks/useTheme"
  
  interface ThemeConfig {
    mode: 'light' | 'dark' | 'system'
    accentColor: string
    fontSize: 'small' | 'medium' | 'large'
    reducedMotion: boolean
    highContrast: boolean
  }
  
  export function ThemeSettings() {
    const { theme, setTheme, previewTheme, resetPreview } = useTheme()
    const [localTheme, setLocalTheme] = useState<ThemeConfig>(theme)
    const [isPreviewActive, setIsPreviewActive] = useState(false)
    
    const handleThemeChange = (updates: Partial<ThemeConfig>) => {
      const newTheme = { ...localTheme, ...updates }
      setLocalTheme(newTheme)
      
      // Live preview
      setIsPreviewActive(true)
      previewTheme(newTheme)
    }
    
    const handleSave = () => {
      setTheme(localTheme)
      setIsPreviewActive(false)
    }
    
    const handleCancel = () => {
      setLocalTheme(theme)
      resetPreview()
      setIsPreviewActive(false)
    }
    
    const presetColors = [
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Purple', value: '#8b5cf6' },
      { name: 'Green', value: '#10b981' },
      { name: 'Orange', value: '#f59e0b' },
      { name: 'Pink', value: '#ec4899' },
      { name: 'Teal', value: '#14b8a6' }
    ]
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
          
          {/* Theme Mode */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">Color Scheme</Label>
              <RadioGroup
                value={localTheme.mode}
                onValueChange={(mode) => handleThemeChange({ mode: mode as any })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                    <SunIcon className="w-4 h-4" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                    <MoonIcon className="w-4 h-4" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                    <ComputerIcon className="w-4 h-4" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Accent Color */}
            <div>
              <Label className="text-base">Accent Color</Label>
              <div className="mt-2 space-y-3">
                {/* Preset Colors */}
                <div className="flex gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => handleThemeChange({ accentColor: color.value })}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 transition-all",
                        localTheme.accentColor === color.value
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  
                  {/* Custom Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={localTheme.accentColor}
                      onChange={(e) => handleThemeChange({ accentColor: e.target.value })}
                      className="sr-only"
                      id="custom-color"
                    />
                    <label
                      htmlFor="custom-color"
                      className={cn(
                        "block w-10 h-10 rounded-lg border-2 cursor-pointer",
                        "bg-gradient-to-br from-red-500 via-green-500 to-blue-500",
                        "hover:scale-105 transition-transform"
                      )}
                      title="Custom color"
                    />
                  </div>
                </div>
                
                {/* Current Color Display */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: localTheme.accentColor }}
                  />
                  <span>{localTheme.accentColor}</span>
                </div>
              </div>
            </div>
            
            {/* Font Size */}
            <div>
              <Label className="text-base">Font Size</Label>
              <Select
                value={localTheme.fontSize}
                onValueChange={(size) => handleThemeChange({ fontSize: size as any })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium (Default)</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Accessibility Options */}
            <div className="space-y-3">
              <h4 className="font-medium">Accessibility</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-motion" className="cursor-pointer">
                  Reduce motion
                  <span className="block text-sm font-normal text-gray-500">
                    Minimize animations and transitions
                  </span>
                </Label>
                <Switch
                  id="reduced-motion"
                  checked={localTheme.reducedMotion}
                  onCheckedChange={(checked) => 
                    handleThemeChange({ reducedMotion: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast" className="cursor-pointer">
                  High contrast
                  <span className="block text-sm font-normal text-gray-500">
                    Increase color contrast for better visibility
                  </span>
                </Label>
                <Switch
                  id="high-contrast"
                  checked={localTheme.highContrast}
                  onCheckedChange={(checked) => 
                    handleThemeChange({ highContrast: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview Section */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium mb-3">Preview</h4>
          <div className="grid grid-cols-2 gap-4">
            <SampleWidget theme="current" />
            <SampleWidget theme="preview" />
          </div>
        </div>
        
        {/* Action Buttons */}
        {isPreviewActive && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Apply Theme
            </Button>
          </div>
        )}
      </div>
    )
  }
  
  // src/hooks/useTheme.ts
  export function useTheme() {
    const [theme, setThemeStorage] = useStorage<ThemeConfig>('theme-config', {
      mode: 'system',
      accentColor: '#3b82f6',
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false
    })
    
    const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null)
    
    useEffect(() => {
      applyTheme(previewTheme || theme)
    }, [theme, previewTheme])
    
    const applyTheme = (config: ThemeConfig) => {
      const root = document.documentElement
      
      // Apply color scheme
      if (config.mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
      } else {
        root.classList.toggle('dark', config.mode === 'dark')
      }
      
      // Apply accent color
      root.style.setProperty('--accent-color', config.accentColor)
      
      // Apply font size
      root.setAttribute('data-font-size', config.fontSize)
      
      // Apply accessibility options
      root.classList.toggle('reduced-motion', config.reducedMotion)
      root.classList.toggle('high-contrast', config.highContrast)
    }
    
    const preview = (config: ThemeConfig) => {
      setPreviewTheme(config)
    }
    
    const resetPreview = () => {
      setPreviewTheme(null)
    }
    
    const setTheme = (config: ThemeConfig) => {
      setThemeStorage(config)
      setPreviewTheme(null)
    }
    
    return {
      theme: previewTheme || theme,
      setTheme,
      previewTheme: preview,
      resetPreview
    }
  }
  ```

#### Ticket 7.1.2: Add Widget Default Settings
- **Description:** Allow users to configure default settings for each widget type
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Widget-specific default values
  - Default visibility settings
  - Initial size preferences
  - Auto-refresh intervals
  - Reset to defaults option
- **Dependencies:** Epic 2 completion
- **Implementation Notes:**
  ```typescript
  // src/components/settings/WidgetDefaults.tsx
  interface WidgetDefaultConfig {
    widgetId: string
    enabled: boolean
    defaultSize: { width: number; height: number }
    refreshInterval: number
    specificSettings: Record<string, any>
  }
  
  export function WidgetDefaults() {
    const [widgetDefaults, setWidgetDefaults] = useStorage<Record<string, WidgetDefaultConfig>>(
      'widget-defaults',
      {}
    )
    const [editingWidget, setEditingWidget] = useState<string | null>(null)
    
    const availableWidgets = Array.from(widgetRegistry.entries())
    
    const updateWidgetDefault = (widgetId: string, config: Partial<WidgetDefaultConfig>) => {
      setWidgetDefaults(prev => ({
        ...prev,
        [widgetId]: { ...prev[widgetId], ...config }
      }))
    }
    
    const resetToDefaults = (widgetId: string) => {
      const widget = widgetRegistry.get(widgetId)
      if (!widget) return
      
      updateWidgetDefault(widgetId, {
        enabled: true,
        defaultSize: widget.defaultSize,
        refreshInterval: 15 * 60 * 1000, // 15 minutes
        specificSettings: {}
      })
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Widget Defaults</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure default settings for widgets when they're added to your dashboard.
          </p>
        </div>
        
        <div className="space-y-4">
          {availableWidgets.map(([id, widget]) => {
            const config = widgetDefaults[id] || {
              enabled: true,
              defaultSize: widget.defaultSize,
              refreshInterval: 15 * 60 * 1000,
              specificSettings: {}
            }
            
            return (
              <div
                key={id}
                className={cn(
                  "rounded-lg border p-4",
                  "bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{widget.icon}</div>
                    <div>
                      <h4 className="font-medium">{widget.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                  
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => 
                      updateWidgetDefault(id, { enabled })
                    }
                  />
                </div>
                
                {config.enabled && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Default Size */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`${id}-width`} className="text-sm">
                          Default Width
                        </Label>
                        <Select
                          value={String(config.defaultSize.width)}
                          onValueChange={(width) => 
                            updateWidgetDefault(id, {
                              defaultSize: { ...config.defaultSize, width: parseInt(width) }
                            })
                          }
                        >
                          <SelectTrigger id={`${id}-width`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                              <SelectItem key={w} value={String(w)}>
                                {w} {w === 1 ? 'column' : 'columns'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`${id}-height`} className="text-sm">
                          Default Height
                        </Label>
                        <Select
                          value={String(config.defaultSize.height)}
                          onValueChange={(height) => 
                            updateWidgetDefault(id, {
                              defaultSize: { ...config.defaultSize, height: parseInt(height) }
                            })
                          }
                        >
                          <SelectTrigger id={`${id}-height`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 6 }, (_, i) => i + 1).map(h => (
                              <SelectItem key={h} value={String(h)}>
                                {h} {h === 1 ? 'row' : 'rows'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Refresh Interval */}
                    <div>
                      <Label htmlFor={`${id}-refresh`} className="text-sm">
                        Auto-refresh Interval
                      </Label>
                      <Select
                        value={String(config.refreshInterval)}
                        onValueChange={(interval) => 
                          updateWidgetDefault(id, { refreshInterval: parseInt(interval) })
                        }
                      >
                        <SelectTrigger id={`${id}-refresh`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Disabled</SelectItem>
                          <SelectItem value="300000">5 minutes</SelectItem>
                          <SelectItem value="900000">15 minutes</SelectItem>
                          <SelectItem value="1800000">30 minutes</SelectItem>
                          <SelectItem value="3600000">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Widget-Specific Settings */}
                    {widget.settingsComponent && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingWidget(id)}
                          className="w-full"
                        >
                          <SettingsIcon className="w-4 h-4 mr-2" />
                          Configure {widget.name} Settings
                        </Button>
                      </div>
                    )}
                    
                    {/* Reset Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetToDefaults(id)}
                      >
                        Reset to Defaults
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Widget-Specific Settings Modal */}
        {editingWidget && (
          <WidgetSettingsModal
            widgetId={editingWidget}
            settings={widgetDefaults[editingWidget]?.specificSettings || {}}
            onSave={(settings) => {
              updateWidgetDefault(editingWidget, { specificSettings: settings })
              setEditingWidget(null)
            }}
            onClose={() => setEditingWidget(null)}
          />
        )}
      </div>
    )
  }
  ```

#### Ticket 7.1.3: Implement Data Refresh Intervals
- **Description:** Configure automatic data refresh intervals for different data sources
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Global refresh settings
  - Per-feed refresh intervals
  - Battery/performance modes
  - Manual refresh triggers
  - Sync status indicators
- **Dependencies:** Epic 4 completion
- **Implementation Notes:**
  ```typescript
  // src/components/settings/DataRefreshSettings.tsx
  interface RefreshConfig {
    global: {
      enabled: boolean
      batteryMode: 'normal' | 'low-power' | 'performance'
      wifiOnly: boolean
    }
    feeds: Record<string, {
      enabled: boolean
      interval: number
      lastRefresh?: number
      nextRefresh?: number
    }>
  }
  
  export function DataRefreshSettings() {
    const [refreshConfig, setRefreshConfig] = useStorage<RefreshConfig>('refresh-config', {
      global: {
        enabled: true,
        batteryMode: 'normal',
        wifiOnly: false
      },
      feeds: {}
    })
    
    const [syncStatus, setSyncStatus] = useState<Record<string, 'syncing' | 'success' | 'error'>>({})
    
    const feedTypes = [
      { id: 'product-hunt', name: 'Product Hunt', icon: '🚀', defaultInterval: 30 },
      { id: 'hacker-news', name: 'Hacker News', icon: '📰', defaultInterval: 15 },
      { id: 'jira', name: 'Jira', icon: '🔷', defaultInterval: 5 },
      { id: 'github', name: 'GitHub', icon: '🐙', defaultInterval: 10 },
      { id: 'rss', name: 'RSS Feeds', icon: '📡', defaultInterval: 60 }
    ]
    
    const updateGlobalConfig = (updates: Partial<RefreshConfig['global']>) => {
      setRefreshConfig(prev => ({
        ...prev,
        global: { ...prev.global, ...updates }
      }))
      
      // Apply changes to background script
      sendToBackground({
        name: 'update-refresh-config',
        body: { global: { ...refreshConfig.global, ...updates } }
      })
    }
    
    const updateFeedConfig = (feedId: string, updates: Partial<RefreshConfig['feeds'][string]>) => {
      setRefreshConfig(prev => ({
        ...prev,
        feeds: {
          ...prev.feeds,
          [feedId]: { ...prev.feeds[feedId], ...updates }
        }
      }))
    }
    
    const triggerManualRefresh = async (feedId: string) => {
      setSyncStatus(prev => ({ ...prev, [feedId]: 'syncing' }))
      
      try {
        await sendToBackground({
          name: 'force-refresh-feed',
          body: { feedType: feedId }
        })
        setSyncStatus(prev => ({ ...prev, [feedId]: 'success' }))
        
        // Update last refresh time
        updateFeedConfig(feedId, { lastRefresh: Date.now() })
        
        setTimeout(() => {
          setSyncStatus(prev => ({ ...prev, [feedId]: undefined }))
        }, 2000)
      } catch (error) {
        setSyncStatus(prev => ({ ...prev, [feedId]: 'error' }))
      }
    }
    
    const batteryModeDescriptions = {
      'normal': 'Standard refresh intervals',
      'low-power': 'Double all refresh intervals to save battery',
      'performance': 'More frequent updates (may impact battery)'
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Data Refresh Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Control how often data sources are updated in your dashboard.
          </p>
        </div>
        
        {/* Global Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium mb-4">Global Settings</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh" className="cursor-pointer">
                Automatic refresh
                <span className="block text-sm font-normal text-gray-500">
                  Update data sources automatically in the background
                </span>
              </Label>
              <Switch
                id="auto-refresh"
                checked={refreshConfig.global.enabled}
                onCheckedChange={(enabled) => updateGlobalConfig({ enabled })}
              />
            </div>
            
            {refreshConfig.global.enabled && (
              <>
                <div>
                  <Label className="text-sm">Battery Mode</Label>
                  <RadioGroup
                    value={refreshConfig.global.batteryMode}
                    onValueChange={(mode) => updateGlobalConfig({ batteryMode: mode as any })}
                    className="mt-2"
                  >
                    {Object.entries(batteryModeDescriptions).map(([mode, description]) => (
                      <div key={mode} className="flex items-center space-x-2">
                        <RadioGroupItem value={mode} id={mode} />
                        <Label htmlFor={mode} className="cursor-pointer">
                          <span className="capitalize">{mode.replace('-', ' ')}</span>
                          <span className="block text-sm font-normal text-gray-500">
                            {description}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="wifi-only" className="cursor-pointer">
                    Wi-Fi only
                    <span className="block text-sm font-normal text-gray-500">
                      Only refresh when connected to Wi-Fi
                    </span>
                  </Label>
                  <Switch
                    id="wifi-only"
                    checked={refreshConfig.global.wifiOnly}
                    onCheckedChange={(wifiOnly) => updateGlobalConfig({ wifiOnly })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Per-Feed Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Data Sources</h4>
          
          {feedTypes.map(feed => {
            const config = refreshConfig.feeds[feed.id] || {
              enabled: true,
              interval: feed.defaultInterval * 60 * 1000
            }
            const status = syncStatus[feed.id]
            
            return (
              <div
                key={feed.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feed.icon}</span>
                    <div>
                      <h5 className="font-medium">{feed.name}</h5>
                      {config.lastRefresh && (
                        <p className="text-xs text-gray-500">
                          Last updated {formatTimeAgo(config.lastRefresh)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {status === 'syncing' && (
                      <Spinner className="w-4 h-4 text-blue-600" />
                    )}
                    {status === 'success' && (
                      <CheckIcon className="w-4 h-4 text-green-600" />
                    )}
                    {status === 'error' && (
                      <XIcon className="w-4 h-4 text-red-600" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerManualRefresh(feed.id)}
                      disabled={status === 'syncing'}
                    >
                      <RefreshIcon className="w-4 h-4" />
                    </Button>
                    
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(enabled) => 
                        updateFeedConfig(feed.id, { enabled })
                      }
                    />
                  </div>
                </div>
                
                {config.enabled && refreshConfig.global.enabled && (
                  <div>
                    <Label htmlFor={`${feed.id}-interval`} className="text-sm">
                      Refresh interval
                    </Label>
                    <Select
                      value={String(config.interval)}
                      onValueChange={(interval) => 
                        updateFeedConfig(feed.id, { interval: parseInt(interval) })
                      }
                    >
                      <SelectTrigger id={`${feed.id}-interval`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300000">5 minutes</SelectItem>
                        <SelectItem value="900000">15 minutes</SelectItem>
                        <SelectItem value="1800000">30 minutes</SelectItem>
                        <SelectItem value="3600000">1 hour</SelectItem>
                        <SelectItem value="7200000">2 hours</SelectItem>
                        <SelectItem value="21600000">6 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {config.nextRefresh && (
                      <p className="text-xs text-gray-500 mt-1">
                        Next update in {formatTimeUntil(config.nextRefresh)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Refresh All Button */}
        <div className="flex justify-end">
          <Button
            onClick={async () => {
              for (const feed of feedTypes) {
                await triggerManualRefresh(feed.id)
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }}
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            Refresh All Sources
          </Button>
        </div>
      </div>
    )
  }
  ```

---

## Story 7.2: Import/Export
**Description:** Build import/export functionality for settings, widgets, and data to enable backup and sharing.

**Acceptance Criteria:**
- Export all settings and data
- Selective export options
- Import with validation
- Format compatibility
- Conflict resolution

### Tickets:

#### Ticket 7.2.1: Build Settings Export Functionality
- **Description:** Create system to export all user settings and configurations
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Export to JSON format
  - Include version information
  - Selective export options
  - Encrypt sensitive data option
  - Download as file
- **Dependencies:** None
- **Implementation Notes:**
  ```typescript
  // src/lib/settings/SettingsExporter.ts
  export interface ExportData {
    version: string
    exportDate: number
    browserInfo: {
      name: string
      version: string
      platform: string
    }
    settings: {
      theme?: ThemeConfig
      widgetDefaults?: Record<string, WidgetDefaultConfig>
      refreshConfig?: RefreshConfig
      keyboardShortcuts?: Record<string, string>
    }
    dashboardLayout?: WidgetConfig[]
    widgets?: {
      calculatorHistory?: any[]
      clips?: Clip[]
      customCategories?: Category[]
    }
    apiConnections?: {
      provider: string
      isConnected: boolean
      metadata?: any
    }[]
    encrypted?: boolean
  }
  
  export class SettingsExporter {
    private readonly VERSION = '1.0.0'
    
    async exportAll(options: ExportOptions = {}): Promise<ExportData> {
      const {
        includeTheme = true,
        includeWidgetSettings = true,
        includeDashboardLayout = true,
        includeWidgetData = true,
        includeApiConnections = true,
        encryptSensitive = false,
        password
      } = options
      
      const exportData: ExportData = {
        version: this.VERSION,
        exportDate: Date.now(),
        browserInfo: await this.getBrowserInfo(),
        settings: {},
        encrypted: encryptSensitive
      }
      
      // Gather settings
      if (includeTheme) {
        exportData.settings.theme = await chrome.storage.local.get('theme-config')
          .then(r => r['theme-config'])
      }
      
      if (includeWidgetSettings) {
        exportData.settings.widgetDefaults = await chrome.storage.local.get('widget-defaults')
          .then(r => r['widget-defaults'])
        exportData.settings.refreshConfig = await chrome.storage.local.get('refresh-config')
          .then(r => r['refresh-config'])
      }
      
      // Dashboard layout
      if (includeDashboardLayout) {
        exportData.dashboardLayout = await chrome.storage.local.get('dashboard-layout')
          .then(r => r['dashboard-layout'])
      }
      
      // Widget data
      if (includeWidgetData) {
        exportData.widgets = {
          calculatorHistory: await this.getCalculatorHistory(),
          clips: await new ClipStorage().getAllClips(),
          customCategories: await chrome.storage.local.get('custom-categories')
            .then(r => r['custom-categories'] || [])
        }
      }
      
      // API connections (sanitized)
      if (includeApiConnections) {
        exportData.apiConnections = await this.getApiConnections()
      }
      
      // Encrypt sensitive data if requested
      if (encryptSensitive && password) {
        exportData.encryptedData = await this.encryptSensitiveData(exportData, password)
        // Remove sensitive fields from main export
        delete exportData.apiConnections
      }
      
      return exportData
    }
    
    async exportToFile(options: ExportOptions = {}): Promise<void> {
      const data = await this.exportAll(options)
      const json = JSON.stringify(data, null, 2)
      
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `pm-dashboard-export-${timestamp}.json`
      
      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon-128.png',
        title: 'Export Complete',
        message: `Settings exported to ${filename}`
      })
    }
    
    private async getBrowserInfo() {
      const manifest = chrome.runtime.getManifest()
      return {
        name: 'Chrome',
        version: manifest.version,
        platform: navigator.platform
      }
    }
    
    private async getCalculatorHistory() {
      const types = ['rice', 'tam', 'roi', 'abtest']
      const history: any[] = []
      
      for (const type of types) {
        const data = await chrome.storage.local.get(`${type}-history`)
        if (data[`${type}-history`]) {
          history.push({
            type,
            items: data[`${type}-history`]
          })
        }
      }
      
      return history
    }
    
    private async getApiConnections() {
      const providers = ['jira', 'github', 'google-analytics']
      const connections = []
      
      for (const provider of providers) {
        const hasToken = await secureStorage.get(`oauth-tokens-${provider}`)
        if (hasToken) {
          const metadata = await chrome.storage.local.get(`${provider}-metadata`)
          connections.push({
            provider,
            isConnected: true,
            metadata: metadata[`${provider}-metadata`]
          })
        }
      }
      
      return connections
    }
    
    private async encryptSensitiveData(data: ExportData, password: string) {
      // Implement encryption for sensitive data
      const sensitive = {
        apiTokens: await this.getEncryptedApiTokens(),
        credentials: await this.getEncryptedCredentials()
      }
      
      // Use password-based encryption
      return await dataEncryption.encryptWithPassword(sensitive, password)
    }
  }
  
  // src/components/settings/ExportSettings.tsx
  export function ExportSettings() {
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
      includeTheme: true,
      includeWidgetSettings: true,
      includeDashboardLayout: true,
      includeWidgetData: true,
      includeApiConnections: true,
      encryptSensitive: false
    })
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isExporting, setIsExporting] = useState(false)
    
    const exporter = new SettingsExporter()
    
    const handleExport = async () => {
      if (exportOptions.encryptSensitive) {
        if (!password) {
          toast.error('Password required for encrypted export')
          return
        }
        if (password !== confirmPassword) {
          toast.error('Passwords do not match')
          return
        }
      }
      
      setIsExporting(true)
      
      try {
        await exporter.exportToFile({
          ...exportOptions,
          password: exportOptions.encryptSensitive ? password : undefined
        })
        
        toast.success('Export completed successfully')
      } catch (error) {
        toast.error('Export failed: ' + error.message)
      } finally {
        setIsExporting(false)
      }
    }
    
    const dataCategories = [
      { 
        id: 'theme', 
        label: 'Theme & Appearance',
        description: 'Color scheme, font size, and visual preferences'
      },
      { 
        id: 'widgetSettings', 
        label: 'Widget Settings',
        description: 'Default widget configurations and refresh intervals'
      },
      { 
        id: 'dashboardLayout', 
        label: 'Dashboard Layout',
        description: 'Widget positions and sizes on your dashboard'
      },
      { 
        id: 'widgetData', 
        label: 'Widget Data',
        description: 'Calculator history, web clips, and custom categories'
      },
      { 
        id: 'apiConnections', 
        label: 'API Connections',
        description: 'Connected services information (credentials not included)'
      }
    ]
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Export Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Export your settings and data for backup or sharing with other devices.
          </p>
        </div>
        
        {/* Export Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Select data to export</h4>
          
          {dataCategories.map(category => (
            <div
              key={category.id}
              className="flex items-start space-x-3"
            >
              <Checkbox
                id={category.id}
                checked={exportOptions[`include${category.id.charAt(0).toUpperCase() + category.id.slice(1)}`]}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({
                    ...prev,
                    [`include${category.id.charAt(0).toUpperCase() + category.id.slice(1)}`]: checked
                  }))
                }
              />
              <div className="flex-1">
                <Label htmlFor={category.id} className="cursor-pointer">
                  {category.label}
                  <span className="block text-sm font-normal text-gray-500">
                    {category.description}
                  </span>
                </Label>
              </div>
            </div>
          ))}
        </div>
        
        {/* Encryption Option */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start space-x-3 mb-4">
            <Checkbox
              id="encrypt"
              checked={exportOptions.encryptSensitive}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, encryptSensitive: checked }))
              }
            />
            <div className="flex-1">
              <Label htmlFor="encrypt" className="cursor-pointer">
                Encrypt sensitive data
                <span className="block text-sm font-normal text-gray-500">
                  Protect API connections and credentials with a password
                </span>
              </Label>
            </div>
          </div>
          
          {exportOptions.encryptSensitive && (
            <div className="space-y-3 ml-6">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter encryption password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm encryption password"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting || Object.values(exportOptions).every(v => v === false)}
          >
            {isExporting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export Settings
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }
  ```

#### Ticket 7.2.2: Create Settings Import with Validation
- **Description:** Build import functionality with comprehensive validation and conflict resolution
- **Story Points:** 2 SP
- **Technical Requirements:**
  - File upload interface
  - JSON validation
  - Version compatibility check
  - Preview import changes
  - Conflict resolution options
- **Dependencies:** 7.2.1
- **Implementation Notes:**
  ```typescript
  // src/lib/settings/SettingsImporter.ts
  export class SettingsImporter {
    async validateImportData(data: any): Promise<ValidationResult> {
      const errors: string[] = []
      const warnings: string[] = []
      
      // Check structure
      if (!data || typeof data !== 'object') {
        errors.push('Invalid file format')
        return { valid: false, errors, warnings }
      }
      
      // Check version compatibility
      if (!data.version) {
        errors.push('Missing version information')
      } else {
        const versionCheck = this.checkVersionCompatibility(data.version)
        if (!versionCheck.compatible) {
          errors.push(`Incompatible version: ${data.version}`)
        } else if (versionCheck.warning) {
          warnings.push(versionCheck.warning)
        }
      }
      
      // Validate data structure
      if (data.settings) {
        this.validateSettings(data.settings, errors, warnings)
      }
      
      if (data.dashboardLayout) {
        this.validateDashboardLayout(data.dashboardLayout, errors, warnings)
      }
      
      if (data.widgets) {
        this.validateWidgetData(data.widgets, errors, warnings)
      }
      
      // Check for encrypted data
      if (data.encrypted && !data.encryptedData) {
        errors.push('Missing encrypted data')
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      }
    }
    
    async previewImport(data: ExportData): Promise<ImportPreview> {
      const preview: ImportPreview = {
        changes: [],
        conflicts: [],
        newItems: [],
        summary: {}
      }
      
      // Compare with current data
      if (data.settings?.theme) {
        const currentTheme = await chrome.storage.local.get('theme-config')
        if (currentTheme['theme-config']) {
          preview.changes.push({
            type: 'settings',
            category: 'theme',
            current: currentTheme['theme-config'],
            incoming: data.settings.theme
          })
        } else {
          preview.newItems.push({
            type: 'settings',
            category: 'theme',
            data: data.settings.theme
          })
        }
      }
      
      // Check for conflicts in dashboard layout
      if (data.dashboardLayout) {
        const currentLayout = await chrome.storage.local.get('dashboard-layout')
        if (currentLayout['dashboard-layout']) {
          const conflicts = this.findLayoutConflicts(
            currentLayout['dashboard-layout'],
            data.dashboardLayout
          )
          preview.conflicts.push(...conflicts)
        }
      }
      
      // Calculate summary
      preview.summary = {
        totalChanges: preview.changes.length,
        totalConflicts: preview.conflicts.length,
        totalNewItems: preview.newItems.length,
        affectedCategories: this.getAffectedCategories(data)
      }
      
      return preview
    }
    
    async importData(
      data: ExportData,
      options: ImportOptions = {}
    ): Promise<ImportResult> {
      const {
        resolveConflicts = 'ask',
        mergeArrays = false,
        backup = true,
        password
      } = options
      
      const result: ImportResult = {
        success: true,
        imported: [],
        skipped: [],
        errors: []
      }
      
      try {
        // Create backup if requested
        if (backup) {
          const exporter = new SettingsExporter()
          await exporter.exportToFile({ 
            includeTheme: true,
            includeWidgetSettings: true,
            includeDashboardLayout: true,
            includeWidgetData: true,
            includeApiConnections: true
          })
        }
        
        // Decrypt if necessary
        if (data.encrypted && data.encryptedData) {
          if (!password) {
            throw new Error('Password required for encrypted import')
          }
          
          const decrypted = await dataEncryption.decryptWithPassword(
            data.encryptedData,
            password
          )
          
          // Merge decrypted data
          Object.assign(data, decrypted)
        }
        
        // Import settings
        if (data.settings) {
          await this.importSettings(data.settings, result)
        }
        
        // Import dashboard layout
        if (data.dashboardLayout) {
          await this.importDashboardLayout(data.dashboardLayout, result, {
            resolveConflicts,
            mergeArrays
          })
        }
        
        // Import widget data
        if (data.widgets) {
          await this.importWidgetData(data.widgets, result)
        }
        
        // Notify background script of changes
        await sendToBackground({
          name: 'settings-imported',
          body: { categories: result.imported }
        })
        
      } catch (error) {
        result.success = false
        result.errors.push(error.message)
      }
      
      return result
    }
    
    private async importSettings(
      settings: ExportData['settings'],
      result: ImportResult
    ): Promise<void> {
      const importMap = {
        theme: 'theme-config',
        widgetDefaults: 'widget-defaults',
        refreshConfig: 'refresh-config',
        keyboardShortcuts: 'keyboard-shortcuts'
      }
      
      for (const [key, storageKey] of Object.entries(importMap)) {
        if (settings[key]) {
          try {
            await chrome.storage.local.set({ [storageKey]: settings[key] })
            result.imported.push(key)
          } catch (error) {
            result.errors.push(`Failed to import ${key}: ${error.message}`)
          }
        }
      }
    }
    
    private findLayoutConflicts(
      current: WidgetConfig[],
      incoming: WidgetConfig[]
    ): ImportConflict[] {
      const conflicts: ImportConflict[] = []
      const positionMap = new Map<string, WidgetConfig>()
      
      // Build position map from current layout
      current.forEach(widget => {
        const key = `${widget.position.x},${widget.position.y}`
        positionMap.set(key, widget)
      })
      
      // Check for position conflicts
      incoming.forEach(widget => {
        const key = `${widget.position.x},${widget.position.y}`
        const existing = positionMap.get(key)
        
        if (existing && existing.id !== widget.id) {
          conflicts.push({
            type: 'position',
            widgetId: widget.id,
            current: existing,
            incoming: widget,
            resolution: 'none'
          })
        }
      })
      
      return conflicts
    }
  }
  
  // src/components/settings/ImportSettings.tsx
  export function ImportSettings() {
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importData, setImportData] = useState<ExportData | null>(null)
    const [validation, setValidation] = useState<ValidationResult | null>(null)
    const [preview, setPreview] = useState<ImportPreview | null>(null)
    const [password, setPassword] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const [importOptions, setImportOptions] = useState<ImportOptions>({
      resolveConflicts: 'ask',
      mergeArrays: false,
      backup: true
    })
    
    const importer = new SettingsImporter()
    
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      setImportFile(file)
      
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        setImportData(data)
        
        // Validate
        const validationResult = await importer.validateImportData(data)
        setValidation(validationResult)
        
        if (validationResult.valid) {
          // Generate preview
          const importPreview = await importer.previewImport(data)
          setPreview(importPreview)
        }
      } catch (error) {
        setValidation({
          valid: false,
          errors: ['Invalid file format: ' + error.message],
          warnings: []
        })
      }
    }
    
    const handleImport = async () => {
      if (!importData || !validation?.valid) return
      
      setIsImporting(true)
      
      try {
        const result = await importer.importData(importData, {
          ...importOptions,
          password: importData.encrypted ? password : undefined
        })
        
        if (result.success) {
          toast.success(`Import completed: ${result.imported.length} items imported`)
          
          // Reset form
          setImportFile(null)
          setImportData(null)
          setValidation(null)
          setPreview(null)
          setPassword('')
          
          // Refresh page to show new settings
          setTimeout(() => window.location.reload(), 1000)
        } else {
          toast.error('Import failed: ' + result.errors.join(', '))
        }
      } catch (error) {
        toast.error('Import error: ' + error.message)
      } finally {
        setIsImporting(false)
      }
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Import Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Import settings from a previously exported file.
          </p>
        </div>
        
        {/* File Upload */}
        <div>
          <Label htmlFor="import-file">Select import file</Label>
          <div className="mt-2">
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="import-file"
              className={cn(
                "flex items-center justify-center",
                "w-full p-4 border-2 border-dashed rounded-lg",
                "cursor-pointer transition-colors",
                "hover:border-gray-400 dark:hover:border-gray-500",
                importFile
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600"
              )}
            >
              {importFile ? (
                <div className="text-center">
                  <FileIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">{importFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to select file or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    JSON files only
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>
        
        {/* Validation Results */}
        {validation && (
          <div className="space-y-3">
            {validation.valid ? (
              <Alert>
                <CheckCircleIcon className="w-4 h-4" />
                <AlertTitle>Valid import file</AlertTitle>
                <AlertDescription>
                  The file has been validated and is ready to import.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircleIcon className="w-4 h-4" />
                <AlertTitle>Invalid import file</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {validation.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validation.warnings.length > 0 && (
              <Alert>
                <AlertCircleIcon className="w-4 h-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {validation.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {/* Import Preview */}
        {preview && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-medium mb-3">Import Preview</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Changes to apply:</span>
                <span className="font-medium">{preview.summary.totalChanges}</span>
              </div>
              <div className="flex justify-between">
                <span>New items:</span>
                <span className="font-medium">{preview.summary.totalNewItems}</span>
              </div>
              {preview.summary.totalConflicts > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Conflicts:</span>
                  <span className="font-medium">{preview.summary.totalConflicts}</span>
                </div>
              )}
            </div>
            
            {preview.summary.affectedCategories.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Affected categories:
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {preview.summary.affectedCategories.map(cat => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Password Input for Encrypted Files */}
        {importData?.encrypted && (
          <div>
            <Label htmlFor="import-password">Decryption Password</Label>
            <Input
              id="import-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to decrypt data"
            />
          </div>
        )}
        
        {/* Import Options */}
        {preview && (
          <div className="space-y-3">
            <h4 className="font-medium">Import Options</h4>
            
            <div className="space-y-2">
              <Label>Conflict Resolution</Label>
              <RadioGroup
                value={importOptions.resolveConflicts}
                onValueChange={(value) => 
                  setImportOptions(prev => ({ ...prev, resolveConflicts: value as any }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ask" id="ask" />
                  <Label htmlFor="ask">Ask for each conflict</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" />
                  <Label htmlFor="skip">Skip conflicting items</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <Label htmlFor="overwrite">Overwrite existing data</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="backup"
                checked={importOptions.backup}
                onCheckedChange={(checked) => 
                  setImportOptions(prev => ({ ...prev, backup: checked }))
                }
              />
              <Label htmlFor="backup">
                Create backup before importing
              </Label>
            </div>
          </div>
        )}
        
        {/* Import Button */}
        <div className="flex justify-end gap-2">
          {importFile && (
            <Button
              variant="outline"
              onClick={() => {
                setImportFile(null)
                setImportData(null)
                setValidation(null)
                setPreview(null)
              }}
            >
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleImport}
            disabled={
              !validation?.valid || 
              isImporting ||
              (importData?.encrypted && !password)
            }
          >
            {isImporting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Importing...
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4 mr-2" />
                Import Settings
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }
  ```

#### Ticket 7.2.3: Add Calculator History Export
- **Description:** Enable export of calculator history in various formats (CSV, JSON, PDF)
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Export individual calculator types
  - Multiple format support
  - Date range filtering
  - Include visualizations in PDF
  - Bulk export option
- **Dependencies:** Epic 3 completion
- **Implementation Notes:**
  ```typescript
  // src/components/settings/CalculatorExport.tsx
  export function CalculatorExport() {
    const [selectedCalculators, setSelectedCalculators] = useState<string[]>([])
    const [dateRange, setDateRange] = useState({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    })
    const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv')
    const [isExporting, setIsExporting] = useState(false)
    
    const calculatorTypes = [
      { id: 'rice', name: 'RICE Score', icon: '📊' },
      { id: 'tam', name: 'TAM/SAM/SOM', icon: '📈' },
      { id: 'roi', name: 'ROI', icon: '💰' },
      { id: 'abtest', name: 'A/B Test', icon: '🧪' }
    ]
    
    const handleExport = async () => {
      if (selectedCalculators.length === 0) {
        toast.error('Please select at least one calculator')
        return
      }
      
      setIsExporting(true)
      
      try {
        const exporter = new CalculatorExporter()
        
        switch (format) {
          case 'csv':
            await exporter.exportToCSV({
              calculators: selectedCalculators,
              dateRange
            })
            break
          case 'json':
            await exporter.exportToJSON({
              calculators: selectedCalculators,
              dateRange
            })
            break
          case 'pdf':
            await exporter.exportToPDF({
              calculators: selectedCalculators,
              dateRange,
              includeCharts: true
            })
            break
        }
        
        toast.success('Export completed successfully')
      } catch (error) {
        toast.error('Export failed: ' + error.message)
      } finally {
        setIsExporting(false)
      }
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Export Calculator History</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Export your calculator history for analysis or record keeping.
          </p>
        </div>
        
        {/* Calculator Selection */}
        <div>
          <h4 className="font-medium mb-3">Select Calculators</h4>
          <div className="space-y-2">
            {calculatorTypes.map(calc => (
              <label
                key={calc.id}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <Checkbox
                  checked={selectedCalculators.includes(calc.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCalculators(prev => [...prev, calc.id])
                    } else {
                      setSelectedCalculators(prev => prev.filter(id => id !== calc.id))
                    }
                  }}
                />
                <span className="text-2xl">{calc.icon}</span>
                <span>{calc.name}</span>
              </label>
            ))}
          </div>
          
          <div className="mt-3 flex gap-2">
            <Button
              variant="link"
              size="sm"
              onClick={() => setSelectedCalculators(calculatorTypes.map(c => c.id))}
            >
              Select All
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSelectedCalculators([])}
            >
              Clear All
            </Button>
          </div>
        </div>
        
        {/* Date Range */}
        <div>
          <h4 className="font-medium mb-3">Date Range</h4>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            presets={[
              { label: 'Last 7 days', days: 7 },
              { label: 'Last 30 days', days: 30 },
              { label: 'Last 90 days', days: 90 },
              { label: 'All time', days: null }
            ]}
          />
        </div>
        
        {/* Export Format */}
        <div>
          <h4 className="font-medium mb-3">Export Format</h4>
          <RadioGroup value={format} onValueChange={setFormat}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="cursor-pointer">
                  CSV - Spreadsheet compatible
                  <span className="block text-sm font-normal text-gray-500">
                    Best for data analysis in Excel or Google Sheets
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="cursor-pointer">
                  JSON - Raw data
                  <span className="block text-sm font-normal text-gray-500">
                    Complete data with all fields for programmatic use
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">
                  PDF - Formatted report
                  <span className="block text-sm font-normal text-gray-500">
                    Includes charts and formatted for printing/sharing
                  </span>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {/* Export Preview */}
        {selectedCalculators.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-medium mb-2">Export Preview</h4>
            <CalculatorHistoryPreview
              calculators={selectedCalculators}
              dateRange={dateRange}
            />
          </div>
        )}
        
        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedCalculators.length === 0}
          >
            {isExporting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }
  ```

---

## Story 7.3: Data Management
**Description:** Provide tools for managing storage usage, clearing caches, and controlling data retention.

**Acceptance Criteria:**
- Storage usage visualization
- Selective data clearing
- Cache management
- Data retention policies
- Storage optimization

### Tickets:

#### Ticket 7.3.1: Create Cache Clearing Functionality
- **Description:** Build interface for clearing various caches and temporary data
- **Story Points:** 1 SP
- **Technical Requirements:**
  - List all cache types
  - Show cache sizes
  - Selective clearing
  - Clear all option
  - Confirmation dialogs
- **Dependencies:** None
- **Implementation Notes:**
  ```typescript
  // src/components/settings/CacheManagement.tsx
  interface CacheInfo {
    id: string
    name: string
    description: string
    size: number
    items: number
    lastCleared?: number
  }
  
  export function CacheManagement() {
    const [caches, setCaches] = useState<CacheInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [clearing, setClearing] = useState<string | null>(null)
    
    useEffect(() => {
      analyzeCaches()
    }, [])
    
    const analyzeCaches = async () => {
      setLoading(true)
      
      const cacheTypes = [
        { 
          id: 'feed-cache',
          name: 'Feed Cache',
          description: 'Cached data from Product Hunt, Hacker News, and RSS feeds',
          pattern: /^cache:.*-feed$/
        },
        {
          id: 'api-cache',
          name: 'API Response Cache',
          description: 'Cached responses from GitHub, Jira, and analytics APIs',
          pattern: /^cache:api-.*/
        },
        {
          id: 'image-cache',
          name: 'Image Cache',
          description: 'Thumbnails and images from feeds and clips',
          pattern: /^cache:image-.*/
        },
        {
          id: 'calc-cache',
          name: 'Calculator Cache',
          description: 'Temporary calculator results and previews',
          pattern: /^cache:calc-.*/
        }
      ]
      
      const cacheInfo: CacheInfo[] = []
      
      for (const cacheType of cacheTypes) {
        const info = await analyzeCacheType(cacheType)
        cacheInfo.push(info)
      }
      
      setCaches(cacheInfo)
      setLoading(false)
    }
    
    const analyzeCacheType = async (cacheType: any): Promise<CacheInfo> => {
      const allData = await chrome.storage.local.get()
      let size = 0
      let items = 0
      let lastCleared: number | undefined
      
      Object.entries(allData).forEach(([key, value]) => {
        if (cacheType.pattern.test(key)) {
          items++
          size += new Blob([JSON.stringify(value)]).size
          
          if (value.timestamp) {
            lastCleared = Math.max(lastCleared || 0, value.timestamp)
          }
        }
      })
      
      return {
        id: cacheType.id,
        name: cacheType.name,
        description: cacheType.description,
        size,
        items,
        lastCleared
      }
    }
    
    const clearCache = async (cacheId: string) => {
      const cache = caches.find(c => c.id === cacheId)
      if (!cache) return
      
      const confirmed = await showConfirmDialog({
        title: `Clear ${cache.name}?`,
        message: `This will remove ${cache.items} cached items (${formatBytes(cache.size)}). This action cannot be undone.`,
        confirmText: 'Clear Cache',
        confirmVariant: 'destructive'
      })
      
      if (!confirmed) return
      
      setClearing(cacheId)
      
      try {
        // Clear cache based on type
        const patterns = {
          'feed-cache': /^cache:.*-feed$/,
          'api-cache': /^cache:api-.*/,
          'image-cache': /^cache:image-.*/,
          'calc-cache': /^cache:calc-.*/
        }
        
        const pattern = patterns[cacheId]
        if (pattern) {
          const allKeys = await chrome.storage.local.get()
          const keysToRemove = Object.keys(allKeys).filter(key => pattern.test(key))
          
          await chrome.storage.local.remove(keysToRemove)
          
          toast.success(`Cleared ${keysToRemove.length} items from ${cache.name}`)
        }
        
        // Refresh cache analysis
        await analyzeCaches()
      } catch (error) {
        toast.error('Failed to clear cache: ' + error.message)
      } finally {
        setClearing(null)
      }
    }
    
    const clearAllCaches = async () => {
      const totalSize = caches.reduce((sum, cache) => sum + cache.size, 0)
      const totalItems = caches.reduce((sum, cache) => sum + cache.items, 0)
      
      const confirmed = await showConfirmDialog({
        title: 'Clear All Caches?',
        message: `This will remove ${totalItems} cached items (${formatBytes(totalSize)}) from all caches. This action cannot be undone.`,
        confirmText: 'Clear All Caches',
        confirmVariant: 'destructive'
      })
      
      if (!confirmed) return
      
      setClearing('all')
      
      try {
        for (const cache of caches) {
          await clearCache(cache.id)
        }
        
        toast.success('All caches cleared successfully')
      } finally {
        setClearing(null)
      }
    }
    
    const totalSize = caches.reduce((sum, cache) => sum + cache.size, 0)
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Cache Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Clear temporary data to free up storage space and improve performance.
          </p>
        </div>
        
        {/* Total Cache Size */}
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Cache Size
              </p>
              <p className="text-2xl font-semibold">
                {formatBytes(totalSize)}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={clearAllCaches}
              disabled={clearing === 'all' || totalSize === 0}
            >
              {clearing === 'all' ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Clearing...
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Clear All
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Individual Caches */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {caches.map(cache => (
              <div
                key={cache.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{cache.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {cache.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{cache.items} items</span>
                      <span>{formatBytes(cache.size)}</span>
                      {cache.lastCleared && (
                        <span>
                          Last updated {formatTimeAgo(cache.lastCleared)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCache(cache.id)}
                    disabled={clearing === cache.id || cache.items === 0}
                  >
                    {clearing === cache.id ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      'Clear'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Cache Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium mb-3">Cache Settings</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-clear" className="cursor-pointer">
                Auto-clear old cache
                <span className="block text-sm font-normal text-gray-500">
                  Automatically remove cache older than 7 days
                </span>
              </Label>
              <Switch
                id="auto-clear"
                defaultChecked
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="cache-images" className="cursor-pointer">
                Cache images
                <span className="block text-sm font-normal text-gray-500">
                  Store images locally for faster loading
                </span>
              </Label>
              <Switch
                id="cache-images"
                defaultChecked
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
  ```

#### Ticket 7.3.2: Build Data Usage Statistics View
- **Description:** Create visualization of storage usage by category with insights
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Storage quota visualization
  - Breakdown by data type
  - Historical usage tracking
  - Growth projections
  - Optimization suggestions
- **Dependencies:** None
- **Implementation Notes:**
  ```typescript
  // src/components/settings/DataUsageStatistics.tsx
  interface StorageStats {
    total: number
    used: number
    available: number
    breakdown: {
      category: string
      size: number
      items: number
      percentage: number
    }[]
    history: {
      date: number
      used: number
    }[]
  }
  
  export function DataUsageStatistics() {
    const [stats, setStats] = useState<StorageStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    
    useEffect(() => {
      analyzeStorage()
    }, [])
    
    const analyzeStorage = async () => {
      setLoading(true)
      
      try {
        // Get storage quota
        const quota = await navigator.storage.estimate()
        
        // Analyze current usage
        const allData = await chrome.storage.local.get()
        const breakdown = await categorizeStorageUsage(allData)
        
        // Get historical data
        const history = await getStorageHistory()
        
        const totalUsed = breakdown.reduce((sum, cat) => sum + cat.size, 0)
        
        setStats({
          total: quota.quota || 0,
          used: totalUsed,
          available: (quota.quota || 0) - totalUsed,
          breakdown,
          history
        })
      } catch (error) {
        console.error('Failed to analyze storage:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const categorizeStorageUsage = async (data: any) => {
      const categories = {
        'Widget Data': {
          patterns: [/^widget-/, /calculator-history/, /clips$/],
          icon: '📊'
        },
        'Feed Cache': {
          patterns: [/^cache:.*-feed$/, /^.*-feed$/],
          icon: '📰'
        },
        'API Data': {
          patterns: [/^oauth-/, /^api-/, /^github-/, /^jira-/],
          icon: '🔌'
        },
        'Settings': {
          patterns: [/^theme-/, /^settings-/, /-config$/, /^preferences-/],
          icon: '⚙️'
        },
        'Images & Media': {
          patterns: [/^image-/, /^cache:image-/, /^clip-image-/],
          icon: '🖼️'
        },
        'Other': {
          patterns: [/.*/],
          icon: '📁'
        }
      }
      
      const categoryStats = Object.entries(categories).map(([name, config]) => ({
        category: name,
        icon: config.icon,
        size: 0,
        items: 0,
        percentage: 0
      }))
      
      // Categorize each storage item
      Object.entries(data).forEach(([key, value]) => {
        const size = new Blob([JSON.stringify(value)]).size
        
        for (let i = 0; i < categoryStats.length; i++) {
          const patterns = categories[categoryStats[i].category].patterns
          
          if (patterns.some(pattern => pattern.test(key))) {
            categoryStats[i].size += size
            categoryStats[i].items += 1
            break
          }
        }
      })
      
      // Calculate percentages
      const totalSize = categoryStats.reduce((sum, cat) => sum + cat.size, 0)
      categoryStats.forEach(cat => {
        cat.percentage = totalSize > 0 ? (cat.size / totalSize) * 100 : 0
      })
      
      // Sort by size
      return categoryStats.sort((a, b) => b.size - a.size)
    }
    
    const getStorageHistory = async (): Promise<StorageStats['history']> => {
      // Get stored history or create new
      const stored = await chrome.storage.local.get('storage-history')
      const history = stored['storage-history'] || []
      
      // Add current data point
      const today = new Date().setHours(0, 0, 0, 0)
      const todayEntry = history.find(h => h.date === today)
      
      if (!todayEntry) {
        const allData = await chrome.storage.local.get()
        const totalSize = Object.entries(allData).reduce((sum, [_, value]) => 
          sum + new Blob([JSON.stringify(value)]).size, 0
        )
        
        history.push({ date: today, used: totalSize })
        
        // Keep only last 30 days
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
        const filtered = history.filter(h => h.date > cutoff)
        
        await chrome.storage.local.set({ 'storage-history': filtered })
        return filtered
      }
      
      return history
    }
    
    if (loading) {
      return <div className="space-y-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    }
    
    if (!stats) {
      return <div>Failed to load storage statistics</div>
    }
    
    const usagePercentage = (stats.used / stats.total) * 100
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Storage Usage</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Monitor and manage your extension's data storage.
          </p>
        </div>
        
        {/* Storage Overview */}
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Storage Used
              </p>
              <p className="text-3xl font-bold">
                {formatBytes(stats.used)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                of {formatBytes(stats.total)} ({usagePercentage.toFixed(1)}%)
              </p>
            </div>
            
            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - usagePercentage / 100)}`}
                  className="text-blue-600 transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold">
                  {usagePercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Usage Trend */}
          {stats.history.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                30-Day Trend
              </p>
              <StorageHistoryChart history={stats.history} />
            </div>
          )}
        </div>
        
        {/* Category Breakdown */}
        <div>
          <h4 className="font-medium mb-3">Storage by Category</h4>
          <div className="space-y-2">
            {stats.breakdown.map((category) => (
              <button
                key={category.category}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.category ? null : category.category
                )}
                className={cn(
                  "w-full p-3 rounded-lg border transition-all",
                  "hover:shadow-sm",
                  selectedCategory === category.category
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-gray-500">
                        {category.items} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatBytes(category.size)}</p>
                    <p className="text-sm text-gray-500">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                
                {/* Expanded Details */}
                {selectedCategory === category.category && (
                  <CategoryDetails category={category.category} />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Storage Tips */}
        {usagePercentage > 80 && (
          <Alert>
            <AlertCircleIcon className="w-4 h-4" />
            <AlertTitle>Storage Nearly Full</AlertTitle>
            <AlertDescription>
              You're using {usagePercentage.toFixed(0)}% of available storage. 
              Consider clearing old data or exporting important information.
              
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateToSettings('cache')}
                >
                  Clear Cache
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateToSettings('export')}
                >
                  Export Data
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }
  ```

#### Ticket 7.3.3: Implement Data Retention Policies
- **Description:** Create system for automatic data cleanup based on age and type
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Configurable retention periods
  - Automatic cleanup scheduling
  - Data type specific policies
  - Archive before delete option
  - Cleanup notifications
- **Dependencies:** None
- **Implementation Notes:**
  ```typescript
  // src/components/settings/DataRetentionSettings.tsx
  interface RetentionPolicy {
    dataType: string
    enabled: boolean
    retentionDays: number
    action: 'delete' | 'archive'
    lastCleanup?: number
    itemsAffected?: number
  }
  
  export function DataRetentionSettings() {
    const [policies, setPolicies] = useStorage<RetentionPolicy[]>('retention-policies', [
      {
        dataType: 'calculator-history',
        enabled: false,
        retentionDays: 90,
        action: 'archive'
      },
      {
        dataType: 'feed-cache',
        enabled: true,
        retentionDays: 7,
        action: 'delete'
      },
      {
        dataType: 'web-clips',
        enabled: false,
        retentionDays: 365,
        action: 'archive'
      },
      {
        dataType: 'api-cache',
        enabled: true,
        retentionDays: 1,
        action: 'delete'
      }
    ])
    
    const [nextCleanup, setNextCleanup] = useState<Date | null>(null)
    const [isPreviewingCleanup, setIsPreviewingCleanup] = useState(false)
    const [cleanupPreview, setCleanupPreview] = useState<any>(null)
    
    useEffect(() => {
      // Check next scheduled cleanup
      chrome.alarms.get('data-cleanup', (alarm) => {
        if (alarm) {
          setNextCleanup(new Date(alarm.scheduledTime))
        }
      })
    }, [])
    
    const updatePolicy = (index: number, updates: Partial<RetentionPolicy>) => {
      setPolicies(prev => {
        const updated = [...prev]
        updated[index] = { ...updated[index], ...updates }
        return updated
      })
      
      // Update cleanup schedule
      scheduleDataCleanup()
    }
    
    const scheduleDataCleanup = async () => {
      // Clear existing alarm
      await chrome.alarms.clear('data-cleanup')
      
      // Schedule next cleanup at 3 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(3, 0, 0, 0)
      
      chrome.alarms.create('data-cleanup', {
        when: tomorrow.getTime(),
        periodInMinutes: 24 * 60 // Daily
      })
      
      setNextCleanup(tomorrow)
    }
    
    const previewCleanup = async () => {
      setIsPreviewingCleanup(true)
      
      try {
        const preview = {
          policies: [],
          totalItems: 0,
          totalSize: 0
        }
        
        for (const policy of policies) {
          if (!policy.enabled) continue
          
          const items = await getItemsForCleanup(policy)
          preview.policies.push({
            ...policy,
            itemsToClean: items.length,
            sizeToFree: items.reduce((sum, item) => sum + item.size, 0)
          })
          
          preview.totalItems += items.length
          preview.totalSize += items.reduce((sum, item) => sum + item.size, 0)
        }
        
        setCleanupPreview(preview)
      } finally {
        setIsPreviewingCleanup(false)
      }
    }
    
    const getItemsForCleanup = async (policy: RetentionPolicy) => {
      const cutoffDate = Date.now() - (policy.retentionDays * 24 * 60 * 60 * 1000)
      const items = []
      
      switch (policy.dataType) {
        case 'calculator-history':
          const types = ['rice', 'tam', 'roi', 'abtest']
          for (const type of types) {
            const history = await chrome.storage.local.get(`${type}-history`)
            if (history[`${type}-history`]) {
              const oldItems = history[`${type}-history`].filter(
                item => item.savedAt < cutoffDate
              )
              items.push(...oldItems.map(item => ({
                type,
                id: item.id,
                date: item.savedAt,
                size: new Blob([JSON.stringify(item)]).size
              })))
            }
          }
          break
          
        case 'feed-cache':
          const allData = await chrome.storage.local.get()
          Object.entries(allData).forEach(([key, value]) => {
            if (key.match(/^cache:.*-feed$/) && value.timestamp < cutoffDate) {
              items.push({
                type: 'feed',
                id: key,
                date: value.timestamp,
                size: new Blob([JSON.stringify(value)]).size
              })
            }
          })
          break
          
        case 'web-clips':
          const clips = await new ClipStorage().getAllClips()
          const oldClips = clips.filter(clip => clip.createdAt < cutoffDate)
          items.push(...oldClips.map(clip => ({
            type: 'clip',
            id: clip.id,
            date: clip.createdAt,
            size: new Blob([JSON.stringify(clip)]).size
          })))
          break
      }
      
      return items
    }
    
    const runManualCleanup = async () => {
      const confirmed = await showConfirmDialog({
        title: 'Run Data Cleanup?',
        message: `This will process ${cleanupPreview.totalItems} items based on your retention policies.`,
        confirmText: 'Run Cleanup',
        confirmVariant: 'destructive'
      })
      
      if (!confirmed) return
      
      // Execute cleanup
      await sendToBackground({
        name: 'run-data-cleanup',
        body: { policies }
      })
      
      toast.success('Data cleanup completed')
      
      // Update last cleanup times
      const updatedPolicies = policies.map(policy => ({
        ...policy,
        lastCleanup: Date.now()
      }))
      setPolicies(updatedPolicies)
      
      // Clear preview
      setCleanupPreview(null)
    }
    
    const dataTypeInfo = {
      'calculator-history': {
        name: 'Calculator History',
        description: 'Past calculations from RICE, TAM, ROI, and A/B test calculators',
        icon: '📊'
      },
      'feed-cache': {
        name: 'Feed Cache',
        description: 'Cached data from Product Hunt, Hacker News, and other feeds',
        icon: '📰'
      },
      'web-clips': {
        name: 'Web Clips',
        description: 'Saved web content and annotations',
        icon: '📎'
      },
      'api-cache': {
        name: 'API Cache',
        description: 'Cached responses from external APIs',
        icon: '🔌'
      }
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Data Retention</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure automatic cleanup of old data to manage storage space.
          </p>
        </div>
        
        {/* Next Cleanup */}
        {nextCleanup && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Next Scheduled Cleanup</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {nextCleanup.toLocaleDateString()} at {nextCleanup.toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={previewCleanup}
                disabled={isPreviewingCleanup}
              >
                {isPreviewingCleanup ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Analyzing...
                  </>
                ) : (
                  'Preview Cleanup'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Retention Policies */}
        <div className="space-y-4">
          {policies.map((policy, index) => {
            const info = dataTypeInfo[policy.dataType]
            
            return (
              <div
                key={policy.dataType}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h4 className="font-medium">{info.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {info.description}
                      </p>
                    </div>
                  </div>
                  
                  <Switch
                    checked={policy.enabled}
                    onCheckedChange={(enabled) => 
                      updatePolicy(index, { enabled })
                    }
                  />
                </div>
                
                {policy.enabled && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`${policy.dataType}-days`}>
                          Keep data for
                        </Label>
                        <Select
                          value={String(policy.retentionDays)}
                          onValueChange={(days) => 
                            updatePolicy(index, { retentionDays: parseInt(days) })
                          }
                        >
                          <SelectTrigger id={`${policy.dataType}-days`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`${policy.dataType}-action`}>
                          Then
                        </Label>
                        <Select
                          value={policy.action}
                          onValueChange={(action) => 
                            updatePolicy(index, { action: action as any })
                          }
                        >
                          <SelectTrigger id={`${policy.dataType}-action`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delete">Delete</SelectItem>
                            <SelectItem value="archive">Archive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {policy.lastCleanup && (
                      <p className="text-xs text-gray-500">
                        Last cleanup: {formatTimeAgo(policy.lastCleanup)}
                        {policy.itemsAffected && ` (${policy.itemsAffected} items)`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Cleanup Preview */}
        {cleanupPreview && (
          <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
            <h4 className="font-medium mb-3">Cleanup Preview</h4>
            
            <div className="space-y-2 text-sm">
              {cleanupPreview.policies.map(policy => (
                <div key={policy.dataType} className="flex justify-between">
                  <span>{dataTypeInfo[policy.dataType].name}</span>
                  <span>
                    {policy.itemsToClean} items ({formatBytes(policy.sizeToFree)})
                  </span>
                </div>
              ))}
              
              <div className="pt-2 border-t border-orange-200 dark:border-orange-800 font-medium">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>
                    {cleanupPreview.totalItems} items ({formatBytes(cleanupPreview.totalSize)})
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCleanupPreview(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={runManualCleanup}
              >
                Run Cleanup Now
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ Complete theme customization with live preview
- ✅ Widget default configurations
- ✅ Comprehensive import/export system
- ✅ Cache management tools
- ✅ Data retention policies

### Key Milestones:
1. **User Preferences Complete** - Theme and widget settings functional
2. **Import/Export Working** - Full backup and restore capability
3. **Data Management Ready** - Cache clearing and retention policies active
4. **Settings UI Polished** - All settings accessible with great UX

### Next Steps:
- Proceed to Epic 8: Testing & Deployment
- Add preset themes for quick selection
- Implement settings sync across devices
- Create onboarding flow for new users