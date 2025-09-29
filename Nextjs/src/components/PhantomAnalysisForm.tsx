'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { analysisApi } from '@/lib/api'
import { Analysis } from '@/types/analysis'
import { Link, Loader2 } from 'lucide-react'

interface PhantomAnalysisFormProps {
  onAnalysisStart: () => void
  onAnalysisComplete: (analysis: Analysis) => void
  onAnalysisError: (error: string) => void
  isAnalyzing: boolean
}

export function PhantomAnalysisForm({
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  isAnalyzing
}: PhantomAnalysisFormProps) {
  const [url, setUrl] = useState('')
  const [additionalUrl, setAdditionalUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url) {
      setError('Please enter a URL')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    try {
      onAnalysisStart()
      setError('')

      const response = await analysisApi.analyzePhantom({
        url,
        additionalUrl: additionalUrl || undefined
      })
      
      if (response.success && response.data) {
        onAnalysisComplete(response.data)
        // Reset form
        setUrl('')
        setAdditionalUrl('')
      } else {
        onAnalysisError(response.message || 'Analysis failed')
      }
    } catch (err: any) {
      onAnalysisError(err.response?.data?.message || 'Failed to analyze URL')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Main URL */}
      <div className="space-y-3">
        <label htmlFor="url" className="text-lg font-semibold text-slate-900">
          URL with Embedded Transcript *
        </label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/meeting-transcript"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="h-12 text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
        />
        <p className="text-sm text-slate-600">
          Enter a URL that contains a meeting transcript, call recording with text, or conversation log
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
          className="h-12 text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
        />
        <p className="text-sm text-slate-600">
          Provide a URL with additional context about the call (meeting notes, agenda, etc.)
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
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
            Analyzing URL...
          </>
        ) : (
          <>
            <Link className="w-5 h-5 mr-3" />
            Analyze URL Transcript
          </>
        )}
      </Button>
    </form>
  )
}
