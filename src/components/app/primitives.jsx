import { Search } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  attendanceStatusLabels,
  contractStatusLabels,
  leaveStatusLabels,
  payrollStatusLabels,
} from '@/utils/format'

const inputClass = 'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
const pageTitleClass = 'text-2xl font-semibold tracking-normal text-foreground'

export function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error.message}</p> : null}
    </div>
  )
}

export function NativeSelect({ className, children, ...props }) {
  return (
    <select className={cn(inputClass, className)} {...props}>
      {children}
    </select>
  )
}

export function FilterSelect({ value, onValueChange, options, placeholder = 'Tất cả', className }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn('w-full sm:w-44', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, colIndex) => (
            <Skeleton key={colIndex} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StateBlock({ icon: Icon = Search, title, description, action }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <div className="rounded-lg bg-muted p-3 text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className={pageTitleClass}>{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  )
}

export function PersonCell({ employee }) {
  return (
    <div className="flex min-w-52 items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>{employee?.avatar || 'NV'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{employee?.name || 'Không rõ'}</p>
        <p className="truncate text-xs text-muted-foreground">{employee?.email || employee?.code}</p>
      </div>
    </div>
  )
}

export function StatusBadge({ type, status }) {
  const map = {
    attendance: {
      on_time: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
      late: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
      absent: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300',
      leave: 'bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300',
      pending_checkout: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
      early_leave: 'bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300',
    },
    leave: {
      pending: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
      approved: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
      rejected: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300',
      cancelled: 'bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300',
    },
    contract: {
      active: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
      expiring: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
      expired: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300',
      terminated: 'bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300',
    },
    payroll: {
      draft: 'bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300',
      calculated: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
      approved: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    },
    employee: {
      active: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
      inactive: 'bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300',
    },
  }

  const labels = {
    attendance: attendanceStatusLabels,
    leave: leaveStatusLabels,
    contract: contractStatusLabels,
    payroll: payrollStatusLabels,
    employee: { active: 'Đang làm', inactive: 'Tạm nghỉ' },
  }

  return (
    <Badge variant="outline" className={cn('ring-1', map[type]?.[status])}>
      {labels[type]?.[status] || status}
    </Badge>
  )
}

export function MetricCard({ icon: Icon, title, value, detail }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <Icon className="size-5 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
