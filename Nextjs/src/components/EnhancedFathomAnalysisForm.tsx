'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Link, 
  Loader2, 
  Settings, 
  Zap, 
  Brain, 
  Eye, 
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { Analysis } from '@/types/analysis'
import { apiUrl } from '@/config/frontend-config'

interface EnhancedFathomAnalysisFormProps {
  onAnalysisStart: () => void
  onAnalysisComplete: (analysis: Analysis) => void
  onAnalysisError: (error: string) => void
  isAnalyzing: boolean
}

interface AnalysisOptions {
  scroll: boolean
  scrollDelay: number
  pageTimeout: number
  userAgent: string
}

export function EnhancedFathomAnalysisForm({
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  isAnalyzing
}: EnhancedFathomAnalysisFormProps) {
  const [url, setUrl] = useState('')
  const [additionalUrl, setAdditionalUrl] = useState('')
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [options, setOptions] = useState<AnalysisOptions>({
    scroll: true,
    scrollDelay: 2.0,
    pageTimeout: 60000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) {
      setError('Please enter a Fathom URL')
      return
    }

    // Basic Fathom URL validation
    if (!url.includes('fathom.video/share/')) {
      setError('Please enter a valid Fathom video share URL (e.g., https://fathom.video/share/...)')
      return
    }

    try {
      onAnalysisStart()
      setError('')

      const response = await fetch(`${apiUrl}/enhanced/fathom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          additionalUrl: additionalUrl || undefined,
          options: showAdvanced ? options : undefined
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        onAnalysisComplete(data.data)
        // Reset form
        setUrl('')
        setAdditionalUrl('')
      } else {
        onAnalysisError(data.message || 'Enhanced Fathom analysis failed')
      }
    } catch (err: any) {
      onAnalysisError(err.message || 'Failed to analyze Fathom URL')
    }
  }

  const updateOption = (key: keyof AnalysisOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Enhanced Fathom Analysis
          </CardTitle>
          <CardDescription className="text-slate-600 text-lg">
            Advanced AI-powered analysis with multiple extraction strategies and comprehensive insights
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Brain className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800">AI-Powered</h3>
            <p className="text-sm text-green-600">Google Gemini 1.5 Pro</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-800">Smart Extraction</h3>
            <p className="text-sm text-blue-600">Multiple strategies</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-800">Fast Processing</h3>
            <p className="text-sm text-purple-600">15-30 seconds</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main URL */}
            <div className="space-y-3">
              <label htmlFor="url" className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Link className="w-5 h-5" />
                Fathom Video Share URL *
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://fathom.video/share/TBPhmznU9LuTGJS2fXPXzzBoz7vExcjB"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="h-12 text-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="text-sm text-slate-600">
                Enter a Fathom video share URL to extract and analyze its transcript with advanced AI.
              </p>
            </div>

            {/* Additional URL */}
            <div className="space-y-3">
              <label htmlFor="additionalUrl" className="text-lg font-semibold text-slate-900">
                Additional Context URL (Optional)
              </label>
              <Input
                id="additionalUrl"
                type="url"
                placeholder="https://example.com/meeting-notes"
                value={additionalUrl}
                onChange={(e) => setAdditionalUrl(e.target.value)}
                className="h-12 text-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="text-sm text-slate-600">
                Provide a URL with additional context about the call (meeting notes, agenda, etc.)
              </p>
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Settings className="w-4 h-4" />
                Advanced Options
              </button>
              <Badge variant="outline" className="text-xs">
                {showAdvanced ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Advanced Configuration
                  </CardTitle>
                  <CardDescription>
                    Fine-tune the analysis process for optimal results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Scroll Page</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={options.scroll}
                          onChange={(e) => updateOption('scroll', e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-600">Enable page scrolling for dynamic content</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Scroll Delay (seconds)</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="10"
                        value={options.scrollDelay}
                        onChange={(e) => updateOption('scrollDelay', parseFloat(e.target.value))}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Page Timeout (ms)</label>
                      <Input
                        type="number"
                        min="10000"
                        max="300000"
                        step="1000"
                        value={options.pageTimeout}
                        onChange={(e) => updateOption('pageTimeout', parseInt(e.target.value))}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">User Agent</label>
                      <select
                        value={options.userAgent}
                        onChange={(e) => updateOption('userAgent', e.target.value)}
                        className="h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36">
                          Chrome (Windows)
                        </option>
                        <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36">
                          Chrome (macOS)
                        </option>
                        <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0">
                          Firefox (Windows)
                        </option>
                        <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0">
                          Firefox (macOS)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Recommended Settings:</p>
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>• Enable scrolling for dynamic content loading</li>
                          <li>• Use 2-3 second scroll delay for optimal results</li>
                          <li>• Set 60-90 second timeout for complex pages</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!url || isAnalyzing}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Analyzing with Enhanced AI...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-3" />
                  Start Enhanced Analysis
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Enhanced Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800">Extraction</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Multiple extraction strategies</li>
                <li>• Fathom-specific optimizations</li>
                <li>• Dynamic content loading</li>
                <li>• Confidence scoring</li>
                <li>• Retry logic with backoff</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800">Analysis</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Google Gemini 1.5 Pro</li>
                <li>• Comprehensive insights</li>
                <li>• Sentiment analysis</li>
                <li>• Cost tracking</li>
                <li>• Performance metrics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


