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
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="error">Error</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-1 sm:justify-end">
        <Input
          placeholder="Search Session ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-[200px]"
        />
        
        <Select value={model} onValueChange={(v) => v && setModel(v)}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="gpt">GPT</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
