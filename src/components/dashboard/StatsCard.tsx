import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: { value: number; label: string }
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <div className="glass-card glass-card-hover p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/15 flex items-center justify-center">
          <Icon className="h-4 w-4 text-violet-400" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold gradient-text">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              trend.value >= 0
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10"
            )}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      {(description || trend) && (
        <p className="mt-1.5 text-xs text-zinc-500">
          {description || (trend && trend.label)}
        </p>
      )}
    </div>
  )
}
