'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Calendar, 
  Star, 
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mic,
  Link,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Lightbulb
} from 'lucide-react'
import { Analysis } from '@/types/analysis'
import { formatText, toPlainText } from '@/utils/textFormatter'

interface CallHistoryProps {
  onAnalysisSelect: (analysis: Analysis) => void
  onAnalysisDelete: (analysisId: string) => void
}

export function CallHistory({ onAnalysisSelect, onAnalysisDelete }: CallHistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterService, setFilterService] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAnalyses, setTotalAnalyses] = useState(0)

  const fetchAnalyses = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5001/api/comprehensive/?page=${page}&limit=10`)
      const data = await response.json()
      
      if (data.success) {
        setAnalyses(data.data.analyses)
        setTotalPages(data.data.pagination.pages)
        setTotalAnalyses(data.data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyses(currentPage)
  }, [currentPage])

  const handleDelete = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return

    try {
      const response = await fetch(`http://localhost:5001/api/comprehensive/${analysisId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setAnalyses(prev => prev.filter(a => a._id !== analysisId))
        onAnalysisDelete(analysisId)
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error)
    }
  }

  const handleRefresh = () => {
    fetchAnalyses(currentPage)
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'audio': return <Mic className="w-4 h-4" />
      case 'fathom': return <Link className="w-4 h-4" />
      case 'transcript': return <FileText className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const getServiceColor = (serviceType: string) => {
    switch (serviceType) {
      case 'audio': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'fathom': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'transcript': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600'
    if (rating >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchTerm === '' || 
      analysis.input?.fathomUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.input?.transcript?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.input?.audioFile?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || analysis.status === filterStatus
    const matchesService = filterService === 'all' || analysis.serviceType === filterService
    
    return matchesSearch && matchesStatus && matchesService
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading call history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Call History</h2>
        <p className="text-slate-600">View and manage your sales call analyses</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Analyses</p>
                <p className="text-2xl font-bold text-blue-700">{totalAnalyses}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-700">
                  {analyses.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Rating</p>
                <p className="text-2xl font-bold text-purple-700">
                  {analyses.length > 0 
                    ? (analyses.reduce((sum, a) => sum + (a.results?.callRating || 0), 0) / analyses.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Total Insights</p>
                <p className="text-2xl font-bold text-amber-700">
                  {analyses.reduce((sum, a) => sum + (a.results?.keyInsights?.length || 0), 0)}
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Services</option>
                <option value="audio">Audio</option>
                <option value="fathom">Fathom</option>
                <option value="transcript">Transcript</option>
              </select>
              
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyses List */}
      <div className="space-y-4">
        {filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No analyses found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterService !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by running your first analysis'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnalyses.map((analysis) => (
            <Card key={analysis._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(analysis.serviceType)}
                        <Badge className={getServiceColor(analysis.serviceType)}>
                          {analysis.serviceType}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(analysis.status)}>
                        {analysis.status}
                      </Badge>
                      {analysis.results?.callRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className={`font-semibold ${getRatingColor(analysis.results.callRating)}`}>
                            {analysis.results.callRating}/10
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {analysis.input?.fathomUrl || 
                         analysis.input?.audioFile?.originalName || 
                         'Transcript Analysis'}
                      </h3>
                      
                      <div 
                        className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: formatText(analysis.results?.summary || 'Analysis in progress...')
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(analysis.createdAt)}</span>
                      </div>
                      
                    </div>

                    {/* Key Metrics */}
                    {analysis.results && (
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {analysis.results.keyInsights && analysis.results.keyInsights.length > 0 && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Lightbulb className="w-4 h-4" />
                            <span>{analysis.results.keyInsights.length} insights</span>
                          </div>
                        )}
                        
                        {analysis.results.salesOpportunities?.upsellingOpportunities && 
                         analysis.results.salesOpportunities.upsellingOpportunities.length > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>{analysis.results.salesOpportunities.upsellingOpportunities.length} upselling</span>
                          </div>
                        )}
                        
                        {analysis.results.salesOpportunities?.crossSellingOpportunities && 
                         analysis.results.salesOpportunities.crossSellingOpportunities.length > 0 && (
                          <div className="flex items-center gap-1 text-purple-600">
                            <Target className="w-4 h-4" />
                            <span>{analysis.results.salesOpportunities.crossSellingOpportunities.length} cross-selling</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAnalysisSelect(analysis)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(analysis._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
