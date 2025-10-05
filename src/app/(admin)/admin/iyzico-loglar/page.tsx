'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, Activity, Eye, Search, Database } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TransactionLog {
  id: string
  conversation_id: string
  order_number?: string
  payment_id?: string
  operation_type: string
  status: string
  request_data?: any
  response_data?: any
  error_data?: any
  iyzico_status?: string
  iyzico_error_code?: string
  iyzico_error_message?: string
  user_agent?: string
  ip_address?: string
  session_info?: any
  duration_ms?: number
  created_at: string
}

interface DebugEvent {
  id: string
  event_type: string
  severity: string
  conversation_id?: string
  operation_context?: string
  event_data?: any
  error_stack?: string
  environment?: string
  created_at: string
}

interface ThreeDSSession {
  id: string
  conversation_id: string
  order_number: string
  status: string
  payment_id?: string
  three_ds_html_content?: string
  payment_page_url?: string
  customer_email?: string
  customer_phone?: string
  amount?: number
  currency?: string
  initialized_at: string
  redirected_at?: string
  completed_at?: string
  last_callback_at?: string
  session_data?: any
  callback_data?: any
}

export default function IyzicoLogsPage() {
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([])
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([])
  const [threeDSSessions, setThreeDSSessions] = useState<ThreeDSSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const [transactionsRes, debugEventsRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/iyzico/logs/transactions'),
        fetch('/api/admin/iyzico/logs/debug-events'),
        fetch('/api/admin/iyzico/logs/3ds-sessions')
      ])

      if (!transactionsRes.ok || !debugEventsRes.ok || !sessionsRes.ok) {
        throw new Error('Log verilerini alırken hata oluştu')
      }

      const [transactions, debugEvents, sessions] = await Promise.all([
        transactionsRes.json(),
        debugEventsRes.json(),
        sessionsRes.json()
      ])

      setTransactionLogs(transactions.data || [])
      setDebugEvents(debugEvents.data || [])
      setThreeDSSessions(sessions.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedLogs(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      failure: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      error: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
      initialized: { variant: 'secondary' as const, icon: Activity, color: 'text-blue-600' },
      redirected: { variant: 'outline' as const, icon: Activity, color: 'text-orange-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      info: { variant: 'outline' as const, color: 'text-blue-600' },
      warning: { variant: 'secondary' as const, color: 'text-yellow-600' },
      error: { variant: 'destructive' as const, color: 'text-red-600' },
      critical: { variant: 'destructive' as const, color: 'text-red-800' }
    }

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.error

    return (
      <Badge variant={config.variant}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      relative: formatDistanceToNow(date, { addSuffix: true, locale: tr }),
      absolute: date.toLocaleString('tr-TR')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loglar yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İyzico Logları</h1>
          <p className="text-muted-foreground">
            İyzico ödeme işlemlerinin detaylı logları ve debugging bilgileri
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Transaction Logs ({transactionLogs.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            3DS Sessions ({threeDSSessions.length})
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Debug Events ({debugEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Logs</CardTitle>
              <CardDescription>
                Tüm İyzico API çağrıları ve işlem sonuçları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {transactionLogs.map((log) => {
                    const isExpanded = expandedLogs.has(log.id)
                    const dateInfo = formatDate(log.created_at)

                    return (
                      <Collapsible key={log.id}>
                        <Card className="transition-colors hover:bg-muted/50">
                          <CollapsibleTrigger asChild>
                            <CardHeader 
                              className="cursor-pointer"
                              onClick={() => toggleExpanded(log.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <div>
                                    <div className="font-semibold">
                                      {log.operation_type.toUpperCase()}
                                      {log.order_number && ` - ${log.order_number}`}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {log.conversation_id} • {dateInfo.relative}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {log.duration_ms && (
                                    <Badge variant="outline">
                                      {formatDuration(log.duration_ms)}
                                    </Badge>
                                  )}
                                  {getStatusBadge(log.status)}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Conversation ID:</strong> {log.conversation_id}
                                </div>
                                <div>
                                  <strong>Operation:</strong> {log.operation_type}
                                </div>
                                {log.payment_id && (
                                  <div>
                                    <strong>Payment ID:</strong> {log.payment_id}
                                  </div>
                                )}
                                {log.ip_address && (
                                  <div>
                                    <strong>IP Address:</strong> {log.ip_address}
                                  </div>
                                )}
                              </div>

                              {log.iyzico_error_code && (
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>İyzico Error {log.iyzico_error_code}:</strong> {log.iyzico_error_message}
                                  </AlertDescription>
                                </Alert>
                              )}

                              <Tabs defaultValue="response" className="w-full">
                                <TabsList>
                                  <TabsTrigger value="response">Response Data</TabsTrigger>
                                  {log.request_data && (
                                    <TabsTrigger value="request">Request Data</TabsTrigger>
                                  )}
                                  {log.error_data && (
                                    <TabsTrigger value="error">Error Data</TabsTrigger>
                                  )}
                                </TabsList>

                                <TabsContent value="response">
                                  <ScrollArea className="h-40 w-full rounded border p-4">
                                    <pre className="text-xs">
                                      {JSON.stringify(log.response_data, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                </TabsContent>

                                {log.request_data && (
                                  <TabsContent value="request">
                                    <ScrollArea className="h-40 w-full rounded border p-4">
                                      <pre className="text-xs">
                                        {JSON.stringify(log.request_data, null, 2)}
                                      </pre>
                                    </ScrollArea>
                                  </TabsContent>
                                )}

                                {log.error_data && (
                                  <TabsContent value="error">
                                    <ScrollArea className="h-40 w-full rounded border p-4">
                                      <pre className="text-xs">
                                        {JSON.stringify(log.error_data, null, 2)}
                                      </pre>
                                    </ScrollArea>
                                  </TabsContent>
                                )}
                              </Tabs>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3D Secure Sessions</CardTitle>
              <CardDescription>
                Aktif ve tamamlanmış 3D Secure ödemelerinizi takip edin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {threeDSSessions.map((session) => {
                    const dateInfo = formatDate(session.initialized_at)

                    return (
                      <Card key={session.id} className="transition-colors hover:bg-muted/50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">
                                {session.order_number}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {session.conversation_id} • {dateInfo.relative}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {session.amount && (
                                <Badge variant="outline">
                                  {session.amount} {session.currency}
                                </Badge>
                              )}
                              {getStatusBadge(session.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {session.customer_email && (
                              <div>
                                <strong>Email:</strong> {session.customer_email}
                              </div>
                            )}
                            {session.payment_id && (
                              <div>
                                <strong>Payment ID:</strong> {session.payment_id}
                              </div>
                            )}
                            {session.completed_at && (
                              <div>
                                <strong>Tamamlandı:</strong> {formatDate(session.completed_at).relative}
                              </div>
                            )}
                            {session.last_callback_at && (
                              <div>
                                <strong>Son Callback:</strong> {formatDate(session.last_callback_at).relative}
                              </div>
                            )}
                          </div>

                          {session.three_ds_html_content && (
                            <div>
                              <strong>3DS HTML Content:</strong>
                              <Badge variant="outline" className="ml-2">
                                {session.three_ds_html_content.length} karakter
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debug Events</CardTitle>
              <CardDescription>
                Sistem hataları ve debugging bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {debugEvents.map((event) => {
                    const dateInfo = formatDate(event.created_at)

                    return (
                      <Card key={event.id} className="transition-colors hover:bg-muted/50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">
                                {event.event_type.replace('_', ' ').toUpperCase()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {event.operation_context} • {dateInfo.relative}
                              </div>
                            </div>
                            {getSeverityBadge(event.severity)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {event.error_stack && (
                            <ScrollArea className="h-32 w-full rounded border p-4 font-mono text-xs">
                              {event.error_stack}
                            </ScrollArea>
                          )}
                          {event.event_data && (
                            <ScrollArea className="h-40 w-full rounded border p-4 mt-4">
                              <pre className="text-xs">
                                {JSON.stringify(event.event_data, null, 2)}
                              </pre>
                            </ScrollArea>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 