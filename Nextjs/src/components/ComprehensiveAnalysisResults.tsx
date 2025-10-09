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
          {/* Call Analysis Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Brain className="w-6 h-6 text-purple-600" />
                Call Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Call Description */}
              {results.callDescription && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                  Call Overview
                </h3>
                <div 
                  className="text-slate-700 leading-relaxed text-base prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ 
                      __html: formatText(results.callDescription)
                  }}
                />
              </div>
              )}

              {/* Detailed Analysis - Formatted Sections */}
              {results.summary && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Detailed Call Analysis
                </h3>
                  <div className="space-y-6">
                    {(() => {
                      // Parse the summary into sections
                      const summary = results.summary || ''
                      
                      // Try to split by ## headers first
                      let sections = summary.split(/##\s+/).filter(s => s.trim())
                      
                      // If we only got 1 section (no ## headers found), try splitting by section titles
                      if (sections.length <= 1) {
                        // Look for common section patterns without ## markers
                        const sectionPattern = /(Opening & Discovery|Solution Presentation|Closing & Next Steps|Overall Assessment)/gi
                        const matches = summary.match(sectionPattern)
                        
                        if (matches && matches.length > 1) {
                          // Split by section titles
                          sections = []
                          const titlePositions: Array<{title: string, pos: number}> = []
                          
                          let match
                          const regex = /(Opening & Discovery|Solution Presentation|Closing & Next Steps|Overall Assessment)/gi
                          while ((match = regex.exec(summary)) !== null) {
                            titlePositions.push({ title: match[1], pos: match.index })
                          }
                          
                          titlePositions.forEach((current, idx) => {
                            const nextPos = titlePositions[idx + 1]?.pos || summary.length
                            const content = summary.substring(current.pos, nextPos)
                            sections.push(content)
                          })
                        }
                      }
                      
                      // If still no sections, show as single block
                      if (sections.length === 0) {
                        sections = [summary]
                      }
                      
                      return sections.map((section, index) => {
                        // Clean the section first - remove all # symbols
                        const cleanedSection = section.replace(/#+/g, '').trim()
                        const lines = cleanedSection.split('\n').filter(line => line.trim())
                        
                        // First line is title - clean it thoroughly
                        const title = lines[0].trim().replace(/\s+/g, ' ')
                        
                        // Get content paragraphs (skip first line which is title)
                        const contentLines = lines.slice(1).filter(line => line.trim())
                        
                        // Convert paragraphs to bullet points - split long paragraphs into sentences
                        const bulletPoints: string[] = []
                        
                        // First, try to process each line
                        contentLines.forEach(line => {
                          const trimmedLine = line.trim()
                          if (trimmedLine.length > 0) {
                            // If line is very long (paragraph), split into sentences
                            if (trimmedLine.length > 250) {
                              const sentences = trimmedLine.match(/[^.!?]+[.!?]+/g) || [trimmedLine]
                              sentences.forEach(sentence => {
                                const cleaned = sentence.trim()
                                if (cleaned.length > 10) {
                                  bulletPoints.push(cleaned)
                                }
                              })
                            } else {
                              bulletPoints.push(trimmedLine)
                            }
                          }
                        })
                        
                        // If still no bullet points, try splitting the entire section content
                        if (bulletPoints.length === 0 && contentLines.length > 0) {
                          const fullContent = contentLines.join(' ')
                          // Split by sentences
                          const sentences = fullContent.match(/[^.!?]+[.!?]+/g) || [fullContent]
                          sentences.forEach(sentence => {
                            const cleaned = sentence.trim()
                            if (cleaned.length > 10) {
                              bulletPoints.push(cleaned)
                            }
                          })
                        }
                        
                        // If still no bullet points, try splitting by periods and other delimiters
                        if (bulletPoints.length === 0 && contentLines.length > 0) {
                          const fullContent = contentLines.join(' ')
                          // Split by periods, exclamation marks, question marks, and line breaks
                          const parts = fullContent.split(/[.!?]\s+/).filter(part => part.trim().length > 10)
                          parts.forEach(part => {
                            const cleaned = part.trim()
                            if (cleaned.length > 10) {
                              bulletPoints.push(cleaned)
                            }
                          })
                        }
                        
                        // Last resort: use the raw content as-is
                        if (bulletPoints.length === 0 && contentLines.length > 0) {
                          contentLines.forEach(line => {
                            const trimmed = line.trim()
                            if (trimmed.length > 0) {
                              bulletPoints.push(trimmed)
                            }
                          })
                        }
                        
                        // If still empty, use the entire section content
                        if (bulletPoints.length === 0) {
                          const fullSection = cleanedSection.replace(title, '').trim()
                          if (fullSection.length > 0) {
                            bulletPoints.push(fullSection)
                          }
                        }
                        
                        // Determine section icon and color based on title
                        let icon = <Activity className="w-5 h-5" />
                        let colorClass = 'from-blue-50 to-blue-100 border-blue-200'
                        let iconColor = 'text-blue-600'
                        let bulletColor = 'bg-blue-500'
                        
                        if (title.toLowerCase().includes('opening') || title.toLowerCase().includes('discovery')) {
                          icon = <Mic className="w-5 h-5" />
                          colorClass = 'from-green-50 to-green-100 border-green-200'
                          iconColor = 'text-green-600'
                          bulletColor = 'bg-green-500'
                        } else if (title.toLowerCase().includes('solution') || title.toLowerCase().includes('presentation')) {
                          icon = <Lightbulb className="w-5 h-5" />
                          colorClass = 'from-yellow-50 to-yellow-100 border-yellow-200'
                          iconColor = 'text-yellow-600'
                          bulletColor = 'bg-yellow-500'
                        } else if (title.toLowerCase().includes('closing') || title.toLowerCase().includes('next steps')) {
                          icon = <CheckCircle className="w-5 h-5" />
                          colorClass = 'from-purple-50 to-purple-100 border-purple-200'
                          iconColor = 'text-purple-600'
                          bulletColor = 'bg-purple-500'
                        } else if (title.toLowerCase().includes('assessment') || title.toLowerCase().includes('overall')) {
                          icon = <Star className="w-5 h-5" />
                          colorClass = 'from-indigo-50 to-indigo-100 border-indigo-200'
                          iconColor = 'text-indigo-600'
                          bulletColor = 'bg-indigo-500'
                        }
                        
                        // Only render if we have bullet points and title is not the section heading itself
                        if (bulletPoints.length === 0 || title.toLowerCase().includes('detailed call analysis')) {
                          return null
                        }
                        
                        return (
                          <div 
                            key={index} 
                            className={`bg-gradient-to-r ${colorClass} rounded-lg p-5 border`}
                          >
                            <h4 className={`text-base font-bold mb-4 flex items-center gap-2 ${iconColor}`}>
                              {icon}
                              {title}
                            </h4>
                            <ul className="space-y-3">
                              {bulletPoints.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className={`${bulletColor} rounded-full w-2 h-2 mt-1.5 flex-shrink-0`}></div>
                                  <p className="text-slate-700 text-sm leading-relaxed flex-1">{point}</p>
                                </li>
                              ))}
                            </ul>
                </div>
                        )
                      })
                    })()}
              </div>
                </div>
              )}
            </CardContent>
          </Card>


        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6 mt-8">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="w-6 h-6 text-purple-600" />
                Prospect Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Team Size</p>
                      <p className="text-slate-900 font-medium mt-1">{results.prospectDemographics?.teamSize || 'Not specified'}</p>
                    </div>
                    </div>
                  </div>
                  
                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Work Volume</p>
                      <p className="text-slate-900 font-medium mt-1">{results.prospectDemographics?.workVolume || 'Not specified'}</p>
                    </div>
                    </div>
                  </div>
                  
                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Location</p>
                      <p className="text-slate-900 font-medium mt-1">{results.prospectDemographics?.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Previous Experience</p>
                      <p className="text-slate-900 font-medium mt-1">{results.prospectDemographics?.previousExperience || 'Not specified'}</p>
                    </div>
                    </div>
                  </div>
                  
                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Likelihood of Closing</p>
                      <p className="text-slate-900 font-medium mt-1">{results.prospectDemographics?.likelihoodOfClosing || 'Not specified'}</p>
                    </div>
                    </div>
                  </div>
                  
                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Website</p>
                      <p className="text-slate-900 font-medium mt-1 truncate">{results.prospectDemographics?.website || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {results.prospectDemographics?.businessSummary && (
                <div className="mt-6 bg-white rounded-lg p-5 border border-purple-100 shadow-sm">
                  <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Business Summary
                  </h4>
                  <div 
                    className="text-slate-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                      __html: formatText(results.prospectDemographics.businessSummary)
                  }}
                />
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-8">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Sales Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-5 border border-green-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-green-900 mb-2">Responsiveness</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{results.salesPerformance?.responsiveness || 'Not specified'}</p>
                    </div>
                  </div>
                  </div>
                  
                <div className="bg-white rounded-lg p-5 border border-blue-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 mb-2">Satisfaction</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{results.salesPerformance?.satisfaction || 'Not specified'}</p>
                    </div>
                  </div>
                  </div>
                  
                <div className="bg-white rounded-lg p-5 border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-900 mb-2">Engagement</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{results.salesPerformance?.engagement || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Target className="w-6 h-6 text-blue-600" />
                Recommendations for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed flex-1">{recommendation}</p>
                      </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
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
        <TabsContent value="insights" className="space-y-6 mt-8">
          {/* Key Insights */}
          {results.keyInsights && results.keyInsights.length > 0 && (
            <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.keyInsights.map((insight, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-yellow-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed flex-1 pt-1">{insight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Notable Findings */}
          {results.otherNotableFindings && results.otherNotableFindings.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Eye className="w-6 h-6 text-orange-600" />
                  Other Notable Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.otherNotableFindings.map((finding, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 leading-relaxed flex-1">{finding}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call Rating Breakdown */}
          {results.callRatingBreakdown && (
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  Call Rating Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(results.callRatingBreakdown).map(([key, value]) => {
                    const score = typeof value === 'number' ? value : 0
                    const maxScore = 10
                    const percentage = (score / maxScore) * 100
                    const label = key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())
                    
                    return (
                      <div key={key} className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                        <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">{score}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Detailed Analysis Tab */}
        <TabsContent value="detailed" className="space-y-6 mt-8">
          {/* Call Description */}
          {results.callDescription && (
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Call Description
              </CardTitle>
            </CardHeader>
            <CardContent>
                  <div 
                  className="text-slate-700 leading-relaxed text-base prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ 
                    __html: formatText(results.callDescription) 
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Summary with Bullet Points */}
          {results.summary && (
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Brain className="w-6 h-6 text-indigo-600" />
                  Detailed Call Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(() => {
                    const summary = results.summary || ''
                    
                    // Try to split by ## headers first
                    let sections = summary.split(/##\s+/).filter(s => s.trim())
                    
                    // If we only got 1 section (no ## headers found), try splitting by section titles
                    if (sections.length <= 1) {
                      const sectionPattern = /(Opening & Discovery|Solution Presentation|Closing & Next Steps|Overall Assessment)/gi
                      const matches = summary.match(sectionPattern)
                      
                      if (matches && matches.length > 1) {
                        sections = []
                        const titlePositions: Array<{title: string, pos: number}> = []
                        
                        let match
                        const regex = /(Opening & Discovery|Solution Presentation|Closing & Next Steps|Overall Assessment)/gi
                        while ((match = regex.exec(summary)) !== null) {
                          titlePositions.push({ title: match[1], pos: match.index })
                        }
                        
                        titlePositions.forEach((current, idx) => {
                          const nextPos = titlePositions[idx + 1]?.pos || summary.length
                          const content = summary.substring(current.pos, nextPos)
                          sections.push(content)
                        })
                      }
                    }
                    
                    if (sections.length === 0) {
                      sections = [summary]
                    }
                    
                    return sections.map((section, index) => {
                      // Clean the section first - remove all # symbols
                      const cleanedSection = section.replace(/#+/g, '').trim()
                      const lines = cleanedSection.split('\n').filter(line => line.trim())
                      
                      // First line is title - clean it thoroughly
                      const title = lines[0].trim().replace(/\s+/g, ' ')
                      
                      // Convert paragraphs to bullet points - split long paragraphs into sentences
                      const bulletPoints: string[] = []
                      const contentLines = lines.slice(1).filter(line => line.trim())
                      
                      // First, try to process each line
                      contentLines.forEach(line => {
                        const trimmedLine = line.trim()
                        if (trimmedLine.length > 0) {
                          // If line is very long (paragraph), split into sentences
                          if (trimmedLine.length > 250) {
                            const sentences = trimmedLine.match(/[^.!?]+[.!?]+/g) || [trimmedLine]
                            sentences.forEach(sentence => {
                              const cleaned = sentence.trim()
                              if (cleaned.length > 10) {
                                bulletPoints.push(cleaned)
                              }
                            })
                          } else {
                            bulletPoints.push(trimmedLine)
                          }
                        }
                      })
                      
                      // If still no bullet points, try splitting the entire section content
                      if (bulletPoints.length === 0 && contentLines.length > 0) {
                        const fullContent = contentLines.join(' ')
                        // Split by sentences
                        const sentences = fullContent.match(/[^.!?]+[.!?]+/g) || [fullContent]
                        sentences.forEach(sentence => {
                          const cleaned = sentence.trim()
                          if (cleaned.length > 10) {
                            bulletPoints.push(cleaned)
                          }
                        })
                      }
                      
                      // If still no bullet points, try splitting by periods and other delimiters
                      if (bulletPoints.length === 0 && contentLines.length > 0) {
                        const fullContent = contentLines.join(' ')
                        // Split by periods, exclamation marks, question marks, and line breaks
                        const parts = fullContent.split(/[.!?]\s+/).filter(part => part.trim().length > 10)
                        parts.forEach(part => {
                          const cleaned = part.trim()
                          if (cleaned.length > 10) {
                            bulletPoints.push(cleaned)
                          }
                        })
                      }
                      
                      // Last resort: use the raw content as-is
                      if (bulletPoints.length === 0 && contentLines.length > 0) {
                        contentLines.forEach(line => {
                          const trimmed = line.trim()
                          if (trimmed.length > 0) {
                            bulletPoints.push(trimmed)
                          }
                        })
                      }
                      
                      // If still empty, use the entire section content
                      if (bulletPoints.length === 0) {
                        const fullSection = cleanedSection.replace(title, '').trim()
                        if (fullSection.length > 0) {
                          bulletPoints.push(fullSection)
                        }
                      }
                      
                      let icon = <Activity className="w-5 h-5" />
                      let colorClass = 'from-blue-50 to-blue-100 border-blue-200'
                      let iconColor = 'text-blue-600'
                      let bulletColor = 'bg-blue-500'
                      
                      if (title.toLowerCase().includes('opening') || title.toLowerCase().includes('discovery')) {
                        icon = <Mic className="w-5 h-5" />
                        colorClass = 'from-green-50 to-green-100 border-green-200'
                        iconColor = 'text-green-600'
                        bulletColor = 'bg-green-500'
                      } else if (title.toLowerCase().includes('solution') || title.toLowerCase().includes('presentation')) {
                        icon = <Lightbulb className="w-5 h-5" />
                        colorClass = 'from-yellow-50 to-yellow-100 border-yellow-200'
                        iconColor = 'text-yellow-600'
                        bulletColor = 'bg-yellow-500'
                      } else if (title.toLowerCase().includes('closing') || title.toLowerCase().includes('next steps')) {
                        icon = <CheckCircle className="w-5 h-5" />
                        colorClass = 'from-purple-50 to-purple-100 border-purple-200'
                        iconColor = 'text-purple-600'
                        bulletColor = 'bg-purple-500'
                      } else if (title.toLowerCase().includes('assessment') || title.toLowerCase().includes('overall')) {
                        icon = <Star className="w-5 h-5" />
                        colorClass = 'from-indigo-50 to-indigo-100 border-indigo-200'
                        iconColor = 'text-indigo-600'
                        bulletColor = 'bg-indigo-500'
                      }
                      
                      // Only render if we have bullet points and title is not the section heading itself
                      if (bulletPoints.length === 0 || title.toLowerCase().includes('detailed call analysis')) {
                        return null
                      }
                      
                      return (
                        <div key={index} className={`bg-gradient-to-r ${colorClass} rounded-lg p-5 border`}>
                          <h4 className={`text-base font-bold mb-4 flex items-center gap-2 ${iconColor}`}>
                            {icon}
                            {title}
                          </h4>
                          <ul className="space-y-3">
                            {bulletPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <div className={`${bulletColor} rounded-full w-2 h-2 mt-1.5 flex-shrink-0`}></div>
                                <p className="text-slate-700 text-sm leading-relaxed flex-1">{point}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })
                  })()}
                      </div>
              </CardContent>
            </Card>
          )}

          {/* Key Insights */}
          {results.keyInsights && results.keyInsights.length > 0 && (
            <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                      <div className="space-y-3">
                  {results.keyInsights.map((insight, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-yellow-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed flex-1 pt-1">{insight}</p>
                        </div>
                        </div>
                  ))}
                      </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Target className="w-6 h-6 text-green-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                        <div className="space-y-3">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                        <p className="text-sm text-slate-700 leading-relaxed flex-1">{recommendation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
              </CardContent>
            </Card>
          )}

          {/* Other Notable Findings */}
          {results.otherNotableFindings && results.otherNotableFindings.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  Other Notable Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                        <div className="space-y-3">
                  {results.otherNotableFindings.map((finding, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 leading-relaxed flex-1">{finding}</p>
                              </div>
                            </div>
                          ))}
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
