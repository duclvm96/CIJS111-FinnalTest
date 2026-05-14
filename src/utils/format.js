export const attendanceStatusLabels = {
  on_time: 'Đúng giờ',
  late: 'Đi muộn',
  absent: 'Vắng mặt',
  leave: 'Nghỉ phép',
  pending_checkout: 'Chưa check-out',
  early_leave: 'Về sớm',
}

export const leaveStatusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
}

export const leaveTypeLabels = {
  annual: 'Phép năm',
  sick: 'Ốm',
  unpaid: 'Không lương',
  personal: 'Việc riêng',
}

export const contractTypeLabels = {
  probation: 'Thử việc',
  fixed_term: 'Xác định thời hạn',
  indefinite: 'Không xác định thời hạn',
}

export const contractStatusLabels = {
  active: 'Còn hiệu lực',
  expiring: 'Sắp hết hạn',
  expired: 'Đã hết hạn',
  terminated: 'Đã chấm dứt',
}

export const payrollStatusLabels = {
  draft: 'Đang tính',
  calculated: 'Đã tính',
  approved: 'Đã duyệt',
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatMonth(value) {
  if (!value) {
    return '—'
  }

  const [year, month] = value.split('-')
  return `Tháng ${month}/${year}`
}
