import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, MoreHorizontal, Pencil, Plus, Save, Search, Trash2, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Field,
  FilterSelect,
  NativeSelect,
  PageHeader,
  PersonCell,
  StateBlock,
  StatusBadge,
  TableSkeleton,
} from '@/components/app/primitives'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { departments as defaultDepartments } from '@/data/mockData'
import { useHrm } from '@/hooks/useHrm'
import { usePageLoading } from '@/hooks/usePageLoading'
import { formatCurrency, formatDate } from '@/utils/format'

const employeeSchema = z.object({
  name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.email('Email không hợp lệ'),
  phone: z.string().regex(/^\d{10}$/, 'Số điện thoại phải có 10 số'),
  address: z.string().min(5, 'Địa chỉ tối thiểu 5 ký tự'),
  department: z.string().min(1, 'Chọn phòng ban'),
  position: z.string().min(2, 'Chức vụ bắt buộc'),
  baseSalary: z.coerce.number().positive('Lương cơ bản phải lớn hơn 0'),
  joinDate: z.string().min(1, 'Ngày vào làm bắt buộc'),
  status: z.enum(['active', 'inactive']),
})

export function EmployeePage() {
  const loading = usePageLoading()
  const { employees, setEmployees, setAccounts } = useHrm()
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredEmployees = employees.filter((employee) => {
    const keyword = search.trim().toLowerCase()
    const matchesSearch =
      !keyword ||
      employee.name.toLowerCase().includes(keyword) ||
      employee.email.toLowerCase().includes(keyword) ||
      employee.code.toLowerCase().includes(keyword)
    const matchesDepartment = department === 'all' || employee.department === department
    const matchesStatus = status === 'all' || employee.status === status
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const clearFilters = () => {
    setSearch('')
    setDepartment('all')
    setStatus('all')
  }

  const deleteEmployee = (employeeId) => {
    setEmployees((current) => current.filter((employee) => employee.id !== employeeId))
    setAccounts((current) => current.filter((account) => account.employeeId !== employeeId))
    toast.success('Đã xóa nhân viên')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý nhân viên"
        description="CRUD hồ sơ, tìm kiếm, lọc phòng ban và trạng thái."
        action={
          <Button
            onClick={() => {
              setEditingEmployee(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            Thêm nhân viên
          </Button>
        }
      />

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        emails={employees.map((employee) => employee.email)}
        onSubmit={(values) => {
          if (editingEmployee) {
            setEmployees((current) =>
              current.map((employee) => (employee.id === editingEmployee.id ? { ...employee, ...values } : employee)),
            )
            toast.success('Đã cập nhật nhân viên')
          } else {
            const nextId = Math.max(...employees.map((employee) => employee.id), 0) + 1
            const nextEmployee = {
              ...values,
              id: nextId,
              code: `NV${String(nextId).padStart(3, '0')}`,
              avatar: values.name
                .split(' ')
                .slice(-2)
                .map((part) => part[0])
                .join('')
                .toUpperCase(),
              role: 'user',
            }
            setEmployees((current) => [nextEmployee, ...current])
            setAccounts((current) => [
              ...current,
              { email: nextEmployee.email, password: '123456', role: 'user', employeeId: nextEmployee.id, name: nextEmployee.name },
            ])
            toast.success('Đã thêm nhân viên mới')
          }
          setDialogOpen(false)
        }}
      />

      <Card>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-3 pt-4 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
              <Input className="pl-8" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, email, mã NV..." />
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
                { value: 'active', label: 'Đang làm' },
                { value: 'inactive', label: 'Tạm nghỉ' },
              ]}
            />
          </div>

          {loading ? (
            <TableSkeleton cols={7} />
          ) : employees.length === 0 ? (
            <StateBlock
              icon={Users}
              title="Chưa có nhân viên nào"
              description="Thêm hồ sơ đầu tiên để bắt đầu demo."
              action={<Button onClick={() => setDialogOpen(true)}>Thêm nhân viên</Button>}
            />
          ) : filteredEmployees.length === 0 ? (
            <StateBlock
              title="Không tìm thấy nhân viên phù hợp"
              description="Thử đổi từ khóa hoặc xóa bộ lọc."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Lương cơ bản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.code}</TableCell>
                    <TableCell>
                      <PersonCell employee={employee} />
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{formatCurrency(employee.baseSalary)}</TableCell>
                    <TableCell>
                      <StatusBadge type="employee" status={employee.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Mở hành động</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EmployeeDetailSheet employee={employee} />
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingEmployee(employee)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="size-4" />
                            Sửa
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem variant="destructive" onSelect={(event) => event.preventDefault()}>
                                <Trash2 className="size-4" />
                                Xóa
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogMedia>
                                  <Trash2 />
                                </AlertDialogMedia>
                                <AlertDialogTitle>Xóa nhân viên?</AlertDialogTitle>
                                <AlertDialogDescription>Hồ sơ {employee.name} sẽ bị xóa khỏi dữ liệu demo.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={() => deleteEmployee(employee.id)}>
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

function EmployeeDetailSheet({ employee }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
          <Eye className="size-4" />
          Xem chi tiết
        </DropdownMenuItem>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{employee.name}</SheetTitle>
          <SheetDescription>{employee.code} · {employee.department}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          {[
            ['Email', employee.email],
            ['Số điện thoại', employee.phone],
            ['Địa chỉ', employee.address],
            ['Chức vụ', employee.position],
            ['Ngày vào làm', formatDate(employee.joinDate)],
            ['Lương cơ bản', formatCurrency(employee.baseSalary)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function EmployeeFormDialog({ open, onOpenChange, employee, emails, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || {
      name: '',
      email: '',
      phone: '',
      address: '',
      department: 'IT',
      position: '',
      baseSalary: 10000000,
      joinDate: '2026-05-13',
      status: 'active',
    },
  })

  useEffect(() => {
    form.reset(
      employee || {
        name: '',
        email: '',
        phone: '',
        address: '',
        department: 'IT',
        position: '',
        baseSalary: 10000000,
        joinDate: '2026-05-13',
        status: 'active',
      },
    )
  }, [employee, open, form])

  const submit = form.handleSubmit((values) => {
    const normalizedEmail = values.email.toLowerCase()
    const emailExists = emails.some((email) => email.toLowerCase() === normalizedEmail && email !== employee?.email)

    if (emailExists) {
      form.setError('email', { message: 'Email đã tồn tại' })
      return
    }

    onSubmit({ ...values, email: normalizedEmail })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{employee ? 'Sửa nhân viên' : 'Thêm nhân viên'}</DialogTitle>
            <DialogDescription>Form dùng react-hook-form và zod để validate dữ liệu demo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field label="Họ tên" error={form.formState.errors.name}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="Email" error={form.formState.errors.email}>
              <Input {...form.register('email')} />
            </Field>
            <Field label="Số điện thoại" error={form.formState.errors.phone}>
              <Input {...form.register('phone')} />
            </Field>
            <Field label="Phòng ban" error={form.formState.errors.department}>
              <NativeSelect {...form.register('department')}>
                {defaultDepartments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Chức vụ" error={form.formState.errors.position}>
              <Input {...form.register('position')} />
            </Field>
            <Field label="Lương cơ bản" error={form.formState.errors.baseSalary}>
              <Input type="number" {...form.register('baseSalary')} />
            </Field>
            <Field label="Ngày vào làm" error={form.formState.errors.joinDate}>
              <Input type="date" {...form.register('joinDate')} />
            </Field>
            <Field label="Trạng thái" error={form.formState.errors.status}>
              <NativeSelect {...form.register('status')}>
                <option value="active">Đang làm</option>
                <option value="inactive">Tạm nghỉ</option>
              </NativeSelect>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Địa chỉ" error={form.formState.errors.address}>
                <Input {...form.register('address')} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save className="size-4" />
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
