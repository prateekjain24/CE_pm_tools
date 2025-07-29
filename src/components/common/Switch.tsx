import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  description?: string
  error?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, error, className = "", id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            className={`
              h-4 w-4 rounded border-gray-300 text-primary-600 
              focus:ring-primary-500 disabled:cursor-not-allowed 
              disabled:opacity-50 ${className}
            `}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label htmlFor={switchId} className="font-medium text-gray-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && <p className="text-gray-500">{description}</p>}
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>
        )}
      </div>
    )
  }
)

Switch.displayName = "Switch"

// Toggle variant with sliding animation
interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  description?: string
  size?: "sm" | "md" | "lg"
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, size = "md", className = "", id, checked, onChange, ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`

    const sizeStyles = {
      sm: { toggle: "h-5 w-9", dot: "h-3 w-3", translate: "translate-x-4" },
      md: { toggle: "h-6 w-11", dot: "h-4 w-4", translate: "translate-x-5" },
      lg: { toggle: "h-7 w-14", dot: "h-5 w-5", translate: "translate-x-7" },
    }

    const styles = sizeStyles[size]

    return (
      <div className="flex items-start">
        <div className="relative">
          <input
            ref={ref}
            id={toggleId}
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <label
            htmlFor={toggleId}
            className={`
              ${styles.toggle} 
              bg-gray-200 rounded-full cursor-pointer transition-colors
              ${checked ? "bg-primary-600" : ""}
              ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <span
              className={`
                ${styles.dot}
                bg-white rounded-full shadow-sm transition-transform
                inline-block mt-1 ml-1
                ${checked ? styles.translate : "translate-x-0"}
              `}
            />
          </label>
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label htmlFor={toggleId} className="font-medium text-gray-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && <p className="text-gray-500">{description}</p>}
          </div>
        )}
      </div>
    )
  }
)

Toggle.displayName = "Toggle"
