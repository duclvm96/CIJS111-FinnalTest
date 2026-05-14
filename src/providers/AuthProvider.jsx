import { useState } from 'react'
import { toast } from 'sonner'

import { AuthContext } from '@/context/auth-context'
import { useHrm } from '@/hooks/useHrm'
import { readStored } from '@/utils/storage'

export function AuthProvider({ children }) {
  const { accounts, employees } = useHrm()
  const [currentUser, setCurrentUser] = useState(() => readStored('hrmCurrentUser', null))

  const login = (email, password) => {
    const account = accounts.find((item) => item.email === email && item.password === password)

    if (!account) {
      toast.error('Email hoặc mật khẩu không đúng')
      return false
    }

    const nextUser =
      account.role === 'admin'
        ? {
            id: 'admin',
            employeeId: null,
            name: account.name,
            email: account.email,
            role: 'admin',
            department: 'HR',
            position: 'HR Admin',
            avatar: 'HR',
          }
        : {
            ...employees.find((employee) => employee.id === account.employeeId),
            employeeId: account.employeeId,
            role: 'user',
          }

    setCurrentUser(nextUser)
    localStorage.setItem('hrmCurrentUser', JSON.stringify(nextUser))
    toast.success(`Xin chào ${nextUser.name}`)
    return true
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('hrmCurrentUser')
    toast.info('Đã đăng xuất')
  }

  const updateCurrentUser = (patch) => {
    setCurrentUser((previousUser) => {
      if (!previousUser) {
        return previousUser
      }

      const nextUser = { ...previousUser, ...patch }
      localStorage.setItem('hrmCurrentUser', JSON.stringify(nextUser))
      return nextUser
    })
  }

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    login,
    logout,
    updateCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
