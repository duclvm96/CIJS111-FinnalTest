import { useState } from 'react'

import { seedData } from '@/data/seedData'

export function readStored(key, fallback) {
  seedData()
  const raw = localStorage.getItem(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback))

  const updateValue = (nextValue) => {
    setValue((previousValue) => {
      const resolvedValue = typeof nextValue === 'function' ? nextValue(previousValue) : nextValue
      localStorage.setItem(key, JSON.stringify(resolvedValue))
      return resolvedValue
    })
  }

  return [value, updateValue]
}
