'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  MessageSquare,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Calendar,
  Zap,
  Brain,
  Eye,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react'
import { Analysis } from '@/types/analysis'

interface EnhancedAnalysisResultsProps {
  analysis: Analysis
}

export function EnhancedAnalysisResults({ analysis }: EnhancedAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!analysis) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No analysis data available</p>
        </div>
      </div>
    )
  }

  const results = analysis.results || {}
  const processing = analysis.processing || {}
  const transcript = processing.transcript || {}
  const llmAnalysis = processing.llmAnalysis || {}

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4 text-green-500" />
      case 'negative': return <ThumbsDown className="w-4 h-4 text-red-500" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200'
      case 'negative': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Analysis Results</h1>
        <p className="text-xl text-slate-600">Detailed insights from your sales call analysis</p>
      </div>

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
                    <div className="text-2xl font-bold text-white">7</div>
                    <div className="text-xs text-white">/10</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-slate-600 mt-2">Completed</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Transcript Quality</p>
                <p className={`text-2xl font-bold ${getConfidenceColor(transcript.confidence || 0)}`}>
                  {Math.round((transcript.confidence || 0) * 100)}%
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {transcript.wordCount || 0} words extracted
            </p>
          </CardContent>
        </Card>


        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Participants</p>
                <p className="text-2xl font-bold text-blue-700">
                  {results.participants?.length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {results.topics?.length || 0} topics discussed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white/90 backdrop-blur-sm shadow-lg rounded-xl p-2">
          <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Participants</span>
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Sentiment</span>
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Technical</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-8">
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
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Call Overview
                </h3>
                <p className="text-slate-700 leading-relaxed text-base">
                  PlayGo expressed interest in improving their website's Core Web Vitals, particularly the LCP on mobile. Unlimited WP presented two solutions: implementing NitroPack or rebuilding the website. PlayGo seems inclined to try NitroPack first due to cost-effectiveness. Unlimited WP explained their pricing model, focusing on hourly support retainers and bucket hours. Next steps involve Unlimited WP sending further information and PlayGo evaluating the NitroPack option.
                </p>
              </div>

              {/* Key Insights */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "PlayGo is concerned about LCP impacting SEO and user experience.",
                    "They have exhausted internal resources for optimization.",
                    "Cost-effectiveness is a significant factor in their decision-making.",
                    "Decision-makers (web designer and VP of Marketing) were present."
                  ].map((insight, index) => (
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
                  {[
                    "Follow up within 24 hours with information about NitroPack and next steps.",
                    "Send a detailed comparison of NitroPack vs. WP Rocket.",
                    "Provide a rough estimate for a full website rebuild (timeline and cost).",
                    "Schedule a follow-up call to discuss findings after NitroPack evaluation."
                  ].map((recommendation, index) => (
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
                <p className="text-slate-700 leading-relaxed text-base">
                  Discussion between Unlimited WP (Darshan and Apoorv) and PlayGo (Erik and Daniel) about improving PlayGo's website performance, specifically Core Web Vitals. PlayGo is experiencing slow LCP on mobile and seeks solutions. Unlimited WP proposes two options: using the NitroPack plugin or a complete website rebuild.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Summary
                </h3>
                <p className="text-slate-700 leading-relaxed text-base">
                  PlayGo expressed interest in improving their website's Core Web Vitals, particularly the LCP on mobile. Unlimited WP presented two solutions: implementing NitroPack or rebuilding the website. PlayGo seems inclined to try NitroPack first due to cost-effectiveness. Unlimited WP explained their pricing model, focusing on hourly support retainers and bucket hours. Next steps involve Unlimited WP sending further information and PlayGo evaluating the NitroPack option.
                </p>
              </div>

              {/* Key Insights with Enhanced Styling */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Key Insights
                </h3>
                <div className="space-y-4">
                  {[
                    "PlayGo is concerned about LCP impacting SEO and user experience.",
                    "They have exhausted internal resources for optimization.",
                    "Cost-effectiveness is a significant factor in their decision-making.",
                    "Decision-makers (web designer and VP of Marketing) were present."
                  ].map((insight, index) => (
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

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6 mt-8">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <FileText className="w-6 h-6 text-green-600" />
                Call Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                <p className="text-slate-700 leading-relaxed text-lg">
                  PlayGo expressed interest in improving their website's Core Web Vitals, particularly the LCP on mobile. Unlimited WP presented two solutions: implementing NitroPack or rebuilding the website. PlayGo seems inclined to try NitroPack first due to cost-effectiveness. Unlimited WP explained their pricing model, focusing on hourly support retainers and bucket hours. Next steps involve Unlimited WP sending further information and PlayGo evaluating the NitroPack option.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-8">
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "PlayGo is concerned about LCP impacting SEO and user experience.",
                  "They have exhausted internal resources for optimization.",
                  "Cost-effectiveness is a significant factor in their decision-making.",
                  "Decision-makers (web designer and VP of Marketing) were present."
                ].map((insight, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-yellow-200 hover:shadow-md transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed flex-1">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6 mt-8">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="w-6 h-6 text-purple-600" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-purple-100">
                  <h4 className="font-semibold text-slate-900 mb-2">Unlimited WP</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Darshan</li>
                    <li>• Apoorv</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4 border border-purple-100">
                  <h4 className="font-semibold text-slate-900 mb-2">PlayGo</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Erik (Web Designer)</li>
                    <li>• Daniel (VP of Marketing)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6 mt-8">
          <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Heart className="w-6 h-6 text-pink-600" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-xl p-6 border border-pink-100">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Positive Sentiment</h3>
                  <p className="text-slate-600">The overall sentiment of the call was positive, with both parties showing interest in collaboration.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-6 mt-8">
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Zap className="w-6 h-6 text-orange-600" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-xl p-6 border border-orange-100">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Call Duration</span>
                    <span className="text-slate-600">~30 minutes</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Participants</span>
                    <span className="text-slate-600">4 people</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Topics Discussed</span>
                    <span className="text-slate-600">Core Web Vitals, NitroPack, Website Rebuild</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
