'use client'

import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SessionsFiltersProps {
  status: string
  setStatus: (v: string) => void
  model: string
  setModel: (v: string) => void
  dateRange: string
  setDateRange: (v: string) => void
  search: string
  setSearch: (v: string) => void
}

export function SessionsFilters({
  status, setStatus,
  model, setModel,
  dateRange, setDateRange,
  search, setSearch
}: SessionsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={status} onValueChange={setStatus} className="w-full sm:w-auto">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex bg-muted border border-border rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-650 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm text-muted-foreground">All</TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg text-xs data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-650 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm text-muted-foreground">Active</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-650 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm text-muted-foreground">Completed</TabsTrigger>
          <TabsTrigger value="error" className="rounded-lg text-xs data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-650 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm text-muted-foreground">Error</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-1 sm:justify-end">
        <Input
          placeholder="Search Session ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-[200px] bg-transparent border-border focus-visible:ring-violet-500/20 focus-visible:border-violet-500/30 rounded-xl text-foreground placeholder:text-muted-foreground/60 text-sm"
        />
        
        <Select value={model} onValueChange={(v) => v && setModel(v)}>
          <SelectTrigger className="w-full sm:w-[130px] bg-transparent border-border rounded-xl text-foreground text-sm">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border backdrop-blur-xl">
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="gpt">GPT</SelectItem>
          </SelectContent>
        </Select>
 
        <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
          <SelectTrigger className="w-full sm:w-[130px] bg-transparent border-border rounded-xl text-foreground text-sm">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border backdrop-blur-xl">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
