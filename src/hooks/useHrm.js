import { useContext } from 'react'

import { HrmContext } from '@/context/hrm-context'

export function useHrm() {
  const context = useContext(HrmContext)

  if (!context) {
    throw new Error('useHrm must be used inside HrmProvider')
  }

  return context
}
