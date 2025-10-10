'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { formatText, toPlainText, getAnalysisTitle } from '@/lib/utils/text-formatters'
import { AuthorizationMessage } from '@/components/features/auth/AuthorizationMessage'
import { apiUrl } from '@/config/frontend-config'

interface CallHistoryProps {
  onAnalysisSelect: (analysis: Analysis) => void
  onAnalysisDelete: (analysisId: string) => void
  onDeleteClick: (analysisId: string) => void
  onAnalysisDeleted: (analysisId: string) => void
  deletedAnalysisId: string | null
  user?: any // User data from session
}

export function CallHistory({ onAnalysisSelect, onAnalysisDelete, onDeleteClick, onAnalysisDeleted, deletedAnalysisId, user }: CallHistoryProps) {
  const [allAnalyses, setAllAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterService, setFilterService] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10) // Set to 10 records per page for proper pagination
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalAnalyses, setTotalAnalyses] = useState(0)
  const [searchDebounce, setSearchDebounce] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      setIsSearching(true)
      
      // If no company ID, show empty results
      if (!companyId) {
        setAllAnalyses([])
        setTotalPages(0)
        setTotalAnalyses(0)
        return
      }
      
      // Use server-side pagination and filtering
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        companyId: companyId
      })
      
      // Add search and filter parameters
      if (searchDebounce.trim()) {
        params.append('search', searchDebounce.trim())
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      if (filterService !== 'all') {
        params.append('serviceType', filterService)
      }
      
      const response = await fetch(`${apiUrl}/comprehensive/?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAllAnalyses(data.data.analyses)
        setTotalPages(data.data.pagination.pages)
        setTotalAnalyses(data.data.pagination.total)
      }
    } catch (error) {
      // Error fetching analyses - silently handle
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  // Set company ID from user prop
  useEffect(() => {
    if (user && user.companyId) {
      setCompanyId(user.companyId)
    } else {
      setCompanyId(null)
    }
  }, [user])

  // No more client-side filtering - server handles everything

  // Debounce search term with longer delay for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only search if term is empty or has at least 2 characters
      if (searchTerm === '' || searchTerm.length >= 2) {
        setSearchDebounce(searchTerm)
      }
    }, 800) // 800ms delay to reduce API calls

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchDebounce, filterStatus, filterService])

  // Fetch analyses when companyId, page, or filters change
  useEffect(() => {
    if (companyId) {
      fetchAnalyses()
    }
  }, [companyId, currentPage, searchDebounce, filterStatus, filterService])

  // Handle deletion notification from parent component
  useEffect(() => {
    if (deletedAnalysisId) {
      // Remove the deleted analysis from the list
      setAllAnalyses(prev => prev.filter(a => a._id !== deletedAnalysisId))
      
      // Update total count
      setTotalAnalyses(prev => Math.max(0, prev - 1))
      
      // Recalculate total pages
      const newTotalPages = Math.ceil(Math.max(0, totalAnalyses - 1) / itemsPerPage)
      setTotalPages(newTotalPages)
      
      // Adjust current page if needed
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
      
      // Notify parent that we've processed the deletion
      onAnalysisDeleted(deletedAnalysisId)
    }
  }, [deletedAnalysisId, totalAnalyses, itemsPerPage, currentPage, onAnalysisDeleted])

  const handleDeleteClick = (analysisId: string) => {
    onDeleteClick(analysisId)
  }

  const handleRefresh = () => {
    fetchAnalyses()
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


  // Calculate pagination display
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalAnalyses)
  const currentPageAnalyses = allAnalyses // Server already returns the correct page

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

  // Show authorization message if no company ID
  // TEMPORARY: Add this line to force show AuthorizationMessage for testing
  // if (true) return <AuthorizationMessage />
  
  if (!companyId) {
    return <AuthorizationMessage />
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
                  {allAnalyses.filter(a => a.status === 'completed').length}
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
                  {allAnalyses.length > 0 
                    ? (allAnalyses.reduce((sum, a) => sum + (a.results?.callRating || 0), 0) / allAnalyses.length).toFixed(1)
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
                  {allAnalyses.reduce((sum, a) => sum + (a.results?.keyInsights?.length || 0), 0)}
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by type, status, rating, file names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  )}
                  {!isSearching && searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                      {totalAnalyses} result{totalAnalyses !== 1 ? 's' : ''}
                    </div>
                  )}
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

          </div>
        </CardContent>
      </Card>


      {/* Analyses List */}
      <div className="space-y-4">
        {currentPageAnalyses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {!companyId ? 'Authentication Required' : 'No analyses found'}
              </h3>
              <p className="text-gray-500">
                {!companyId 
                  ? 'Please log in to view your analysis history'
                  : totalAnalyses === 0
                    ? 'No analyses found matching your criteria'
                    : 'Start by running your first analysis'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          currentPageAnalyses.map((analysis) => (
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
                        {getAnalysisTitle(analysis)}
                      </h3>
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
                      onClick={() => handleDeleteClick(analysis._id)}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, totalAnalyses)} of {totalAnalyses} results
          </div>
          
          <div className="flex items-center gap-2">
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
              {(() => {
                const pages = []
                const maxVisiblePages = 5
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                
                // Adjust start page if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1)
                }
                
                // Add first page and ellipsis if needed
                if (startPage > 1) {
                  pages.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="w-8 h-8 p-0"
                    >
                      1
                    </Button>
                  )
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                    )
                  }
                }
                
                // Add visible pages
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i)}
                      className="w-8 h-8 p-0"
                    >
                      {i}
                    </Button>
                  )
                }
                
                // Add last page and ellipsis if needed
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                    )
                  }
                  pages.push(
                    <Button
                      key={totalPages}
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  )
                }
                
                return pages
              })()}
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
        </div>
      )}
    </div>
  )
}
