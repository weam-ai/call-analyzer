'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ComprehensiveAnalysisWizard } from '@/components/ComprehensiveAnalysisWizard'
import { ComprehensiveAnalysisResults } from '@/components/ComprehensiveAnalysisResults'
import { CallHistory } from '@/components/CallHistory'
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal'
import { Analysis } from '@/types/analysis'
import { BarChart3, History, ArrowLeft } from 'lucide-react'
import { redirectToBaseUrl } from '@/utils/urlUtils'
import { apiUrl } from '@/config/frontend-config'

interface HomeClientProps {
  user: any // User data from session
}

export function HomeClient({ user }: HomeClientProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentView, setCurrentView] = useState<'wizard' | 'history'>('wizard')
  
  // Modal and toast state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toasts, setToasts] = useState<Array<{id: string, title: string, description: string, variant: 'default' | 'destructive', progress: number}>>([])
  const [deletedAnalysisId, setDeletedAnalysisId] = useState<string | null>(null)

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, title, description, variant, progress: 100 }])
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setToasts(prev => prev.map(t => 
        t.id === id 
          ? { ...t, progress: Math.max(0, t.progress - (100 / 30)) } // 30 updates over 3 seconds
          : t
      ))
    }, 100)
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      clearInterval(progressInterval)
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleAnalysisStart = () => {
    setIsAnalyzing(true)
  }

  const handleAnalysisComplete = (analysis: Analysis) => {
    setCurrentAnalysis(analysis)
    setIsAnalyzing(false)
  }

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false)
  }

  const handleAnalysisSelect = (analysis: Analysis) => {
    setCurrentAnalysis(analysis)
    setCurrentView('wizard')
  }

  const handleDeleteClick = (analysisId: string) => {
    setAnalysisToDelete(analysisId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!analysisToDelete) return

    setIsDeleting(true)
    
    try {
      const params = new URLSearchParams({
        companyId: user?.companyId || ''
      })
      
      const response = await fetch(`${apiUrl}/comprehensive/${analysisToDelete}?${params}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Show success toast
        showToast('Analysis Deleted', 'The analysis has been successfully deleted.', 'default')
        
        // Notify CallHistory component about the deletion
        setDeletedAnalysisId(analysisToDelete)
        
        // Clear current analysis if it was deleted
        if (currentAnalysis && currentAnalysis._id === analysisToDelete) {
          setCurrentAnalysis(null)
        }
      } else {
        // Show error toast
        showToast('Delete Failed', 'Failed to delete the analysis. Please try again.', 'destructive')
      }
    } catch (error) {
      // Show error toast
      showToast('Delete Failed', 'An error occurred while deleting the analysis.', 'destructive')
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(false)
      setAnalysisToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setAnalysisToDelete(null)
  }

  const handleAnalysisDelete = (analysisId: string) => {
    if (currentAnalysis && currentAnalysis._id === analysisId) {
      setCurrentAnalysis(null)
    }
  }

  const handleAnalysisDeleted = (analysisId: string) => {
    // This will be called by CallHistory when it processes the deletion
    setDeletedAnalysisId(null) // Reset the flag
  }

  const handleNewAnalysis = () => {
    setCurrentAnalysis(null)
    setCurrentView('wizard')
  }

  return (
    <>
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
            onDeleteClick={handleDeleteClick}
            onAnalysisDeleted={handleAnalysisDeleted}
            deletedAnalysisId={deletedAnalysisId}
            user={user}
          />
        )}
      </main>

    </div>

    {/* Delete Confirmation Modal */}
    <DeleteConfirmationModal
      isOpen={deleteModalOpen}
      onClose={handleDeleteCancel}
      onConfirm={handleDeleteConfirm}
      isLoading={isDeleting}
      title="Delete Analysis"
      description="Are you sure you want to delete this analysis? This action cannot be undone."
    />

    {/* Toast Container */}
    <div className="fixed top-4 right-4 z-[10000] space-y-2">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`p-4 rounded-lg shadow-lg border max-w-sm bg-white border-gray-200 ${
            toast.variant === 'destructive' 
              ? 'text-red-800' 
              : 'text-gray-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              <p className="text-sm mt-1">{toast.description}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-100 ${
                toast.variant === 'destructive' 
                  ? 'bg-red-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${toast.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
    </>
  )
}
