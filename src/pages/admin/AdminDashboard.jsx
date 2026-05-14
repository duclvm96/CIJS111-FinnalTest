import { useMemo } from 'react'
import { CalendarDays, Clock, FileText, Users } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  MetricCard,
  PageHeader,
  PersonCell,
  StateBlock,
  StatusBadge,
} from '@/components/app/primitives'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useHrm } from '@/hooks/useHrm'
import { calculateContractStatus } from '@/utils/calculate'
import { contractTypeLabels, formatDate } from '@/utils/format'

export function AdminDashboard() {
  const { employees, attendance, leaveRequests, contracts } = useHrm()
  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])
  const pendingLeaves = leaveRequests.filter((request) => request.status === 'pending')
  const expiringContracts = contracts
    .map((contract) => ({ ...contract, computedStatus: calculateContractStatus(contract) }))
    .filter((contract) => contract.computedStatus === 'expiring')
  const today = '2026-05-13'
  const todayAttendance = attendance.filter((row) => row.date === today && row.status !== 'absent')
  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const day = 7 + index
    const date = `2026-05-${String(day).padStart(2, '0')}`
    return {
      date: `${day}/5`,
      present: attendance.filter((row) => row.date === date && row.status !== 'absent').length,
      late: attendance.filter((row) => row.date === date && row.status === 'late').length,
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard quản trị" description="Tổng quan nhân sự, đơn nghỉ phép và hợp đồng cần chú ý." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} title="Nhân viên" value={employees.length} detail="Hồ sơ trong localStorage" />
        <MetricCard icon={Clock} title="Đi làm hôm nay" value={todayAttendance.length} detail="Theo dữ liệu 13/05/2026" />
        <MetricCard icon={CalendarDays} title="Đơn chờ duyệt" value={pendingLeaves.length} detail="Cần HR xử lý" />
        <MetricCard icon={FileText} title="HĐ sắp hết hạn" value={expiringContracts.length} detail="Trong vòng 30 ngày" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Chấm công 7 ngày</CardTitle>
            <CardDescription>Đúng giờ và đi muộn theo dữ liệu demo tháng 05/2026.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="currentColor" />
                <YAxis allowDecimals={false} stroke="currentColor" />
                <Tooltip />
                <Line type="monotone" dataKey="present" name="Đi làm" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="late" name="Đi muộn" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đơn nghỉ phép chờ duyệt</CardTitle>
            <CardDescription>Ưu tiên xử lý trước buổi demo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingLeaves.slice(0, 4).map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <PersonCell employee={employeeById.get(request.employeeId)} />
                  <div className="text-right text-sm">
                    <StatusBadge type="leave" status={request.status} />
                    <p className="mt-1 text-xs text-muted-foreground">{request.days} ngày</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hợp đồng sắp hết hạn</CardTitle>
          <CardDescription>Status được tính động theo ngày hiện tại.</CardDescription>
        </CardHeader>
        <CardContent>
          {expiringContracts.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày hết hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringContracts.slice(0, 6).map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.code}</TableCell>
                    <TableCell>{employeeById.get(contract.employeeId)?.name}</TableCell>
                    <TableCell>{contractTypeLabels[contract.type]}</TableCell>
                    <TableCell>{formatDate(contract.endDate)}</TableCell>
                    <TableCell>
                      <StatusBadge type="contract" status={contract.computedStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <StateBlock icon={FileText} title="Không có hợp đồng sắp hết hạn" description="Danh sách đang ổn." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
