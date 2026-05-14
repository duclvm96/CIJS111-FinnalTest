function timeToMinutes(value) {
  if (!value) {
    return null
  }

  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

export function calculateWorkHours(checkIn, checkOut) {
  const start = timeToMinutes(checkIn)
  const end = timeToMinutes(checkOut)

  if (start === null || end === null || end <= start) {
    return 0
  }

  return Number(((end - start) / 60).toFixed(1))
}

export function calculateAttendanceStatus(record, settings) {
  if (!record.checkIn) {
    return 'absent'
  }

  if (!record.checkOut) {
    return 'pending_checkout'
  }

  const checkIn = timeToMinutes(record.checkIn)
  const checkOut = timeToMinutes(record.checkOut)
  const start = timeToMinutes(settings.workStartTime)
  const end = timeToMinutes(settings.workEndTime)

  if (checkIn > start + Number(settings.lateThresholdMinutes || 0)) {
    return 'late'
  }

  if (checkOut < end - Number(settings.earlyLeaveThresholdMinutes || 0)) {
    return 'early_leave'
  }

  return 'on_time'
}

export function calculateContractStatus(contract, today = new Date()) {
  if (contract.status === 'terminated') {
    return 'terminated'
  }

  if (!contract.endDate) {
    return 'active'
  }

  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(`${contract.endDate}T00:00:00`)
  const daysLeft = Math.ceil((end - current) / 86400000)

  if (daysLeft < 0) {
    return 'expired'
  }

  if (daysLeft <= 30) {
    return 'expiring'
  }

  return 'active'
}

export function calculateLeaveDays(fromDate, toDate) {
  if (!fromDate || !toDate) {
    return 0
  }

  const start = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0
  }

  return Math.floor((end - start) / 86400000) + 1
}

export function calculateRemainingAnnualLeave(employeeId, leaveRequests, settings) {
  const used = leaveRequests
    .filter((request) => request.employeeId === employeeId && request.type === 'annual' && request.status === 'approved')
    .reduce((total, request) => total + Number(request.days || 0), 0)

  return Math.max(0, Number(settings.annualLeaveQuota || 0) - used)
}

export function calculatePayroll(employee, attendanceRows, payrollEntry, settings) {
  const onPayrollStatuses = ['on_time', 'late', 'leave', 'early_leave']
  const actualDays = attendanceRows.filter((row) => onPayrollStatuses.includes(row.status)).length
  const lateCount = attendanceRows.filter((row) => row.status === 'late').length
  const absentDays = attendanceRows.filter((row) => row.status === 'absent').length
  const manualBonus = Number(payrollEntry?.bonus || 0)
  const manualPenalty = Number(payrollEntry?.penalty || 0)
  const attendanceBonus = actualDays >= Number(settings.standardWorkingDays || 22) && lateCount === 0 ? Number(settings.attendanceBonus || 0) : 0
  const basePart = Number(employee.baseSalary || 0) * (actualDays / Number(settings.standardWorkingDays || 22))
  // công thức demo đọc settings để admin đổi quy tắc và thấy lương cập nhật ngay
  const total =
    basePart +
    attendanceBonus +
    manualBonus -
    Number(settings.latePenalty || 0) * lateCount -
    Number(settings.absentPenalty || 0) * absentDays -
    manualPenalty

  return {
    workingDays: Number(settings.standardWorkingDays || 22),
    actualDays,
    lateCount,
    absentDays,
    bonus: manualBonus,
    penalty: manualPenalty,
    attendanceBonus,
    total: Math.max(0, Math.round(total)),
    status: payrollEntry?.status || 'calculated',
  }
}
