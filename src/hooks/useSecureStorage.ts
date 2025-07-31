import { useCallback, useEffect, useState } from "react"
import { secureStorage } from "~/lib/storage/secureStorage"

/**
 * Hook for using secure storage with React components
 * Similar to @plasmohq/storage but with encryption
 */
export function useSecureStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await secureStorage.get<T>(key)
        if (stored !== null) {
          setValue(stored)
        }
      } catch (error) {
        console.error(`Failed to load secure value for ${key}:`, error)
      } finally {
        setLoading(false)
      }
    }

    loadValue()
  }, [key])

  // Update value function
  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      try {
        const resolvedValue =
          typeof newValue === "function" ? (newValue as (prev: T) => T)(value) : newValue

        // Update local state immediately
        setValue(resolvedValue)

        // Persist to secure storage
        await secureStorage.set(key, resolvedValue)
      } catch (error) {
        console.error(`Failed to update secure value for ${key}:`, error)
        // Revert on error
        setValue(value)
        throw error
      }
    },
    [key, value]
  )

  return [value, updateValue, loading]
}

/**
 * Hook for managing multiple secure storage values
 */
export function useSecureStorageMultiple<T extends Record<string, unknown>>(
  keys: string[],
  defaultValues: T
): {
  values: T
  setValues: (updates: Partial<T>) => Promise<void>
  loading: boolean
  errors: Record<string, Error>
} {
  const [values, setValuesState] = useState<T>(defaultValues)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, Error>>({})

  // Load all values
  useEffect(() => {
    const loadValues = async () => {
      const loadedValues: Partial<T> = {}
      const loadErrors: Record<string, Error> = {}

      await Promise.all(
        keys.map(async (key) => {
          try {
            const value = await secureStorage.get(key)
            if (value !== null) {
              loadedValues[key as keyof T] = value
            }
          } catch (error) {
            loadErrors[key] = error as Error
          }
        })
      )

      setValuesState((prev) => ({ ...prev, ...loadedValues }))
      setErrors(loadErrors)
      setLoading(false)
    }

    loadValues()
  }, [keys])

  // Update multiple values
  const setValues = useCallback(
    async (updates: Partial<T>) => {
      const updateErrors: Record<string, Error> = {}

      // Update state optimistically
      setValuesState((prev) => ({ ...prev, ...updates }))

      // Persist each update
      await Promise.all(
        Object.entries(updates).map(async ([key, value]) => {
          try {
            await secureStorage.set(key, value)
          } catch (error) {
            updateErrors[key] = error as Error
          }
        })
      )

      if (Object.keys(updateErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...updateErrors }))
        // Revert failed updates
        const revertedValues = { ...values }
        Object.keys(updateErrors).forEach((key) => {
          delete revertedValues[key as keyof T]
        })
        setValuesState(revertedValues)
      }
    },
    [values]
  )

  return { values, setValues, loading, errors }
}

/**
 * Hook for checking if a secure key exists
 */
export function useSecureStorageExists(key: string): [boolean, boolean] {
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkExists = async () => {
      try {
        const hasKey = await secureStorage.has(key)
        setExists(hasKey)
      } catch (error) {
        console.error(`Failed to check if secure key ${key} exists:`, error)
      } finally {
        setLoading(false)
      }
    }

    checkExists()
  }, [key])

  return [exists, loading]
}
