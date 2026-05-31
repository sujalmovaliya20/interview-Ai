import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/dashboard/Header'
import Link from 'next/link'
import { Activity, Clock, Layers, ArrowRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { type Session, type Credits } from '@/types/index'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // We already checked auth in layout, so user is guaranteed to exist
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch credits
  const { data: creditsDataRaw } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user!.id)
    .single()
  const creditsData = creditsDataRaw as unknown as Pick<Credits, 'balance'>

  // Fetch last 5 sessions
  const { data, count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const sessions = (data as unknown as Session[]) || []

  // Calculate avg length
  const completedSessions = sessions?.filter(s => s.status === 'completed' && s.duration_seconds) || []
  const avgDuration = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / completedSessions.length / 60)
    : null

  const balance = creditsData?.balance ?? 10

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Length</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgDuration !== null ? `${avgDuration} min` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Sessions</CardTitle>
              </div>
              <Button nativeButton={false} size="sm" render={<Link href="/dashboard/session/new" />}>Start New Session</Button>
            </CardHeader>
            <CardContent>
              {sessions && sessions.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {new Date(session.created_at || '').toLocaleDateString()}
                          </TableCell>
                          <TableCell>{session.model}</TableCell>
                          <TableCell>
                            {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)}m` : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                              {session.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-center">
                    <Button nativeButton={false} variant="link" render={<Link href="/dashboard/sessions" />}>
                        View all sessions <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border-dashed border-2 rounded-lg bg-muted/50">
                  <Activity className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ready to ace your first interview?
                  </p>
                  <Button nativeButton={false} render={<Link href="/dashboard/session/new" />}>Start your first session</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  )
}
