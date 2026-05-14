import { accounts, attendance, contracts, employees, leaveRequests, payroll, performance } from './mockData'
import { defaultAttendanceSettings, defaultLeaveSettings, defaultPayrollSettings } from './mockSettings'

const HRM_KEYS = [
  'employees',
  'attendance',
  'leaveRequests',
  'payroll',
  'performance',
  'contracts',
  'accounts',
  'attendanceSettings',
  'payrollSettings',
  'leaveSettings',
]

export function seedData(force = false) {
  if (!force && localStorage.getItem('employees')) {
    return
  }

  localStorage.setItem('employees', JSON.stringify(employees))
  localStorage.setItem('attendance', JSON.stringify(attendance))
  localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests))
  localStorage.setItem('payroll', JSON.stringify(payroll))
  localStorage.setItem('performance', JSON.stringify(performance))
  localStorage.setItem('contracts', JSON.stringify(contracts))
  localStorage.setItem('accounts', JSON.stringify(accounts))
  localStorage.setItem('attendanceSettings', JSON.stringify(defaultAttendanceSettings))
  localStorage.setItem('payrollSettings', JSON.stringify(defaultPayrollSettings))
  localStorage.setItem('leaveSettings', JSON.stringify(defaultLeaveSettings))
}

export function resetData() {
  HRM_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem('hrmCurrentUser')
  seedData(true)
}
