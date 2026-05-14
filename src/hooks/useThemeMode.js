import { useContext } from 'react'

import { ThemeContext } from '@/context/theme-context'

export function useThemeMode() {
  return useContext(ThemeContext)
}
