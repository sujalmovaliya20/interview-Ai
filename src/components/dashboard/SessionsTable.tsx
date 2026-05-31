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
import { FileSearch } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileSearch className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No sessions yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start your first AI-powered interview session
        </p>
        <Button nativeButton={false} render={<Link href="/dashboard/session/new" className="inline-flex" />}>
          Start session
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.map((session) => (
              <TableRow
                key={session.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/dashboard/session/${session.id}`)}
              >
                <TableCell className="font-medium">
                  {formatDate(session.created_at)}
                </TableCell>
                <TableCell>{formatDuration(session.duration_seconds)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      session.model.toLowerCase().includes('claude')
                        ? 'text-purple-500 border-purple-500/20 bg-purple-500/10'
                        : 'text-green-500 border-green-500/20 bg-green-500/10'
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
                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 shadow-none'
                        : session.status === 'active'
                        ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 shadow-none'
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 shadow-none'
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
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground mx-2">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
