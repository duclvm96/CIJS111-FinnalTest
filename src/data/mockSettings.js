export const defaultAttendanceSettings = {
  workStartTime: '08:00',
  workEndTime: '17:30',
  lateThresholdMinutes: 15,
  earlyLeaveThresholdMinutes: 15,
  standardWorkHours: 8,
  weekendOffSaturday: true,
  weekendOffSunday: true,
  autoMarkAbsent: true,
}

export const defaultPayrollSettings = {
  standardWorkingDays: 22,
  latePenalty: 50000,
  absentPenalty: 200000,
  attendanceBonus: 500000,
  overtimeMultiplier: 1.5,
  weekendMultiplier: 2,
}

export const defaultLeaveSettings = {
  annualLeaveQuota: 12,
  sickLeaveQuota: 5,
  minAdvanceDays: 1,
  maxConsecutiveDays: 7,
  allowCarryOver: false,
  leaveTypes: ['annual', 'sick', 'unpaid', 'personal'],
}
