import type { ReactNode } from "react"
import { Switch } from "../common"

interface FormFieldProps {
  label: string
  id: string
  children: ReactNode
  description?: string
}

export function FormField({ label, id, children, description }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      {children}
      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  )
}

interface FormSectionProps {
  title: string
  children: ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h4>
      {children}
    </div>
  )
}

interface SwitchFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}

export function SwitchField({ label, checked, onChange, description }: SwitchFieldProps) {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <Switch checked={checked} onChange={onChange} />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      {description && (
        <p className="mt-1 ml-8 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  )
}
