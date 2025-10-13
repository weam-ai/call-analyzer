'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Eye,
  Brain,
  Zap,
  Activity,
  Calendar,
  RefreshCw,
  ExternalLink,
  Trash2,
  Download
} from 'lucide-react'
import { Analysis } from '@/types/analysis'
import { formatText, toPlainText, getAnalysisTitle } from '@/utils/textFormatter'
import { apiUrl } from '@/config/frontend-config'

interface AnalysisDashboardProps {
  onAnalysisSelect: (analysis: Analysis) => void
  onAnalysisDelete: (analysisId: string) => void
}

interface DashboardStats {
  totalAnalyses: number
  completedAnalyses: number
  failedAnalyses: number
  totalCost: number
  avgProcessingTime: number
  avgConfidence: number
}

export function AnalysisDashboard({ onAnalysisSelect, onAnalysisDelete }: AnalysisDashboardProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchAnalyses()
    fetchStats()
  }, [])

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/comprehensive/`)
      const data = await response.json()
      
      if (data.success) {
        setAnalyses(data.data.analyses)
      } else {
        setError(data.message || 'Failed to fetch analyses')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/comprehensive/stats/overview`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data.overview)
      }
    } catch (err) {
      // Error fetching stats - silently handle
    }
  }

  const handleDelete = async (analysisId: string) => {
    try {
      const response = await fetch(`${apiUrl}/comprehensive/${analysisId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setAnalyses(prev => prev.filter(a => a._id !== analysisId))
        onAnalysisDelete(analysisId)
      }
    } catch (err) {
      // Error deleting analysis - silently handle
    }
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'fathom': return <Zap className="w-4 h-4" />
      case 'audio': return <BarChart3 className="w-4 h-4" />
      case 'transcript': return <Brain className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getServiceColor = (serviceType: string) => {
    switch (serviceType) {
      case 'fathom': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'audio': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'transcript': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const filteredAnalyses = analyses.filter(analysis => {
    if (activeTab === 'all') return true
    return analysis.serviceType === activeTab
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading analyses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAnalyses} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Analysis Dashboard
              </CardTitle>
              <CardDescription className="text-slate-600">
                Manage and view all your sales call analyses
              </CardDescription>
            </div>
            <Button onClick={fetchAnalyses} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Analyses</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalAnalyses}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {stats.completedAnalyses} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.totalAnalyses > 0 ? Math.round((stats.completedAnalyses / stats.totalAnalyses) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-green-600 mt-1">
                {stats.failedAnalyses} failed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Cost</p>
                  <p className="text-2xl font-bold text-orange-700">
                    ${stats.totalCost.toFixed(4)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-orange-600 mt-1">
                AI processing costs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg Processing</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {Math.round(stats.avgProcessingTime / 1000)}s
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {Math.round(stats.avgConfidence * 100)}% avg confidence
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analyses List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({analyses.length})</TabsTrigger>
              <TabsTrigger value="fathom">Fathom ({analyses.filter(a => a.serviceType === 'fathom').length})</TabsTrigger>
              <TabsTrigger value="audio">Audio ({analyses.filter(a => a.serviceType === 'audio').length})</TabsTrigger>
              <TabsTrigger value="transcript">Transcript ({analyses.filter(a => a.serviceType === 'transcript').length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No analyses found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => (
                <Card key={analysis._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getServiceColor(analysis.serviceType)} px-3 py-1`}>
                            {getServiceIcon(analysis.serviceType)}
                            <span className="ml-1 capitalize">{analysis.serviceType}</span>
                          </Badge>
                          <Badge className={`${getStatusColor(analysis.status)} px-3 py-1`}>
                            {analysis.status}
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {getAnalysisTitle(analysis)}
                            </h3>
                            {analysis.results?.sentiment?.overall && (
                              <span className={`text-sm font-medium ${getSentimentColor(analysis.results.sentiment.overall)}`}>
                                {analysis.results.sentiment.overall}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.round((analysis.processing?.llmAnalysis?.processingTime || 0) / 1000)}s
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${(analysis.processing?.llmAnalysis?.cost || 0).toFixed(4)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {Math.round((analysis.processing?.transcript?.confidence || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAnalysisSelect(analysis)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(analysis._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
