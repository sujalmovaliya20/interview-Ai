'use client'

import { Session } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileSearch, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

interface SessionsTableProps {
  sessions: Session[]
  showPagination?: boolean
  pageSize?: number
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function SessionsTable({ sessions, showPagination = false, pageSize = 10 }: SessionsTableProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedSessions = useMemo(() => {
    if (!showPagination) return sessions
    const start = (currentPage - 1) * pageSize
    return sessions.slice(start, start + pageSize)
  }, [sessions, showPagination, currentPage, pageSize])

  const totalPages = Math.ceil(sessions.length / pageSize)

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center glass-card">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/15 flex items-center justify-center mb-5">
          <Sparkles className="h-7 w-7 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1.5">No sessions yet</h3>
        <p className="text-sm text-zinc-500 mb-5 max-w-xs">
          Start your first AI-powered interview session and get real-time feedback
        </p>
        <Button 
          nativeButton={false} 
          render={<Link href="/dashboard/session/new" className="inline-flex" />}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 transition-all rounded-xl font-semibold"
        >
          Start session
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Duration</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Model</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.map((session) => (
              <TableRow
                key={session.id}
                className="cursor-pointer border-white/[0.04] hover:bg-violet-500/[0.03] transition-colors duration-200"
                onClick={() => router.push(`/dashboard/session/${session.id}`)}
              >
                <TableCell className="font-medium text-zinc-200">
                  {formatDate(session.created_at)}
                </TableCell>
                <TableCell className="text-zinc-400">{formatDuration(session.duration_seconds)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      session.model.toLowerCase().includes('claude')
                        ? 'text-purple-400 border-purple-500/20 bg-purple-500/10 shadow-none'
                        : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-none'
                    }
                  >
                    {session.model}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      session.status === 'completed'
                        ? 'default'
                        : session.status === 'active'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={
                      session.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none'
                        : session.status === 'active'
                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20 shadow-none'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 shadow-none'
                    }
                  >
                    <span className="capitalize">{session.status}</span>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 disabled:text-zinc-600 rounded-lg"
          >
            Previous
          </Button>
          <div className="text-sm text-zinc-500 mx-2 tabular-nums">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 disabled:text-zinc-600 rounded-lg"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
