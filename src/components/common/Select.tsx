import type { ReactNode, SelectHTMLAttributes } from "react"
import { forwardRef } from "react"

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  fullWidth?: boolean
  placeholder?: string
  children?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      fullWidth = false,
      placeholder = "Select an option",
      className = "",
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    const baseStyles =
      "block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
    const errorStyles = error
      ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
      : ""
    const widthStyles = fullWidth ? "w-full" : ""

    const selectClasses = [baseStyles, errorStyles, widthStyles, className]
      .filter(Boolean)
      .join(" ")

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <select ref={ref} id={selectId} className={selectClasses} {...props}>
          {placeholder && !children && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children ||
            options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
        </select>

        {(error || helperText) && (
          <p className={`mt-1 text-sm ${error ? "text-red-600" : "text-gray-500"}`}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = "Select"
