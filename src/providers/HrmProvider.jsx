import { HrmContext } from '@/context/hrm-context'
import { resetData } from '@/data/seedData'
import { readStored, useStoredState } from '@/utils/storage'

export function HrmProvider({ children }) {
  const [employees, setEmployees] = useStoredState('employees', [])
  const [attendance, setAttendance] = useStoredState('attendance', [])
  const [leaveRequests, setLeaveRequests] = useStoredState('leaveRequests', [])
  const [payroll, setPayroll] = useStoredState('payroll', [])
  const [performance, setPerformance] = useStoredState('performance', [])
  const [contracts, setContracts] = useStoredState('contracts', [])
  const [accounts, setAccounts] = useStoredState('accounts', [])
  const [attendanceSettings, setAttendanceSettings] = useStoredState('attendanceSettings', {})
  const [payrollSettings, setPayrollSettings] = useStoredState('payrollSettings', {})
  const [leaveSettings, setLeaveSettings] = useStoredState('leaveSettings', {})

  const resetDemoData = () => {
    resetData()
    setEmployees(readStored('employees', []))
    setAttendance(readStored('attendance', []))
    setLeaveRequests(readStored('leaveRequests', []))
    setPayroll(readStored('payroll', []))
    setPerformance(readStored('performance', []))
    setContracts(readStored('contracts', []))
    setAccounts(readStored('accounts', []))
    setAttendanceSettings(readStored('attendanceSettings', {}))
    setPayrollSettings(readStored('payrollSettings', {}))
    setLeaveSettings(readStored('leaveSettings', {}))
  }

  const value = {
    accounts,
    attendance,
    attendanceSettings,
    contracts,
    employees,
    leaveRequests,
    leaveSettings,
    payroll,
    payrollSettings,
    performance,
    resetDemoData,
    setAccounts,
    setAttendance,
    setAttendanceSettings,
    setContracts,
    setEmployees,
    setLeaveRequests,
    setLeaveSettings,
    setPayroll,
    setPayrollSettings,
    setPerformance,
  }

  return <HrmContext.Provider value={value}>{children}</HrmContext.Provider>
}
