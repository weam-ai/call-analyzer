'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ComprehensiveAnalysisWizard } from '@/components/ComprehensiveAnalysisWizard'
import { ComprehensiveAnalysisResults } from '@/components/ComprehensiveAnalysisResults'
import { CallHistory } from '@/components/CallHistory'
import { AuthorizationMessage } from '@/components/AuthorizationMessage'
import { Analysis } from '@/types/analysis'
import { BarChart3, TrendingUp, History, Plus, FileText, ArrowLeft, Search } from 'lucide-react'
import { redirectToBaseUrl } from '@/utils/urlUtils'

export default function Home() {
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentView, setCurrentView] = useState<'wizard' | 'history'>('wizard')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/call-analyzer/api/user/session')
        const data = await response.json()
        
        // Check if we have valid session data
        if (data.success && data.data && data.data.id && data.data.email) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Failed to check authentication:', error)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const handleAnalysisStart = () => {
    setIsAnalyzing(true)
  }

  const handleAnalysisComplete = (analysis: Analysis) => {
    setCurrentAnalysis(analysis)
    setIsAnalyzing(false)
  }

  const handleAnalysisError = (error: string) => {
    console.error('Analysis error:', error)
    setIsAnalyzing(false)
  }

  const handleAnalysisSelect = (analysis: Analysis) => {
    setCurrentAnalysis(analysis)
    setCurrentView('wizard')
  }

  const handleAnalysisDelete = (analysisId: string) => {
    if (currentAnalysis && currentAnalysis._id === analysisId) {
      setCurrentAnalysis(null)
    }
  }

  const handleNewAnalysis = () => {
    setCurrentAnalysis(null)
    setCurrentView('wizard')
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show authorization message if not authenticated
  if (!isAuthenticated) {
    return <AuthorizationMessage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Sales Call Analyzer</h1>
                <p className="text-xs text-slate-500">AI-Powered Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={redirectToBaseUrl}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to App</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant={currentView === 'wizard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleNewAnalysis}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">New Analysis</span>
                </Button>
                <Button
                  variant={currentView === 'history' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('history')}
                  className="flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Call History</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'wizard' ? (
          <>
            {!currentAnalysis ? (
        <ComprehensiveAnalysisWizard
          onAnalysisComplete={handleAnalysisComplete}
          onAnalysisError={handleAnalysisError}
          isAnalyzing={isAnalyzing}
          onAnalysisStart={handleAnalysisStart}
        />
            ) : (
              /* Analysis Results */
              <ComprehensiveAnalysisResults 
                analysis={currentAnalysis} 
                onGoHome={handleNewAnalysis}
              />
            )}
          </>
        ) : (
          /* Call History */
          <CallHistory
            onAnalysisSelect={handleAnalysisSelect}
            onAnalysisDelete={handleAnalysisDelete}
          />
        )}
      </main>

      </div>
  )
}