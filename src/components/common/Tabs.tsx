import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

export function Tabs({ value, defaultValue, onValueChange, className = "", children }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  const activeValue = value !== undefined ? value : internalValue

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [value, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={`tabs ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps {
  className?: string
  children: React.ReactNode
}

export function TabsList({ className = "", children }: TabsListProps) {
  return (
    <div
      className={`tabs-list flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg ${className}`}
      role="tablist"
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps {
  value: string
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

export function TabsTrigger({
  value,
  className = "",
  disabled = false,
  children,
}: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs")
  }

  const { value: activeValue, onValueChange } = context
  const isActive = activeValue === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      className={`
        tabs-trigger relative px-4 py-2 text-sm font-medium rounded-md
        transition-all duration-200 ease-in-out
        ${
          isActive
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
        ${className}
      `}
      onClick={() => !disabled && onValueChange(value)}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
  forceMount?: boolean
}

export function TabsContent({
  value,
  className = "",
  children,
  forceMount = false,
}: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("TabsContent must be used within Tabs")
  }

  const { value: activeValue } = context
  const isActive = activeValue === value

  if (!isActive && !forceMount) {
    return null
  }

  return (
    <div
      role="tabpanel"
      className={`
        tabs-content mt-6
        ${isActive ? "block" : "hidden"}
        ${className}
      `}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

export interface TabsIndicatorProps {
  className?: string
}

export function TabsIndicator({ className = "" }: TabsIndicatorProps) {
  const context = useContext(TabsContext)
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!context) return

    const activeTab = document.querySelector(`[aria-selected="true"]`) as HTMLElement
    if (activeTab) {
      const { offsetLeft, offsetWidth } = activeTab
      setIndicatorStyle({
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
      })
    }
  }, [context?.value, context])

  if (!context) return null

  return (
    <div
      className={`absolute bottom-0 h-0.5 bg-indigo-500 transition-all duration-200 ${className}`}
      style={indicatorStyle}
    />
  )
}
