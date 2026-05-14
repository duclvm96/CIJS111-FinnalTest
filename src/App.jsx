import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  Sun,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Field,
  FilterSelect,
  MetricCard,
  NativeSelect,
  PageHeader,
  PersonCell,
  StateBlock,
  StatusBadge,
  TableSkeleton,
} from '@/components/app/primitives'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { departments as defaultDepartments } from '@/data/mockData'
import { seedData } from '@/data/seedData'
import { useAuth } from '@/hooks/useAuth'
import { useHrm } from '@/hooks/useHrm'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useThemeMode } from '@/hooks/useThemeMode'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { EmployeePage } from '@/pages/admin/EmployeePage'
import { AuthProvider } from '@/providers/AuthProvider'
import { HrmProvider } from '@/providers/HrmProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { readStored } from '@/utils/storage'
import {
  calculateAttendanceStatus,
  calculateContractStatus,
  calculateLeaveDays,
  calculatePayroll,
  calculateRemainingAnnualLeave,
  calculateWorkHours,
} from '@/utils/calculate'
import {
  attendanceStatusLabels,
  contractStatusLabels,
  contractTypeLabels,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMonth,
  leaveStatusLabels,
  leaveTypeLabels,
} from '@/utils/format'

const attendanceSettingsSchema = z
  .object({
    workStartTime: z.string().min(1, 'Bắt buộc'),
    workEndTime: z.string().min(1, 'Bắt buộc'),
    lateThresholdMinutes: z.coerce.number().min(0).max(60),
    earlyLeaveThresholdMinutes: z.coerce.number().min(0).max(60),
    standardWorkHours: z.coerce.number().positive(),
    weekendOffSaturday: z.boolean(),
    weekendOffSunday: z.boolean(),
    autoMarkAbsent: z.boolean(),
  })
  .refine((data) => data.workEndTime > data.workStartTime, {
    message: 'Giờ kết thúc phải sau giờ bắt đầu',
    path: ['workEndTime'],
  })

const payrollSettingsSchema = z.object({
  standardWorkingDays: z.coerce.number().min(1),
  latePenalty: z.coerce.number().min(0),
  absentPenalty: z.coerce.number().min(0),
  attendanceBonus: z.coerce.number().min(0),
  overtimeMultiplier: z.coerce.number().min(1),
  weekendMultiplier: z.coerce.number().min(1),
})

const leaveSettingsSchema = z.object({
  annualLeaveQuota: z.coerce.number().min(0),
  sickLeaveQuota: z.coerce.number().min(0),
  minAdvanceDays: z.coerce.number().min(0),
  maxConsecutiveDays: z.coerce.number().min(1),
  allowCarryOver: z.boolean(),
  leaveTypes: z.array(z.string()).min(1, 'Chọn ít nhất 1 loại nghỉ'),
})

const attendanceEditSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
})

const bonusSchema = z.object({
  bonus: z.coerce.number().min(0),
  penalty: z.coerce.number().min(0),
})

const reviewSchema = z.object({
  cycle: z.string().min(4, 'Kỳ đánh giá bắt buộc'),
  efficiency: z.coerce.number().min(1).max(5),
  discipline: z.coerce.number().min(1).max(5),
  teamwork: z.coerce.number().min(1).max(5),
  attitude: z.coerce.number().min(1).max(5),
  kpi: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, 'Nhận xét tối thiểu 10 ký tự'),
})

const leaveRequestSchema = z.object({
  type: z.string().min(1, 'Chọn loại nghỉ'),
  fromDate: z.string().min(1, 'Chọn ngày bắt đầu'),
  toDate: z.string().min(1, 'Chọn ngày kết thúc'),
  reason: z.string().min(10, 'Lý do tối thiểu 10 ký tự'),
})

const contractSchema = z.object({
  employeeId: z.coerce.number().min(1, 'Chọn nhân viên'),
  type: z.enum(['probation', 'fixed_term', 'indefinite']),
  startDate: z.string().min(1, 'Ngày bắt đầu bắt buộc'),
  endDate: z.string().optional(),
  contractSalary: z.coerce.number().positive('Lương hợp đồng phải lớn hơn 0'),
  position: z.string().min(2, 'Vị trí bắt buộc'),
  terms: z.string().min(10, 'Điều khoản tối thiểu 10 ký tự'),
  attachmentName: z.string().min(3, 'Tên file bắt buộc'),
})

const profileSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Số điện thoại phải có 10 số'),
  address: z.string().min(5, 'Địa chỉ tối thiểu 5 ký tự'),
})

function RequireAuth({ role, children }) {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />
  }

  if (role && currentUser.role !== role) {
    return <Navigate replace to={currentUser.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />
  }

  return children
}

function RootRedirect() {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate replace to="/login" />
  }

  return <Navigate replace to={currentUser.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />
}

function LoginPage() {
  const { login, currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('admin@company.com')
  const [password, setPassword] = useState('admin123')

  if (currentUser) {
    return <Navigate replace to={currentUser.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />
  }

  const submitLogin = (event) => {
    event.preventDefault()

    if (login(email, password)) {
      const fallback = email === 'admin@company.com' ? '/admin/dashboard' : '/user/dashboard'
      navigate(location.state?.from || fallback, { replace: true })
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
            <Shield className="size-4 text-primary" />
            HRM Final Demo
          </div>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">Bảng điều hành nhân sự cho demo cuối khóa.</h1>
            <p className="text-base text-muted-foreground">
              Quản lý nhân viên, chấm công, lương, đánh giá, nghỉ phép và hợp đồng bằng dữ liệu mock lưu localStorage.
            </p>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ['6', 'module admin'],
              ['7', 'trang nhân viên'],
              ['16', 'hồ sơ demo'],
            ].map(([value, label]) => (
              <Card key={label} className="rounded-lg">
                <CardContent className="py-2">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md rounded-xl border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
            <CardDescription>Chọn nhanh tài khoản demo hoặc nhập email/mật khẩu.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitLogin}>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEmail('admin@company.com')
                    setPassword('admin123')
                  }}
                >
                  <Shield className="size-4" />
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEmail('a.nguyen@company.com')
                    setPassword('123456')
                  }}
                >
                  <UserRound className="size-4" />
                  Nhân viên
                </Button>
              </div>
              <Field label="Email">
                <Input autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@company.com" />
              </Field>
              <Field label="Mật khẩu">
                <Input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="admin123" />
              </Field>
              <Button className="w-full" type="submit" size="lg">
                Đăng nhập
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { to: '/admin/employees', label: 'Nhân viên', icon: Users },
  { to: '/admin/attendance', label: 'Chấm công', icon: Clock },
  { to: '/admin/payroll', label: 'Lương', icon: DollarSign },
  { to: '/admin/performance', label: 'Đánh giá', icon: BadgeCheck },
  { to: '/admin/leave', label: 'Nghỉ phép', icon: CalendarDays },
  { to: '/admin/contracts', label: 'Hợp đồng', icon: FileText },
]

const userNav = [
  { to: '/user/dashboard', label: 'Dashboard', icon: Home },
  { to: '/user/profile', label: 'Hồ sơ', icon: UserRound },
  { to: '/user/attendance', label: 'Chấm công', icon: Clock },
  { to: '/user/payroll', label: 'Lương', icon: DollarSign },
  { to: '/user/performance', label: 'Đánh giá', icon: BadgeCheck },
  { to: '/user/leave', label: 'Nghỉ phép', icon: CalendarDays },
  { to: '/user/contract', label: 'Hợp đồng', icon: FileText },
]

function NavList({ items }) {
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function AppSidebar({ role }) {
  const items = role === 'admin' ? adminNav : userNav

  return (
    <aside className="hidden min-h-screen w-64 border-r bg-card/70 p-4 lg:block">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground">
          <Building2 className="size-5" />
        </div>
        <div>
          <p className="font-semibold">MinX HRM</p>
          <p className="text-xs text-muted-foreground">{role === 'admin' ? 'Admin console' : 'Employee portal'}</p>
        </div>
      </div>
      <NavList items={items} />
    </aside>
  )
}

function AppHeader({ role }) {
  const { currentUser, logout } = useAuth()
  const { resetDemoData } = useHrm()
  const { theme, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const items = role === 'admin' ? adminNav : userNav

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="size-4" />
            <span className="sr-only">Mở menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>MinX HRM</SheetTitle>
            <SheetDescription>{role === 'admin' ? 'Admin console' : 'Employee portal'}</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <NavList items={items} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground md:flex">
        <Search className="size-4" />
        Tìm nhanh theo tên, email, mã nhân viên trong từng module
      </div>

      {role === 'admin' ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RefreshCcw className="size-4" />
              Reset demo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <RefreshCcw />
              </AlertDialogMedia>
              <AlertDialogTitle>Khôi phục dữ liệu demo?</AlertDialogTitle>
              <AlertDialogDescription>Dữ liệu trong localStorage sẽ quay về seed ban đầu và bạn sẽ cần đăng nhập lại.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  resetDemoData()
                  logout()
                  toast.success('Đã reset dữ liệu demo')
                  navigate('/login', { replace: true })
                }}
              >
                Khôi phục
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <Button variant="outline" size="icon" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        <span className="sr-only">Đổi theme</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 px-2">
            <Avatar size="sm">
              <AvatarFallback>{currentUser?.avatar || 'U'}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm sm:inline">{currentUser?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="size-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

function AppLayout({ role }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <AppSidebar role={role} />
        <div className="min-w-0 flex-1">
          <AppHeader role={role} />
          <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

function AttendancePage() {
  const { attendance, employees, attendanceSettings, setAttendance, setAttendanceSettings } = useHrm()
  const loading = usePageLoading()
  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [month, setMonth] = useState('2026-05')
  const [editingRow, setEditingRow] = useState(null)

  const enrichedRows = attendance
    .filter((row) => row.date.startsWith(month))
    .map((row) => {
      const employee = employeeById.get(row.employeeId)
      const computedStatus = row.status === 'leave' ? 'leave' : calculateAttendanceStatus(row, attendanceSettings)
      return { ...row, employee, status: computedStatus, hours: calculateWorkHours(row.checkIn, row.checkOut) }
    })
    .filter((row) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch = !keyword || row.employee?.name.toLowerCase().includes(keyword) || row.employee?.code.toLowerCase().includes(keyword)
      const matchesDepartment = department === 'all' || row.employee?.department === department
      const matchesStatus = status === 'all' || row.status === status
      return matchesSearch && matchesDepartment && matchesStatus
    })

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý chấm công" description="Danh sách chấm công theo tháng và settings lưu vào localStorage key attendanceSettings." />
      <Tabs defaultValue="list">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="list">Danh sách</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 md:grid-cols-[auto_1fr_auto_auto]">
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="md:w-40" />
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                  <Input className="pl-8" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm nhân viên..." />
                </div>
                <FilterSelect
                  value={department}
                  onValueChange={setDepartment}
                  options={[{ value: 'all', label: 'Tất cả phòng ban' }, ...defaultDepartments.map((item) => ({ value: item, label: item }))]}
                />
                <FilterSelect
                  value={status}
                  onValueChange={setStatus}
                  options={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    ...Object.entries(attendanceStatusLabels).map(([value, label]) => ({ value, label })),
                  ]}
                />
              </div>

              {loading ? (
                <TableSkeleton cols={7} />
              ) : enrichedRows.length === 0 ? (
                <StateBlock
                  title="Không tìm thấy kết quả phù hợp"
                  description="Đổi tháng hoặc xóa bớt bộ lọc."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setDepartment('all')
                        setStatus('all')
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Tổng giờ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Sửa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedRows.slice(0, 80).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell>
                          <PersonCell employee={row.employee} />
                        </TableCell>
                        <TableCell>{row.checkIn || '—'}</TableCell>
                        <TableCell>{row.checkOut || '—'}</TableCell>
                        <TableCell>{row.hours}h</TableCell>
                        <TableCell>
                          <StatusBadge type="attendance" status={row.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setEditingRow(row)}>
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <AttendanceEditDialog
            row={editingRow}
            open={Boolean(editingRow)}
            onOpenChange={(open) => !open && setEditingRow(null)}
            onSubmit={(values) => {
              setAttendance((current) =>
                current.map((row) =>
                  row.id === editingRow.id
                    ? {
                        ...row,
                        checkIn: values.checkIn || '',
                        checkOut: values.checkOut || '',
                        status: calculateAttendanceStatus({ ...row, ...values }, attendanceSettings),
                      }
                    : row,
                ),
              )
              toast.success('Đã cập nhật chấm công')
              setEditingRow(null)
            }}
          />
        </TabsContent>
        <TabsContent value="settings">
          <AttendanceSettingsForm settings={attendanceSettings} onSave={setAttendanceSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AttendanceEditDialog({ row, open, onOpenChange, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(attendanceEditSchema),
    defaultValues: { checkIn: row?.checkIn || '', checkOut: row?.checkOut || '' },
  })

  useEffect(() => {
    form.reset({ checkIn: row?.checkIn || '', checkOut: row?.checkOut || '' })
  }, [row, open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Sửa chấm công</DialogTitle>
            <DialogDescription>{row?.employee?.name} · {formatDate(row?.date)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field label="Check-in" error={form.formState.errors.checkIn}>
              <Input type="time" {...form.register('checkIn')} />
            </Field>
            <Field label="Check-out" error={form.formState.errors.checkOut}>
              <Input type="time" {...form.register('checkOut')} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AttendanceSettingsForm({ settings, onSave }) {
  const form = useForm({
    resolver: zodResolver(attendanceSettingsSchema),
    defaultValues: settings,
  })
  const saturday = useWatch({ control: form.control, name: 'weekendOffSaturday' })
  const sunday = useWatch({ control: form.control, name: 'weekendOffSunday' })
  const autoAbsent = useWatch({ control: form.control, name: 'autoMarkAbsent' })

  useEffect(() => {
    form.reset(settings)
  }, [settings, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thiết lập quy tắc chấm công</CardTitle>
        <CardDescription>Lưu vào localStorage key attendanceSettings và áp dụng lại status trên bảng.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            onSave(values)
            toast.success('Đã lưu cấu hình chấm công')
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Giờ bắt đầu" error={form.formState.errors.workStartTime}>
              <Input type="time" {...form.register('workStartTime')} />
            </Field>
            <Field label="Giờ kết thúc" error={form.formState.errors.workEndTime}>
              <Input type="time" {...form.register('workEndTime')} />
            </Field>
            <Field label="Ngưỡng đi muộn (phút)" error={form.formState.errors.lateThresholdMinutes}>
              <Input type="number" {...form.register('lateThresholdMinutes')} />
            </Field>
            <Field label="Ngưỡng về sớm (phút)" error={form.formState.errors.earlyLeaveThresholdMinutes}>
              <Input type="number" {...form.register('earlyLeaveThresholdMinutes')} />
            </Field>
            <Field label="Công chuẩn 1 ngày (giờ)" error={form.formState.errors.standardWorkHours}>
              <Input type="number" {...form.register('standardWorkHours')} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SwitchSetting label="Nghỉ thứ 7" checked={saturday} onCheckedChange={(value) => form.setValue('weekendOffSaturday', value)} />
            <SwitchSetting label="Nghỉ chủ nhật" checked={sunday} onCheckedChange={(value) => form.setValue('weekendOffSunday', value)} />
            <SwitchSetting label="Auto vắng cuối ngày" checked={autoAbsent} onCheckedChange={(value) => form.setValue('autoMarkAbsent', value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              <Save className="size-4" />
              Lưu thay đổi
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  Khôi phục mặc định
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <RefreshCcw />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Khôi phục settings chấm công?</AlertDialogTitle>
                  <AlertDialogDescription>Quy tắc hiện tại sẽ bị thay bằng giá trị mặc định.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      seedData(true)
                      const defaults = readStored('attendanceSettings', settings)
                      onSave(defaults)
                      toast.success('Đã khôi phục settings chấm công')
                    }}
                  >
                    Khôi phục
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function SwitchSetting({ label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label>{label}</Label>
      <Switch checked={Boolean(checked)} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function PayrollPage() {
  const { employees, attendance, payroll, payrollSettings, setPayroll, setPayrollSettings } = useHrm()
  const loading = usePageLoading()
  const [month, setMonth] = useState('2026-05')
  const [department, setDepartment] = useState('all')
  const [bonusEmployee, setBonusEmployee] = useState(null)
  const [detailRow, setDetailRow] = useState(null)

  const payrollRows = employees
    .filter((employee) => department === 'all' || employee.department === department)
    .map((employee) => {
      const entry = payroll.find((row) => row.employeeId === employee.id && row.month === month)
      const monthAttendance = attendance.filter((row) => row.employeeId === employee.id && row.date.startsWith(month))
      return {
        employee,
        entry,
        month,
        ...calculatePayroll(employee, monthAttendance, entry, payrollSettings),
      }
    })

  const approvePayroll = () => {
    setPayroll((current) => {
      const existingKeys = new Set(current.map((row) => `${row.employeeId}-${row.month}`))
      const additions = payrollRows
        .filter((row) => !existingKeys.has(`${row.employee.id}-${row.month}`))
        .map((row) => ({
          id: Date.now() + row.employee.id,
          employeeId: row.employee.id,
          month: row.month,
          baseSalary: row.employee.baseSalary,
          ...row,
          status: 'approved',
        }))

      return current
        .map((row) => (row.month === month ? { ...row, status: 'approved' } : row))
        .concat(additions)
    })
    toast.success('Đã duyệt bảng lương')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý lương thưởng" description="Tính lương từ chấm công và payrollSettings trong localStorage." />
      <Tabs defaultValue="payroll">
        <TabsList>
          <TabsTrigger value="payroll">Bảng lương</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="payroll">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="sm:w-40" />
                  <FilterSelect
                    value={department}
                    onValueChange={setDepartment}
                    options={[{ value: 'all', label: 'Tất cả phòng ban' }, ...defaultDepartments.map((item) => ({ value: item, label: item }))]}
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>
                      <CheckCircle2 className="size-4" />
                      Duyệt bảng lương
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia>
                        <DollarSign />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Duyệt bảng lương {formatMonth(month)}?</AlertDialogTitle>
                      <AlertDialogDescription>Sau khi duyệt, demo sẽ khóa trạng thái tháng này ở mức approved.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={approvePayroll}>Duyệt</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {loading ? (
                <TableSkeleton cols={7} />
              ) : payrollRows.length === 0 ? (
                <StateBlock icon={DollarSign} title="Chưa có bảng lương" description="Chọn tháng khác hoặc kiểm tra dữ liệu nhân viên." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Lương cơ bản</TableHead>
                      <TableHead>Công thực tế</TableHead>
                      <TableHead>Thưởng</TableHead>
                      <TableHead>Phạt</TableHead>
                      <TableHead>Tổng lương</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRows.map((row) => (
                      <TableRow key={row.employee.id}>
                        <TableCell>
                          <PersonCell employee={row.employee} />
                        </TableCell>
                        <TableCell>{formatCurrency(row.employee.baseSalary)}</TableCell>
                        <TableCell>{row.actualDays}/{row.workingDays}</TableCell>
                        <TableCell>{formatCurrency(row.bonus + row.attendanceBonus)}</TableCell>
                        <TableCell>{formatCurrency(row.penalty + row.lateCount * payrollSettings.latePenalty + row.absentDays * payrollSettings.absentPenalty)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(row.total)}</TableCell>
                        <TableCell>
                          <StatusBadge type="payroll" status={row.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDetailRow(row)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" disabled={row.status === 'approved'} onClick={() => setBonusEmployee(row)}>
                            <Plus className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <BonusPenaltyDialog
            row={bonusEmployee}
            open={Boolean(bonusEmployee)}
            onOpenChange={(open) => !open && setBonusEmployee(null)}
            onSubmit={(values) => {
              setPayroll((current) => upsertPayrollEntry(current, bonusEmployee, values))
              toast.success('Đã lưu thưởng/phạt')
              setBonusEmployee(null)
            }}
          />
          <PayrollDetailSheet row={detailRow} open={Boolean(detailRow)} onOpenChange={(open) => !open && setDetailRow(null)} />
        </TabsContent>
        <TabsContent value="settings">
          <PayrollSettingsForm settings={payrollSettings} onSave={setPayrollSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function upsertPayrollEntry(current, row, values) {
  const existing = current.find((item) => item.employeeId === row.employee.id && item.month === row.month)
  const payload = {
    id: existing?.id || Date.now(),
    employeeId: row.employee.id,
    month: row.month,
    baseSalary: row.employee.baseSalary,
    workingDays: row.workingDays,
    actualDays: row.actualDays,
    lateCount: row.lateCount,
    absentDays: row.absentDays,
    bonus: values.bonus,
    penalty: values.penalty,
    total: row.total,
    status: existing?.status || 'calculated',
  }

  if (existing) {
    return current.map((item) => (item.id === existing.id ? { ...item, ...payload } : item))
  }

  return [...current, payload]
}

function BonusPenaltyDialog({ row, open, onOpenChange, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(bonusSchema),
    defaultValues: { bonus: row?.bonus || 0, penalty: row?.penalty || 0 },
  })

  useEffect(() => {
    form.reset({ bonus: row?.bonus || 0, penalty: row?.penalty || 0 })
  }, [row, open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Thưởng/phạt bổ sung</DialogTitle>
            <DialogDescription>{row?.employee?.name} · {formatMonth(row?.month)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field label="Thưởng" error={form.formState.errors.bonus}>
              <Input type="number" {...form.register('bonus')} />
            </Field>
            <Field label="Phạt" error={form.formState.errors.penalty}>
              <Input type="number" {...form.register('penalty')} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PayrollDetailSheet({ row, open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Phiếu lương {formatMonth(row?.month)}</SheetTitle>
          <SheetDescription>{row?.employee?.name}</SheetDescription>
        </SheetHeader>
        {row ? (
          <div className="space-y-3 px-4">
            {[
              ['Công thực tế', `${row.actualDays}/${row.workingDays}`],
              ['Số lần đi muộn', row.lateCount],
              ['Ngày vắng', row.absentDays],
              ['Thưởng chuyên cần', formatCurrency(row.attendanceBonus)],
              ['Thưởng bổ sung', formatCurrency(row.bonus)],
              ['Phạt bổ sung', formatCurrency(row.penalty)],
              ['Tổng lương', formatCurrency(row.total)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function PayrollSettingsForm({ settings, onSave }) {
  const form = useForm({ resolver: zodResolver(payrollSettingsSchema), defaultValues: settings })

  useEffect(() => {
    form.reset(settings)
  }, [settings, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thiết lập quy tắc lương</CardTitle>
        <CardDescription>Thay đổi settings sẽ làm bảng lương tính lại ngay.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            onSave(values)
            toast.success('Đã lưu cấu hình lương')
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['standardWorkingDays', 'Ngày công chuẩn/tháng'],
              ['latePenalty', 'Phạt đi muộn'],
              ['absentPenalty', 'Phạt vắng mặt'],
              ['attendanceBonus', 'Thưởng chuyên cần'],
              ['overtimeMultiplier', 'Hệ số tăng ca'],
              ['weekendMultiplier', 'Hệ số cuối tuần'],
            ].map(([name, label]) => (
              <Field key={name} label={label} error={form.formState.errors[name]}>
                <Input type="number" step={name.includes('Multiplier') ? '0.1' : '1'} {...form.register(name)} />
              </Field>
            ))}
          </div>
          <Alert>
            <DollarSign className="size-4" />
            <AlertTitle>Công thức demo</AlertTitle>
            <AlertDescription>
              Lương thực nhận = lương cơ bản x công thực tế / công chuẩn + thưởng chuyên cần + thưởng bổ sung - phạt đi muộn - phạt vắng - phạt bổ sung.
            </AlertDescription>
          </Alert>
          <Button type="submit">
            <Save className="size-4" />
            Lưu thay đổi
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PerformancePage() {
  const { employees, performance, setPerformance } = useHrm()
  const loading = usePageLoading()
  const [cycle, setCycle] = useState('2026-Q1')
  const [reviewEmployee, setReviewEmployee] = useState(null)
  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])
  const rows = performance.filter((review) => review.cycle === cycle)

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý đánh giá" description="Chấm điểm 5 tiêu chí theo quý và lưu lịch sử review." />
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <NativeSelect value={cycle} onChange={(event) => setCycle(event.target.value)} className="sm:w-40">
              <option value="2026-Q1">2026-Q1</option>
              <option value="2026-Q2">2026-Q2</option>
              <option value="2025-Q4">2025-Q4</option>
            </NativeSelect>
            <Button onClick={() => setReviewEmployee(employees[0])}>
              <Plus className="size-4" />
              Tạo đánh giá
            </Button>
          </div>

          {loading ? (
            <TableSkeleton cols={6} />
          ) : rows.length === 0 ? (
            <StateBlock icon={BadgeCheck} title="Chưa có đánh giá" description="Tạo review đầu tiên cho kỳ đang chọn." action={<Button onClick={() => setReviewEmployee(employees[0])}>Tạo đánh giá</Button>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Kỳ</TableHead>
                  <TableHead>Hiệu quả</TableHead>
                  <TableHead>Kỷ luật</TableHead>
                  <TableHead>KPI</TableHead>
                  <TableHead>Điểm TB</TableHead>
                  <TableHead className="text-right">Sửa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((review) => {
                  const employee = employeeById.get(review.employeeId)
                  return (
                    <TableRow key={review.id}>
                      <TableCell>
                        <PersonCell employee={employee} />
                      </TableCell>
                      <TableCell>{review.cycle}</TableCell>
                      <TableCell>{review.scores.efficiency}/5</TableCell>
                      <TableCell>{review.scores.discipline}/5</TableCell>
                      <TableCell>{review.scores.kpi}/5</TableCell>
                      <TableCell>
                        <Badge variant="outline">{review.average}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setReviewEmployee(employee)}>
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ReviewDialog
        employee={reviewEmployee}
        open={Boolean(reviewEmployee)}
        onOpenChange={(open) => !open && setReviewEmployee(null)}
        cycle={cycle}
        employees={employees}
        existingReviews={performance}
        onSubmit={(values) => {
          const scores = {
            efficiency: values.efficiency,
            discipline: values.discipline,
            teamwork: values.teamwork,
            attitude: values.attitude,
            kpi: values.kpi,
          }
          const average = Object.values(scores).reduce((total, score) => total + Number(score), 0) / 5
          const payload = {
            employeeId: Number(values.employeeId || reviewEmployee.id),
            cycle: values.cycle,
            scores,
            average: Number(average.toFixed(1)),
            comment: values.comment,
            reviewedBy: 'admin',
            reviewedAt: new Date().toISOString(),
          }
          setPerformance((current) => {
            const existing = current.find((review) => review.employeeId === payload.employeeId && review.cycle === payload.cycle)
            if (existing) {
              return current.map((review) => (review.id === existing.id ? { ...review, ...payload } : review))
            }
            return [{ id: Date.now(), ...payload }, ...current]
          })
          toast.success('Đã lưu đánh giá')
          setReviewEmployee(null)
        }}
      />
    </div>
  )
}

function ReviewDialog({ employee, open, onOpenChange, cycle, employees, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(reviewSchema.extend({ employeeId: z.coerce.number().optional() })),
    defaultValues: {
      employeeId: employee?.id,
      cycle,
      efficiency: 4,
      discipline: 4,
      teamwork: 4,
      attitude: 4,
      kpi: 4,
      comment: 'Hoàn thành tốt công việc, tiếp tục cải thiện phối hợp trong team.',
    },
  })

  useEffect(() => {
    form.reset({
      employeeId: employee?.id,
      cycle,
      efficiency: 4,
      discipline: 4,
      teamwork: 4,
      attitude: 4,
      kpi: 4,
      comment: 'Hoàn thành tốt công việc, tiếp tục cải thiện phối hợp trong team.',
    })
  }, [employee, cycle, open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Chấm điểm nhân viên</DialogTitle>
            <DialogDescription>Thang điểm 1-5 cho 5 tiêu chí.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field label="Nhân viên">
              <NativeSelect {...form.register('employeeId')}>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Kỳ" error={form.formState.errors.cycle}>
              <Input {...form.register('cycle')} />
            </Field>
            {[
              ['efficiency', 'Hiệu quả'],
              ['discipline', 'Kỷ luật'],
              ['teamwork', 'Teamwork'],
              ['attitude', 'Thái độ'],
              ['kpi', 'KPI'],
            ].map(([name, label]) => (
              <Field key={name} label={label} error={form.formState.errors[name]}>
                <Input type="number" min="1" max="5" {...form.register(name)} />
              </Field>
            ))}
            <div className="sm:col-span-2">
              <Field label="Nhận xét" error={form.formState.errors.comment}>
                <Textarea {...form.register('comment')} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Lưu đánh giá</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LeaveManagementPage() {
  const { employees, leaveRequests, leaveSettings, setLeaveRequests, setLeaveSettings } = useHrm()
  const loading = usePageLoading()
  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])
  const [status, setStatus] = useState('all')
  const [department, setDepartment] = useState('all')
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const rows = leaveRequests.filter((request) => {
    const employee = employeeById.get(request.employeeId)
    return (status === 'all' || request.status === status) && (department === 'all' || employee?.department === department)
  })

  const updateStatus = (request, nextStatus, rejectReasonValue = null) => {
    setLeaveRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: nextStatus,
              rejectReason: rejectReasonValue,
              reviewedBy: 'admin',
              reviewedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
    toast.success(nextStatus === 'approved' ? 'Đã duyệt đơn nghỉ phép' : 'Đã từ chối đơn nghỉ phép')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý nghỉ phép" description="Duyệt/từ chối đơn và cấu hình quota nghỉ phép." />
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Đơn nghỉ</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <FilterSelect
                  value={status}
                  onValueChange={setStatus}
                  options={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    ...Object.entries(leaveStatusLabels).map(([value, label]) => ({ value, label })),
                  ]}
                />
                <FilterSelect
                  value={department}
                  onValueChange={setDepartment}
                  options={[{ value: 'all', label: 'Tất cả phòng ban' }, ...defaultDepartments.map((item) => ({ value: item, label: item }))]}
                />
              </div>
              {loading ? (
                <TableSkeleton cols={8} />
              ) : rows.length === 0 ? (
                <StateBlock title="Không tìm thấy đơn nghỉ phù hợp" description="Đổi trạng thái hoặc phòng ban để xem thêm." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Loại nghỉ</TableHead>
                      <TableHead>Từ ngày</TableHead>
                      <TableHead>Đến ngày</TableHead>
                      <TableHead>Số ngày</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">NP{String(request.id).padStart(3, '0')}</TableCell>
                        <TableCell>
                          <PersonCell employee={employeeById.get(request.employeeId)} />
                        </TableCell>
                        <TableCell>{leaveTypeLabels[request.type]}</TableCell>
                        <TableCell>{formatDate(request.fromDate)}</TableCell>
                        <TableCell>{formatDate(request.toDate)}</TableCell>
                        <TableCell>{request.days}</TableCell>
                        <TableCell>
                          <StatusBadge type="leave" status={request.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" disabled={request.status !== 'pending'} onClick={() => updateStatus(request, 'approved')}>
                            <CheckCircle2 className="size-4 text-emerald-600" />
                          </Button>
                          <AlertDialog open={rejectingRequest?.id === request.id} onOpenChange={(open) => !open && setRejectingRequest(null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={request.status !== 'pending'}
                                onClick={() => {
                                  setRejectingRequest(request)
                                  setRejectReason('')
                                }}
                              >
                                <XCircle className="size-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogMedia>
                                  <XCircle />
                                </AlertDialogMedia>
                                <AlertDialogTitle>Từ chối đơn nghỉ?</AlertDialogTitle>
                                <AlertDialogDescription>Bắt buộc nhập lý do để nhân viên thấy phản hồi.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <Textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Lý do từ chối..." />
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  onClick={(event) => {
                                    if (rejectReason.trim().length < 5) {
                                      event.preventDefault()
                                      toast.error('Vui lòng nhập lý do từ chối')
                                      return
                                    }
                                    updateStatus(request, 'rejected', rejectReason)
                                  }}
                                >
                                  Từ chối
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <LeaveSettingsForm settings={leaveSettings} onSave={setLeaveSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LeaveSettingsForm({ settings, onSave }) {
  const form = useForm({ resolver: zodResolver(leaveSettingsSchema), defaultValues: settings })
  const carryOver = useWatch({ control: form.control, name: 'allowCarryOver' })
  const leaveTypes = useWatch({ control: form.control, name: 'leaveTypes' }) || []

  useEffect(() => {
    form.reset(settings)
  }, [settings, form])

  const toggleType = (type) => {
    form.setValue('leaveTypes', leaveTypes.includes(type) ? leaveTypes.filter((item) => item !== type) : [...leaveTypes, type])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thiết lập quy tắc nghỉ phép</CardTitle>
        <CardDescription>Quota và loại nghỉ áp dụng cho form nhân viên.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            onSave(values)
            toast.success('Đã lưu cấu hình nghỉ phép')
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Quota phép năm" error={form.formState.errors.annualLeaveQuota}>
              <Input type="number" {...form.register('annualLeaveQuota')} />
            </Field>
            <Field label="Quota nghỉ ốm" error={form.formState.errors.sickLeaveQuota}>
              <Input type="number" {...form.register('sickLeaveQuota')} />
            </Field>
            <Field label="Gửi trước (ngày)" error={form.formState.errors.minAdvanceDays}>
              <Input type="number" {...form.register('minAdvanceDays')} />
            </Field>
            <Field label="Ngày liên tiếp tối đa" error={form.formState.errors.maxConsecutiveDays}>
              <Input type="number" {...form.register('maxConsecutiveDays')} />
            </Field>
          </div>
          <SwitchSetting label="Cho phép cộng dồn năm sau" checked={carryOver} onCheckedChange={(value) => form.setValue('allowCarryOver', value)} />
          <div className="space-y-2">
            <Label>Loại nghỉ áp dụng</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(leaveTypeLabels).map(([value, label]) => (
                <Button key={value} type="button" variant={leaveTypes.includes(value) ? 'default' : 'outline'} onClick={() => toggleType(value)}>
                  {label}
                </Button>
              ))}
            </div>
            {form.formState.errors.leaveTypes ? <p className="text-xs text-destructive">{form.formState.errors.leaveTypes.message}</p> : null}
          </div>
          <Button type="submit">
            <Save className="size-4" />
            Lưu thay đổi
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ContractPage() {
  const { employees, contracts, setContracts } = useHrm()
  const loading = usePageLoading()
  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [editingContract, setEditingContract] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailContract, setDetailContract] = useState(null)

  const rows = contracts
    .map((contract) => ({ ...contract, computedStatus: calculateContractStatus(contract), employee: employeeById.get(contract.employeeId) }))
    .filter((contract) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch = !keyword || contract.employee?.name.toLowerCase().includes(keyword) || contract.code.toLowerCase().includes(keyword)
      const matchesType = type === 'all' || contract.type === type
      const matchesStatus = status === 'all' || contract.computedStatus === status
      return matchesSearch && matchesType && matchesStatus
    })

  const saveContract = (values) => {
    if (values.type !== 'indefinite' && !values.endDate) {
      toast.error('Hợp đồng có thời hạn phải có ngày kết thúc')
      return
    }

    const activeConflict = contracts.some((contract) => {
      if (editingContract && contract.id === editingContract.id) {
        return false
      }
      return contract.employeeId === values.employeeId && calculateContractStatus(contract) === 'active'
    })

    if (activeConflict && calculateContractStatus({ ...values, status: 'active' }) === 'active') {
      toast.error('Mỗi nhân viên chỉ được có 1 hợp đồng active')
      return
    }

    if (editingContract) {
      setContracts((current) => current.map((contract) => (contract.id === editingContract.id ? { ...contract, ...values } : contract)))
      toast.success('Đã cập nhật hợp đồng')
    } else {
      const nextId = Math.max(...contracts.map((contract) => contract.id), 0) + 1
      setContracts((current) => [
        {
          id: nextId,
          code: `HD${String(nextId).padStart(3, '0')}`,
          status: 'active',
          createdAt: new Date().toISOString(),
          ...values,
        },
        ...current,
      ])
      toast.success('Đã tạo hợp đồng')
    }

    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý hợp đồng"
        description="CRUD hợp đồng, tính status động và giữ lịch sử."
        action={
          <Button
            onClick={() => {
              setEditingContract(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            Tạo hợp đồng
          </Button>
        }
      />
      <ContractFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employees={employees}
        contract={editingContract}
        onSubmit={saveContract}
      />
      <ContractDetailSheet contract={detailContract} employee={detailContract ? employeeById.get(detailContract.employeeId) : null} open={Boolean(detailContract)} onOpenChange={(open) => !open && setDetailContract(null)} />
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
              <Input className="pl-8" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên nhân viên hoặc mã hợp đồng..." />
            </div>
            <FilterSelect
              value={type}
              onValueChange={setType}
              options={[{ value: 'all', label: 'Tất cả loại HĐ' }, ...Object.entries(contractTypeLabels).map(([value, label]) => ({ value, label }))]}
            />
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...Object.entries(contractStatusLabels).map(([value, label]) => ({ value, label }))]}
            />
          </div>
          {loading ? (
            <TableSkeleton cols={8} />
          ) : rows.length === 0 ? (
            <StateBlock title="Không tìm thấy hợp đồng phù hợp" description="Thử đổi bộ lọc hoặc tạo hợp đồng mới." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Lương HĐ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.code}</TableCell>
                    <TableCell>
                      <PersonCell employee={contract.employee} />
                    </TableCell>
                    <TableCell>{contractTypeLabels[contract.type]}</TableCell>
                    <TableCell>{formatDate(contract.startDate)}</TableCell>
                    <TableCell>{formatDate(contract.endDate)}</TableCell>
                    <TableCell>{formatCurrency(contract.contractSalary)}</TableCell>
                    <TableCell>
                      <StatusBadge type="contract" status={contract.computedStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDetailContract(contract)}>
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={contract.computedStatus === 'expired'}
                        onClick={() => {
                          setEditingContract(contract)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={contract.computedStatus === 'terminated'}>
                            <Trash2 className="size-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogMedia>
                              <Trash2 />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Chấm dứt hợp đồng?</AlertDialogTitle>
                            <AlertDialogDescription>Hợp đồng sẽ chuyển sang trạng thái đã chấm dứt và vẫn nằm trong lịch sử.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => {
                                setContracts((current) => current.map((item) => (item.id === contract.id ? { ...item, status: 'terminated' } : item)))
                                toast.success('Đã chấm dứt hợp đồng')
                              }}
                            >
                              Chấm dứt
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ContractFormDialog({ open, onOpenChange, employees, contract, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: contract || {
      employeeId: employees[0]?.id,
      type: 'probation',
      startDate: '2026-05-13',
      endDate: '2026-07-13',
      contractSalary: employees[0]?.baseSalary || 10000000,
      position: employees[0]?.position || '',
      terms: 'Thời gian làm việc 08:00-17:30, nghỉ phép và bảo mật theo chính sách công ty.',
      attachmentName: 'contract.pdf',
    },
  })
  const type = useWatch({ control: form.control, name: 'type' })

  useEffect(() => {
    form.reset(
      contract || {
        employeeId: employees[0]?.id,
        type: 'probation',
        startDate: '2026-05-13',
        endDate: '2026-07-13',
        contractSalary: employees[0]?.baseSalary || 10000000,
        position: employees[0]?.position || '',
        terms: 'Thời gian làm việc 08:00-17:30, nghỉ phép và bảo mật theo chính sách công ty.',
        attachmentName: 'contract.pdf',
      },
    )
  }, [contract, employees, open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{contract ? 'Sửa hợp đồng' : 'Tạo hợp đồng'}</DialogTitle>
            <DialogDescription>Hợp đồng hết hạn không cho sửa nội dung, chỉ tạo/gia hạn bằng bản mới.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field label="Nhân viên" error={form.formState.errors.employeeId}>
              <NativeSelect {...form.register('employeeId')}>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Loại hợp đồng" error={form.formState.errors.type}>
              <NativeSelect {...form.register('type')}>
                {Object.entries(contractTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Ngày bắt đầu" error={form.formState.errors.startDate}>
              <Input type="date" {...form.register('startDate')} />
            </Field>
            <Field label="Ngày kết thúc" error={form.formState.errors.endDate}>
              <Input type="date" disabled={type === 'indefinite'} {...form.register('endDate')} />
            </Field>
            <Field label="Lương hợp đồng" error={form.formState.errors.contractSalary}>
              <Input type="number" {...form.register('contractSalary')} />
            </Field>
            <Field label="Vị trí" error={form.formState.errors.position}>
              <Input {...form.register('position')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Tên file đính kèm" error={form.formState.errors.attachmentName}>
                <Input {...form.register('attachmentName')} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Điều khoản" error={form.formState.errors.terms}>
                <Textarea {...form.register('terms')} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Lưu hợp đồng</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContractDetailSheet({ contract, employee, open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{contract?.code}</SheetTitle>
          <SheetDescription>{employee?.name}</SheetDescription>
        </SheetHeader>
        {contract ? (
          <div className="space-y-4 px-4">
            <StatusBadge type="contract" status={calculateContractStatus(contract)} />
            {[
              ['Loại', contractTypeLabels[contract.type]],
              ['Ngày bắt đầu', formatDate(contract.startDate)],
              ['Ngày kết thúc', formatDate(contract.endDate)],
              ['Vị trí', contract.position],
              ['Lương HĐ', formatCurrency(contract.contractSalary)],
              ['File', contract.attachmentName],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Điều khoản</p>
              <p className="mt-1 text-sm leading-6">{contract.terms}</p>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function UserDashboard() {
  const { currentUser } = useAuth()
  const { attendance, leaveRequests, payroll, performance, contracts, leaveSettings } = useHrm()
  const myAttendance = attendance.filter((row) => row.employeeId === currentUser.employeeId)
  const myPendingLeaves = leaveRequests.filter((request) => request.employeeId === currentUser.employeeId && request.status === 'pending')
  const latestPayroll = payroll.find((row) => row.employeeId === currentUser.employeeId && row.month === '2026-04')
  const latestReview = performance.find((review) => review.employeeId === currentUser.employeeId)
  const activeContract = contracts.find((contract) => contract.employeeId === currentUser.employeeId && ['active', 'expiring'].includes(calculateContractStatus(contract)))
  const remainingLeave = calculateRemainingAnnualLeave(currentUser.employeeId, leaveRequests, leaveSettings)

  return (
    <div className="space-y-6">
      <PageHeader title={`Xin chào, ${currentUser.name}`} description="Tổng quan cá nhân cho nhân viên." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Clock} title="Công tháng 5" value={myAttendance.filter((row) => row.status !== 'absent').length} detail="Ngày có dữ liệu chấm công" />
        <MetricCard icon={CalendarDays} title="Phép còn lại" value={remainingLeave} detail="Quota phép năm" />
        <MetricCard icon={DollarSign} title="Lương gần nhất" value={formatCurrency(latestPayroll?.total || 0)} detail="Tháng 04/2026" />
        <MetricCard icon={BadgeCheck} title="Điểm Q1" value={latestReview?.average || '—'} detail="Điểm trung bình" />
      </div>
      {activeContract && calculateContractStatus(activeContract) === 'expiring' ? (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="size-4" />
          <AlertTitle>Hợp đồng sắp hết hạn</AlertTitle>
          <AlertDescription>Hợp đồng của bạn sắp hết hạn vào {formatDate(activeContract.endDate)}. Vui lòng liên hệ HR.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đơn nghỉ đang chờ</CardTitle>
          </CardHeader>
          <CardContent>
            {myPendingLeaves.length ? (
              <div className="space-y-3">
                {myPendingLeaves.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg border p-3">
                    <span>{leaveTypeLabels[request.type]}</span>
                    <StatusBadge type="leave" status={request.status} />
                  </div>
                ))}
              </div>
            ) : (
              <StateBlock icon={CalendarDays} title="Không có đơn chờ" description="Các đơn mới sẽ hiển thị tại đây." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hợp đồng hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            {activeContract ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{activeContract.code}</span>
                  <StatusBadge type="contract" status={calculateContractStatus(activeContract)} />
                </div>
                <p className="text-sm text-muted-foreground">{contractTypeLabels[activeContract.type]} · {formatCurrency(activeContract.contractSalary)}</p>
              </div>
            ) : (
              <StateBlock icon={FileText} title="Bạn chưa có hợp đồng" description="Vui lòng liên hệ HR." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MyProfilePage() {
  const { currentUser, updateCurrentUser } = useAuth()
  const { setEmployees } = useHrm()
  const form = useForm({ resolver: zodResolver(profileSchema), defaultValues: { phone: currentUser.phone, address: currentUser.address } })

  return (
    <div className="space-y-6">
      <PageHeader title="Hồ sơ cá nhân" description="Nhân viên được sửa số điện thoại và địa chỉ." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{currentUser.name}</CardTitle>
          <CardDescription>{currentUser.position} · {currentUser.department}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              setEmployees((current) => current.map((employee) => (employee.id === currentUser.employeeId ? { ...employee, ...values } : employee)))
              updateCurrentUser(values)
              toast.success('Đã cập nhật hồ sơ')
            })}
          >
            <Field label="Email">
              <Input value={currentUser.email} disabled />
            </Field>
            <Field label="Số điện thoại" error={form.formState.errors.phone}>
              <Input {...form.register('phone')} />
            </Field>
            <Field label="Địa chỉ" error={form.formState.errors.address}>
              <Input {...form.register('address')} />
            </Field>
            <Button type="submit">Lưu hồ sơ</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function MyAttendancePage() {
  const { currentUser } = useAuth()
  const { attendance, attendanceSettings, setAttendance } = useHrm()
  const today = new Date().toISOString().slice(0, 10)
  const [nowTime] = useState(() => new Date().toTimeString().slice(0, 5))
  const myRows = attendance.filter((row) => row.employeeId === currentUser.employeeId).slice(0, 30)
  const todayRow = attendance.find((row) => row.employeeId === currentUser.employeeId && row.date === today)

  const checkIn = () => {
    if (todayRow) {
      toast.info('Hôm nay đã có dữ liệu chấm công')
      return
    }
    setAttendance((current) => [
      {
        id: Date.now(),
        employeeId: currentUser.employeeId,
        date: today,
        checkIn: nowTime,
        checkOut: '',
        status: 'pending_checkout',
      },
      ...current,
    ])
    toast.success('Check-in thành công')
  }

  const checkOut = () => {
    if (!todayRow) {
      toast.error('Bạn cần check-in trước')
      return
    }
    setAttendance((current) =>
      current.map((row) =>
        row.id === todayRow.id
          ? {
              ...row,
              checkOut: nowTime,
              status: calculateAttendanceStatus({ ...row, checkOut: nowTime }, attendanceSettings),
            }
          : row,
      ),
    )
    toast.success('Check-out thành công')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Chấm công cá nhân" description="Check-in/out và xem lịch sử chấm công của bạn." />
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Hôm nay: {formatDate(today)}</p>
            <p className="text-sm text-muted-foreground">Check-in: {todayRow?.checkIn || '—'} · Check-out: {todayRow?.checkOut || '—'}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={checkIn} disabled={Boolean(todayRow)}>
              <Clock className="size-4" />
              Check-in
            </Button>
            <Button variant="outline" onClick={checkOut} disabled={!todayRow || Boolean(todayRow.checkOut)}>
              Check-out
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Tổng giờ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>{row.checkIn || '—'}</TableCell>
                  <TableCell>{row.checkOut || '—'}</TableCell>
                  <TableCell>{calculateWorkHours(row.checkIn, row.checkOut)}h</TableCell>
                  <TableCell>
                    <StatusBadge type="attendance" status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function MyPayrollPage() {
  const { currentUser } = useAuth()
  const { employees, attendance, payroll, payrollSettings } = useHrm()
  const [month, setMonth] = useState('2026-04')
  const employee = employees.find((item) => item.id === currentUser.employeeId)
  const entry = payroll.find((row) => row.employeeId === currentUser.employeeId && row.month === month)
  const rows = attendance.filter((row) => row.employeeId === currentUser.employeeId && row.date.startsWith(month))
  const calculated = calculatePayroll(employee, rows, entry, payrollSettings)

  return (
    <div className="space-y-6">
      <PageHeader title="Phiếu lương cá nhân" description="Xem lương theo tháng và chi tiết công thức." action={<Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-40" />} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{formatMonth(month)}</CardTitle>
          <CardDescription>{employee.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            ['Lương cơ bản', formatCurrency(employee.baseSalary)],
            ['Công thực tế', `${calculated.actualDays}/${calculated.workingDays}`],
            ['Số lần đi muộn', calculated.lateCount],
            ['Ngày vắng', calculated.absentDays],
            ['Thưởng', formatCurrency(calculated.bonus + calculated.attendanceBonus)],
            ['Phạt', formatCurrency(calculated.penalty + calculated.lateCount * payrollSettings.latePenalty + calculated.absentDays * payrollSettings.absentPenalty)],
            ['Tổng thực nhận', formatCurrency(calculated.total)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MyPerformancePage() {
  const { currentUser } = useAuth()
  const { performance } = useHrm()
  const rows = performance.filter((review) => review.employeeId === currentUser.employeeId)

  return (
    <div className="space-y-6">
      <PageHeader title="Đánh giá cá nhân" description="Điểm và nhận xét từ HR, chỉ xem." />
      <div className="grid gap-4">
        {rows.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <CardTitle>{review.cycle}</CardTitle>
              <CardDescription>{formatDateTime(review.reviewedAt)}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-5">
              {Object.entries(review.scores).map(([name, score]) => (
                <div key={name} className="rounded-lg border p-3 text-center">
                  <p className="text-xs capitalize text-muted-foreground">{name}</p>
                  <p className="text-xl font-semibold">{score}</p>
                </div>
              ))}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                <p className="text-xs text-muted-foreground">TB</p>
                <p className="text-xl font-semibold">{review.average}</p>
              </div>
              <p className="sm:col-span-6 text-sm text-muted-foreground">{review.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MyLeavePage() {
  const { currentUser } = useAuth()
  const { leaveRequests, leaveSettings, setLeaveRequests } = useHrm()
  const [dialogOpen, setDialogOpen] = useState(false)
  const myRequests = leaveRequests.filter((request) => request.employeeId === currentUser.employeeId)
  const remaining = calculateRemainingAnnualLeave(currentUser.employeeId, leaveRequests, leaveSettings)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn nghỉ phép"
        description={`Phép năm còn lại: ${remaining} ngày.`}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Gửi đơn nghỉ
          </Button>
        }
      />
      <LeaveRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        settings={leaveSettings}
        remaining={remaining}
        onSubmit={(values) => {
          const days = calculateLeaveDays(values.fromDate, values.toDate)
          const minDate = new Date()
          minDate.setDate(minDate.getDate() + Number(leaveSettings.minAdvanceDays || 0))
          const from = new Date(`${values.fromDate}T00:00:00`)

          if (days <= 0) {
            toast.error('Ngày kết thúc phải sau ngày bắt đầu')
            return
          }
          if (days > Number(leaveSettings.maxConsecutiveDays || 7)) {
            toast.error('Số ngày nghỉ vượt quá giới hạn')
            return
          }
          if (values.type === 'annual' && days > remaining) {
            toast.error('Số ngày nghỉ vượt quá phép còn lại')
            return
          }
          if (from < new Date(minDate.toISOString().slice(0, 10))) {
            toast.error(`Cần gửi trước tối thiểu ${leaveSettings.minAdvanceDays} ngày`)
            return
          }

          setLeaveRequests((current) => [
            {
              id: Date.now(),
              employeeId: currentUser.employeeId,
              days,
              status: 'pending',
              rejectReason: null,
              createdAt: new Date().toISOString(),
              reviewedBy: null,
              reviewedAt: null,
              ...values,
            },
            ...current,
          ])
          toast.success('Đã gửi đơn nghỉ phép')
          setDialogOpen(false)
        }}
      />
      <Card>
        <CardContent className="pt-4">
          {myRequests.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại nghỉ</TableHead>
                  <TableHead>Từ ngày</TableHead>
                  <TableHead>Đến ngày</TableHead>
                  <TableHead>Số ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hủy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{leaveTypeLabels[request.type]}</TableCell>
                    <TableCell>{formatDate(request.fromDate)}</TableCell>
                    <TableCell>{formatDate(request.toDate)}</TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>
                      <StatusBadge type="leave" status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={request.status !== 'pending'}>
                            <XCircle className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogMedia>
                              <XCircle />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Hủy đơn nghỉ?</AlertDialogTitle>
                            <AlertDialogDescription>Chỉ đơn đang chờ duyệt mới được hủy.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Không</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => {
                                setLeaveRequests((current) => current.map((item) => (item.id === request.id ? { ...item, status: 'cancelled' } : item)))
                                toast.success('Đã hủy đơn nghỉ phép')
                              }}
                            >
                              Hủy đơn
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <StateBlock icon={CalendarDays} title="Bạn chưa có đơn nghỉ" description="Gửi đơn mới để HR phê duyệt." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LeaveRequestDialog({ open, onOpenChange, settings, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { type: 'annual', fromDate: '2026-05-20', toDate: '2026-05-20', reason: '' },
  })

  useEffect(() => {
    form.reset({ type: settings.leaveTypes?.[0] || 'annual', fromDate: '2026-05-20', toDate: '2026-05-20', reason: '' })
  }, [open, settings.leaveTypes, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Gửi đơn nghỉ phép</DialogTitle>
            <DialogDescription>Form kiểm tra quota, ngày gửi trước và số ngày tối đa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field label="Loại nghỉ" error={form.formState.errors.type}>
              <NativeSelect {...form.register('type')}>
                {(settings.leaveTypes || []).map((type) => (
                  <option key={type} value={type}>{leaveTypeLabels[type]}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Từ ngày" error={form.formState.errors.fromDate}>
              <Input type="date" {...form.register('fromDate')} />
            </Field>
            <Field label="Đến ngày" error={form.formState.errors.toDate}>
              <Input type="date" {...form.register('toDate')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Lý do" error={form.formState.errors.reason}>
                <Textarea {...form.register('reason')} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Gửi đơn</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MyContractPage() {
  const { currentUser } = useAuth()
  const { contracts } = useHrm()
  const myContracts = contracts
    .filter((contract) => contract.employeeId === currentUser.employeeId)
    .map((contract) => ({ ...contract, computedStatus: calculateContractStatus(contract) }))
  const activeContract = myContracts.find((contract) => ['active', 'expiring'].includes(contract.computedStatus))

  return (
    <div className="space-y-6">
      <PageHeader title="Hợp đồng của tôi" description="Xem hợp đồng hiện tại và lịch sử, read-only." />
      {activeContract?.computedStatus === 'expiring' ? (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="size-4" />
          <AlertTitle>Hợp đồng sắp hết hạn</AlertTitle>
          <AlertDescription>Hợp đồng của bạn sắp hết hạn vào {formatDate(activeContract.endDate)}.</AlertDescription>
        </Alert>
      ) : null}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Hợp đồng hiện tại</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {activeContract ? (
            <Card className="max-w-3xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{activeContract.code}</CardTitle>
                    <CardDescription>{contractTypeLabels[activeContract.type]}</CardDescription>
                  </div>
                  <StatusBadge type="contract" status={activeContract.computedStatus} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Ngày bắt đầu', formatDate(activeContract.startDate)],
                  ['Ngày kết thúc', formatDate(activeContract.endDate)],
                  ['Vị trí', activeContract.position],
                  ['Lương HĐ', formatCurrency(activeContract.contractSalary)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Điều khoản</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeContract.terms}</p>
                </div>
                <Button variant="outline" onClick={() => toast.success('Đã tải xuống file hợp đồng mock')}>
                  <Download className="size-4" />
                  Tải file hợp đồng
                </Button>
              </CardContent>
            </Card>
          ) : (
            <StateBlock icon={FileText} title="Bạn chưa có hợp đồng nào" description="Vui lòng liên hệ HR." />
          )}
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã HĐ</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Bắt đầu</TableHead>
                    <TableHead>Kết thúc</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.code}</TableCell>
                      <TableCell>{contractTypeLabels[contract.type]}</TableCell>
                      <TableCell>{formatDate(contract.startDate)}</TableCell>
                      <TableCell>{formatDate(contract.endDate)}</TableCell>
                      <TableCell>
                        <StatusBadge type="contract" status={contract.computedStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <StateBlock icon={AlertTriangle} title="Không tìm thấy trang" description="Route không tồn tại trong demo HRM." action={<Button asChild><NavLink to="/">Về dashboard</NavLink></Button>} />
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <AppLayout role="admin" />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate replace to="/admin/dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<EmployeePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="leave" element={<LeaveManagementPage />} />
        <Route path="contracts" element={<ContractPage />} />
      </Route>
      <Route
        path="/user"
        element={
          <RequireAuth role="user">
            <AppLayout role="user" />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate replace to="/user/dashboard" />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="attendance" element={<MyAttendancePage />} />
        <Route path="payroll" element={<MyPayrollPage />} />
        <Route path="performance" element={<MyPerformancePage />} />
        <Route path="leave" element={<MyLeavePage />} />
        <Route path="contract" element={<MyContractPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <HrmProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </HrmProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
