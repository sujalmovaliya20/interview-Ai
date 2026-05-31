'use client'

import { useState, useMemo } from 'react'
import { Session } from '@/types'
import { SessionsFilters } from './SessionsFilters'
import { SessionsTable } from './SessionsTable'

interface SessionsClientProps {
  sessions: Session[]
}

export function SessionsClient({ sessions }: SessionsClientProps) {
  const [status, setStatus] = useState('all')
  const [model, setModel] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (status !== 'all' && s.status !== status) return false
      if (model !== 'all' && !s.model.toLowerCase().includes(model)) return false
      
      if (dateRange === '7d') {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        if (new Date(s.created_at || 0) < d) return false
      } else if (dateRange === '30d') {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        if (new Date(s.created_at || 0) < d) return false
      }

      if (search && !s.id.toLowerCase().includes(search.toLowerCase())) return false
      
      return true
    })
  }, [sessions, status, model, dateRange, search])

  return (
    <div className="space-y-4">
      <SessionsFilters
        status={status} setStatus={setStatus}
        model={model} setModel={setModel}
        dateRange={dateRange} setDateRange={setDateRange}
        search={search} setSearch={setSearch}
      />
      <SessionsTable sessions={filtered} showPagination pageSize={10} />
    </div>
  )
}
