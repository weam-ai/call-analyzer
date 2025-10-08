'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, 
  Users, 
  MapPin, 
  Globe, 
  TrendingUp, 
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye,
  Brain,
  Zap,
  Activity,
  Calendar,
  FileText,
  Link as LinkIcon,
  Mic,
  Home
} from 'lucide-react'
import { Analysis } from '@/types/analysis'
import { FathomTranscriptViewer } from './FathomTranscriptViewer'
import { formatText, toPlainText } from '@/utils/textFormatter'

interface ComprehensiveAnalysisResultsProps {
  analysis: Analysis
  onGoHome?: () => void
}

export function ComprehensiveAnalysisResults({ analysis, onGoHome }: ComprehensiveAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!analysis) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No analysis data available</p>
        </div>
      </div>
    )
  }

  const results = analysis.results || {}
  const processing = analysis.processing || {}
  const input = analysis.input || {}
  
  // Extract metrics from the correct structure
  const callRating = results.callRating || 0
  const opportunities = results.salesOpportunities || {}
  const upsellingCount = opportunities.upsellingOpportunities?.length || 0
  const crossSellingCount = opportunities.crossSellingOpportunities?.length || 0
  const totalOpportunities = upsellingCount + crossSellingCount

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600'
    if (rating >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 8) return 'bg-green-100 text-green-800 border-green-200'
    if (rating >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-8">
      {/* Main Analysis Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-slate-900">
                  Comprehensive Sales Call Analysis
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 mt-2">
                  Detailed insights and recommendations for sales improvement
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{callRating}</div>
                    <div className="text-xs text-white">/10</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">Rating</p>
              </div>
              <div className="text-center">
                <button 
                  onClick={onGoHome}
                  className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Home className="w-8 h-8 text-white" />
                </button>
                <p className="text-sm text-slate-600 mt-2">Go Home</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>


      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl p-2 gap-2 border border-slate-200">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 flex-1 min-w-0 text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="demographics" 
            className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 flex-1 min-w-0 text-sm font-medium"
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Demographics</span>
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 flex-1 min-w-0 text-sm font-medium"
          >
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Performance</span>
          </TabsTrigger>
          <TabsTrigger 
            value="opportunities" 
            className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 flex-1 min-w-0 text-sm font-medium"
          >
            <Target className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Opportunities</span>
          </TabsTrigger>
          <TabsTrigger 
            value="insights" 
            className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 flex-1 min-w-0 text-sm font-medium"
          >
            <Lightbulb className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Insights</span>
          </TabsTrigger>
          <TabsTrigger 
            value="detailed" 
            className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 flex-1 min-w-0 text-sm font-medium"
          >
            <Brain className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Detailed Analysis</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-8">
          {/* Fathom Transcript Viewer - Show only for Fathom analyses */}
          {analysis.serviceType === 'fathom' && processing.transcript?.text && (
            <FathomTranscriptViewer analysis={analysis} />
          )}

          {/* Comprehensive Analysis Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Brain className="w-6 h-6 text-purple-600" />
                Comprehensive Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Call Overview */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Call Overview
                </h3>
                <div 
                  className="text-slate-700 leading-relaxed text-base prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatText(analysis.results?.summary || analysis.results?.callDescription || 'No call overview available')
                  }}
                />
              </div>

              {/* Key Insights */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis.results?.keyInsights || []).map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {(analysis.results?.recommendations || []).map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-700 text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Data */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Brain className="w-6 h-6 text-indigo-600" />
                Complete Analysis Data
              </CardTitle>
              <CardDescription className="text-lg">
                Comprehensive analysis results with all available data points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Call Description */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Call Description
                </h3>
                <div 
                  className="text-slate-700 leading-relaxed text-base prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatText(analysis.results?.callDescription || 'No call description available')
                  }}
                />
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Summary
                </h3>
                <div 
                  className="text-slate-700 leading-relaxed text-base prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatText(analysis.results?.summary || 'No summary available')
                  }}
                />
              </div>

              {/* Key Insights with Enhanced Styling */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Key Insights
                </h3>
                <div className="space-y-4">
                  {(analysis.results?.keyInsights || []).map((insight, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed flex-1">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>


        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Prospect Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Team Size</p>
                      <p className="text-slate-600">{results.prospectDemographics?.teamSize || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Work Volume</p>
                      <p className="text-slate-600">{results.prospectDemographics?.workVolume || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Location</p>
                      <p className="text-slate-600">{results.prospectDemographics?.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Previous Experience</p>
                      <p className="text-slate-600">{results.prospectDemographics?.previousExperience || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Likelihood of Closing</p>
                      <p className="text-slate-600">{results.prospectDemographics?.likelihoodOfClosing || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Website</p>
                      <p className="text-slate-600">{results.prospectDemographics?.website || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Business Summary</h4>
                <div 
                  className="text-slate-600 bg-slate-50 p-3 rounded-lg prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatText(results.prospectDemographics?.businessSummary || 'No business summary available')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Sales Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Responsiveness</h4>
                    <p className="text-sm text-green-700">{results.salesPerformance?.responsiveness || 'Not specified'}</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Satisfaction</h4>
                    <p className="text-sm text-blue-700">{results.salesPerformance?.satisfaction || 'Not specified'}</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Engagement</h4>
                    <p className="text-sm text-purple-700">{results.salesPerformance?.engagement || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Recommendations for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(results.recommendations || []).map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          {/* Product/Service Gap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Product/Service Gap Analysis
              </CardTitle>
              <CardDescription>
                Products or services from your website that weren't discussed during the call
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(results.salesOpportunities?.productServiceGap || []).map((gap, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{gap}</p>
                  </div>
                ))}
                {(!results.salesOpportunities?.productServiceGap || results.salesOpportunities.productServiceGap.length === 0) && (
                  <p className="text-slate-500 text-sm">No gaps identified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upselling Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Upselling Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(results.salesOpportunities?.upsellingOpportunities || []).map((opportunity, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">{opportunity.opportunity}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-600 font-medium">Relevance:</span>
                        <span className={`ml-1 font-bold ${getScoreColor(opportunity.relevance)}`}>
                          {opportunity.relevance}/5
                        </span>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">Likelihood:</span>
                        <span className={`ml-1 font-bold ${getScoreColor(opportunity.likelihood)}`}>
                          {opportunity.likelihood}/5
                        </span>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">Revenue Impact:</span>
                        <span className={`ml-1 font-bold ${getScoreColor(opportunity.revenueImpact)}`}>
                          {opportunity.revenueImpact}/5
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!results.salesOpportunities?.upsellingOpportunities || results.salesOpportunities.upsellingOpportunities.length === 0) && (
                  <p className="text-slate-500 text-sm">No upselling opportunities identified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cross-selling Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Cross-selling Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(results.salesOpportunities?.crossSellingOpportunities || []).map((opportunity, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">{opportunity.opportunity}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600 font-medium">Relevance:</span>
                        <span className={`ml-1 font-bold ${getScoreColor(opportunity.relevance)}`}>
                          {opportunity.relevance}/5
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Likelihood:</span>
                        <span className={`ml-1 font-bold ${getScoreColor(opportunity.likelihood)}`}>
                          {opportunity.likelihood}/5
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Revenue Impact:</span>
                        <span className={`ml-1 font-bold ${getScoreColor(opportunity.revenueImpact)}`}>
                          {opportunity.revenueImpact}/5
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!results.salesOpportunities?.crossSellingOpportunities || results.salesOpportunities.crossSellingOpportunities.length === 0) && (
                  <p className="text-slate-500 text-sm">No cross-selling opportunities identified</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Other Notable Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(results.otherNotableFindings || []).map((finding, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{finding}</p>
                    </div>
                  ))}
                  {(!results.otherNotableFindings || results.otherNotableFindings.length === 0) && (
                    <p className="text-slate-500 text-sm">No additional findings</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Analysis Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed Analysis Tab */}
        <TabsContent value="detailed" className="space-y-6">
          {/* Complete Analysis Data */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" />
                Complete Analysis Data
              </CardTitle>
              <CardDescription>
                Comprehensive analysis results with all available data points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Call Description */}
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-slate-900 mb-2">Call Description</h4>
                  <div 
                    className="text-slate-700 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: formatText(results.callDescription || 'Not available') 
                    }}
                  />
                </div>

                {/* Summary */}
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-slate-900 mb-2">Summary</h4>
                  <div 
                    className="text-slate-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: formatText(results.summary || 'No summary available') 
                    }}
                  />
                </div>

                {/* Key Insights */}
                {results.keyInsights && results.keyInsights.length > 0 && (
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-slate-900 mb-3">Key Insights</h4>
                    <ul className="space-y-2">
                      {results.keyInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {results.recommendations && results.recommendations.length > 0 && (
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-slate-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {results.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Other Notable Findings */}
                {results.otherNotableFindings && results.otherNotableFindings.length > 0 && (
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-slate-900 mb-3">Other Notable Findings</h4>
                    <ul className="space-y-2">
                      {results.otherNotableFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sales Performance */}
                {results.salesPerformance && (
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-slate-900 mb-3">Sales Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-1">Responsiveness</h5>
                        <p className="text-green-700 text-sm">{results.salesPerformance.responsiveness || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-1">Satisfaction</h5>
                        <p className="text-blue-700 text-sm">{results.salesPerformance.satisfaction || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h5 className="font-medium text-purple-900 mb-1">Engagement</h5>
                        <p className="text-purple-700 text-sm">{results.salesPerformance.engagement || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prospect Demographics */}
                {results.prospectDemographics && (
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-slate-900 mb-3">Prospect Demographics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-slate-700 mb-1">Team Size</h5>
                          <p className="text-slate-600 text-sm">{results.prospectDemographics.teamSize || 'Not specified'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-700 mb-1">Work Volume</h5>
                          <p className="text-slate-600 text-sm">{results.prospectDemographics.workVolume || 'Not specified'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-700 mb-1">Location</h5>
                          <p className="text-slate-600 text-sm">{results.prospectDemographics.location || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-slate-700 mb-1">Previous Experience</h5>
                          <p className="text-slate-600 text-sm">{results.prospectDemographics.previousExperience || 'Not specified'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-700 mb-1">Likelihood of Closing</h5>
                          <p className="text-slate-600 text-sm">{results.prospectDemographics.likelihoodOfClosing || 'Not specified'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-700 mb-1">Business Summary</h5>
                          <div 
                            className="text-slate-600 text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: formatText(results.prospectDemographics.businessSummary || 'Not specified')
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sales Opportunities */}
                {results.salesOpportunities && (
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-slate-900 mb-3">Sales Opportunities</h4>
                    
                    {/* Upselling Opportunities */}
                    {results.salesOpportunities.upsellingOpportunities && results.salesOpportunities.upsellingOpportunities.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-slate-700 mb-2">Upselling Opportunities</h5>
                        <div className="space-y-3">
                          {results.salesOpportunities.upsellingOpportunities.map((opportunity, index) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <h6 className="font-medium text-green-900 mb-2">{opportunity.opportunity}</h6>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-green-700 font-medium">Relevance:</span>
                                  <span className={`ml-1 ${getScoreColor(opportunity.relevance)}`}>
                                    {opportunity.relevance}/5
                                  </span>
                                </div>
                                <div>
                                  <span className="text-green-700 font-medium">Likelihood:</span>
                                  <span className={`ml-1 ${getScoreColor(opportunity.likelihood)}`}>
                                    {opportunity.likelihood}/5
                                  </span>
                                </div>
                                <div>
                                  <span className="text-green-700 font-medium">Revenue Impact:</span>
                                  <span className={`ml-1 ${getScoreColor(opportunity.revenueImpact)}`}>
                                    {opportunity.revenueImpact}/5
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cross-selling Opportunities */}
                    {results.salesOpportunities.crossSellingOpportunities && results.salesOpportunities.crossSellingOpportunities.length > 0 && (
                      <div>
                        <h5 className="font-medium text-slate-700 mb-2">Cross-selling Opportunities</h5>
                        <div className="space-y-3">
                          {results.salesOpportunities.crossSellingOpportunities.map((opportunity, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <h6 className="font-medium text-blue-900 mb-2">{opportunity.opportunity}</h6>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-blue-700 font-medium">Relevance:</span>
                                  <span className={`ml-1 ${getScoreColor(opportunity.relevance)}`}>
                                    {opportunity.relevance}/5
                                  </span>
                                </div>
                                <div>
                                  <span className="text-blue-700 font-medium">Likelihood:</span>
                                  <span className={`ml-1 ${getScoreColor(opportunity.likelihood)}`}>
                                    {opportunity.likelihood}/5
                                  </span>
                                </div>
                                <div>
                                  <span className="text-blue-700 font-medium">Revenue Impact:</span>
                                  <span className={`ml-1 ${getScoreColor(opportunity.revenueImpact)}`}>
                                    {opportunity.revenueImpact}/5
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
