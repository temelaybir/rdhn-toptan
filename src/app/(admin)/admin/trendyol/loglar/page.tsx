'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Clock,
  Eye,
  Calendar,
  Database,
  Activity,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Trash2
} from 'lucide-react'

interface SyncLog {
  id: string
  operation_type: 'CREATE_PRODUCT' | 'UPDATE_STOCK' | 'UPDATE_PRICE' | 'SYNC_CATEGORIES' | 'UPLOAD_IMAGE'
  product_id?: string
  status: 'SUCCESS' | 'ERROR' | 'PENDING'
  message: string
  response_data?: any
  error_details?: string
  execution_time_ms: number
  created_at: string
  product_name?: string
  product_sku?: string
}

interface LogFilters {
  operation_type: string
  status: string
  date_from: string
  date_to: string
  search: string
}

export default function TrendyolLogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null)
  const [logDetailOpen, setLogDetailOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  const [filters, setFilters] = useState<LogFilters>({
    operation_type: 'all',
    status: 'all',
    date_from: '',
    date_to: '',
    search: ''
  })

  // Operation type configurations
  const operationTypes = [
    { value: 'all', label: 'Tüm İşlemler' },
    { value: 'CREATE_PRODUCT', label: 'Ürün Oluşturma' },
    { value: 'UPDATE_STOCK', label: 'Stok Güncelleme' },
    { value: 'UPDATE_PRICE', label: 'Fiyat Güncelleme' },
    { value: 'SYNC_CATEGORIES', label: 'Kategori Senkronizasyonu' },
    { value: 'UPLOAD_IMAGE', label: 'Görsel Yükleme' }
  ]

  // Status configurations
  const statusTypes = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'SUCCESS', label: 'Başarılı' },
    { value: 'ERROR', label: 'Hatalı' },
    { value: 'PENDING', label: 'Beklemede' }
  ]

  // Status badge configuration
  const getStatusBadge = (status: SyncLog['status']) => {
    const configs = {
      SUCCESS: { 
        label: 'Başarılı', 
        variant: 'default' as const, 
        icon: <CheckCircle className="w-3 h-3" />,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      ERROR: { 
        label: 'Hatalı', 
        variant: 'destructive' as const, 
        icon: <XCircle className="w-3 h-3" /> 
      },
      PENDING: { 
        label: 'Beklemede', 
        variant: 'default' as const, 
        icon: <Clock className="w-3 h-3" /> 
      }
    }

    const config = configs[status]
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    )
  }

  // Operation type badge configuration
  const getOperationBadge = (operationType: SyncLog['operation_type']) => {
    const configs = {
      CREATE_PRODUCT: { label: 'Ürün Oluştur', color: 'bg-blue-100 text-blue-800' },
      UPDATE_STOCK: { label: 'Stok Güncelle', color: 'bg-purple-100 text-purple-800' },
      UPDATE_PRICE: { label: 'Fiyat Güncelle', color: 'bg-orange-100 text-orange-800' },
      SYNC_CATEGORIES: { label: 'Kategori Sync', color: 'bg-green-100 text-green-800' },
      UPLOAD_IMAGE: { label: 'Görsel Yükle', color: 'bg-pink-100 text-pink-800' }
    }

    const config = configs[operationType]
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  // Load logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filters.operation_type !== 'all') params.append('operation_type', filters.operation_type)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/trendyol/sync/logs?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        toast.error('Loglar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Logs loading error:', error)
      toast.error('Loglar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 30000) // 30 seconds
      setRefreshInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [autoRefresh, loadLogs])

  // Filter logs
  useEffect(() => {
    setFilteredLogs(logs)
  }, [logs])

  // Export logs
  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      setExporting(true)
      
      const params = new URLSearchParams()
      params.append('format', format)
      if (filters.operation_type !== 'all') params.append('operation_type', filters.operation_type)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)

      const response = await fetch(`/api/trendyol/sync/logs/export?${params.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `trendyol-logs-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success(`Loglar ${format.toUpperCase()} formatında indirildi`)
      } else {
        toast.error('Log export işlemi başarısız')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Log export sırasında hata oluştu')
    } finally {
      setExporting(false)
    }
  }

  // Clear logs
  const clearLogs = async () => {
    try {
      const response = await fetch('/api/trendyol/sync/logs', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Loglar başarıyla temizlendi')
        await loadLogs()
      } else {
        toast.error('Log temizleme işlemi başarısız')
      }
    } catch (error) {
      console.error('Clear logs error:', error)
      toast.error('Log temizleme sırasında hata oluştu')
    }
  }

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  // Format execution time
  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trendyol Sync Logları</h1>
          <p className="text-muted-foreground">
            Tüm senkronizasyon işlemlerinin detaylı kayıtları
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Otomatik Yenile
          </Button>
          
          <Button onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="w-4 h-4 mr-2" />
                İşlemler
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportLogs('csv')} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLogs('json')} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                JSON Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearLogs} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Logları Temizle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Log</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Başarılı</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(l => l.status === 'SUCCESS').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hatalı</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter(l => l.status === 'ERROR').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ortalama Süre</p>
                <p className="text-2xl font-bold">
                  {logs.length > 0 
                    ? formatExecutionTime(logs.reduce((acc, log) => acc + log.execution_time_ms, 0) / logs.length)
                    : '0ms'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">İşlem Tipi</label>
              <Select 
                value={filters.operation_type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, operation_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Durum</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Başlangıç Tarihi</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Bitiş Tarihi</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Arama</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mesaj veya ürün ara..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Logları ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Trendyol senkronizasyon işlemlerinin detaylı kayıtları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loglar yükleniyor...</span>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih/Saat</TableHead>
                    <TableHead>İşlem Tipi</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Mesaj</TableHead>
                    <TableHead>Süre</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        {getOperationBadge(log.operation_type)}
                      </TableCell>
                      <TableCell>
                        {log.product_name ? (
                          <div>
                            <div className="font-medium">{log.product_name}</div>
                            <div className="text-xs text-muted-foreground">{log.product_sku}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.message}>
                          {log.message}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatExecutionTime(log.execution_time_ms)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log)
                            setLogDetailOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {Object.values(filters).some(v => v && v !== 'all') 
                          ? 'Filtrelere uygun log bulunamadı' 
                          : 'Henüz log kaydı bulunmuyor'
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={logDetailOpen} onOpenChange={setLogDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Log Detayları</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.created_at)} - {selectedLog?.operation_type}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Genel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">İşlem Tipi</label>
                        <div>{getOperationBadge(selectedLog.operation_type)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Durum</label>
                        <div>{getStatusBadge(selectedLog.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Süre</label>
                        <div className="font-mono">{formatExecutionTime(selectedLog.execution_time_ms)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tarih</label>
                        <div className="font-mono">{formatDate(selectedLog.created_at)}</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedLog.product_name && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Ürün Bilgileri</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Ürün Adı</label>
                          <div className="font-medium">{selectedLog.product_name}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">SKU</label>
                          <div className="font-mono">{selectedLog.product_sku}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Message */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mesaj</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={selectedLog.message}
                      readOnly
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                {/* Response Data */}
                {selectedLog.response_data && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Yanıt Verileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={JSON.stringify(selectedLog.response_data, null, 2)}
                        readOnly
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Error Details */}
                {selectedLog.error_details && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-destructive">Hata Detayları</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={selectedLog.error_details}
                        readOnly
                        className="min-h-[150px] text-destructive"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 