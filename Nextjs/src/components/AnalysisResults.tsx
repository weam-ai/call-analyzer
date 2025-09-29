'use client'

import { Analysis } from '@/types/analysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCost, formatDuration, getStatusColor, getServiceColor } from '@/lib/utils'
import { 
  CheckCircle, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react'

interface AnalysisResultsProps {
  analysis: Analysis
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const results = analysis.results || {}
  const processing = analysis.processing || {}
  const metadata = analysis.metadata || {}
  const serviceType = analysis.serviceType
  const status = analysis.status

  if (status !== 'completed') {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Analysis in Progress
          </CardTitle>
          <CardDescription>
            Your analysis is being processed. This may take a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              {status === 'processing' ? 'Processing...' : 'Pending...'}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Analysis Header */}
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <CardTitle className="text-3xl font-bold text-slate-900">Analysis Complete</CardTitle>
          </div>
          <CardDescription className="text-lg text-slate-600">
            Your sales call has been analyzed successfully in {formatDuration(metadata.processingTime / 1000)}
          </CardDescription>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className={`${getServiceColor(serviceType)} px-4 py-2 text-sm font-medium`}>
              {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Analysis
            </Badge>
            <Badge className={`${getStatusColor(status)} px-4 py-2 text-sm font-medium`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <div className="text-sm text-slate-600">Tokens Used</div>
              <div className="font-semibold text-slate-900">{processing.llmAnalysis?.tokensUsed?.total || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm mb-8">
          <TabsTrigger value="summary" className="flex items-center gap-2 py-3">
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2 py-3">
            <Lightbulb className="w-4 h-4" />
            <span className="font-medium">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2 py-3">
            <Users className="w-4 h-4" />
            <span className="font-medium">Participants</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2 py-3">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Recommendations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Call Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed text-lg">{results?.summary || 'No summary available'}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Overall Sentiment:</span>
                  <Badge variant={results.sentiment?.overall === 'positive' ? 'default' : 
                                  results.sentiment?.overall === 'negative' ? 'destructive' : 'secondary'}>
                    {results.sentiment?.overall ? results.sentiment.overall.charAt(0).toUpperCase() + results.sentiment.overall.slice(1) : 'Unknown'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((results.sentiment?.confidence || 0) * 100)}% confidence)
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Positive</span>
                    <span>{Math.round((results.sentiment?.breakdown?.positive || 0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(results.sentiment?.breakdown?.positive || 0) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Neutral</span>
                    <span>{Math.round((results.sentiment?.breakdown?.neutral || 0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(results.sentiment?.breakdown?.neutral || 0) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Negative</span>
                    <span>{Math.round((results.sentiment?.breakdown?.negative || 0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(results.sentiment?.breakdown?.negative || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Key Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {(results.topics || []).map((topic, index) => (
                  <Badge key={index} variant="outline" className="px-4 py-2 text-sm font-medium bg-slate-50 text-slate-700 border-slate-300">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {(results.keyInsights || []).map((insight, index) => (
                  <li key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                <Target className="w-6 h-6 text-green-600" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {(results.actionItems || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-600 rounded-full mt-1 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                <Users className="w-6 h-6 text-purple-600" />
                Call Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {(results.participants || []).map((participant, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-900">{participant.name || 'Unknown'}</h4>
                      <Badge className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 border-blue-200">
                        {participant.role || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 mb-4">
                      Speaking time: <span className="font-semibold text-slate-900">{Math.round((participant.speakingTime || 0) * 100)}%</span>
                    </div>
                    <div className="space-y-3">
                      <span className="text-sm font-semibold text-slate-900">Key Points:</span>
                      <ul className="space-y-2">
                        {(participant.keyPoints || []).map((point, pointIndex) => (
                          <li key={pointIndex} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-slate-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {(results.recommendations || []).map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-3 h-3 bg-green-600 rounded-full mt-1 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {(results.opportunities || []).length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {(results.opportunities || []).map((opportunity, index) => (
                    <li key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full mt-1 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(results.riskFactors || []).length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {(results.riskFactors || []).map((risk, index) => (
                    <li key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="w-3 h-3 bg-red-600 rounded-full mt-1 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
