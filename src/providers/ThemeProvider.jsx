import { useEffect, useMemo, useState } from 'react'
import { Toaster } from 'sonner'

import { ThemeContext } from '@/context/theme-context'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('hrmTheme') || 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('hrmTheme', theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Toaster richColors position="top-right" theme={theme} />
    </ThemeContext.Provider>
  )
}
