'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { analysisApi } from '@/lib/api/analysis'
import { Analysis } from '@/types/analysis'
import { getSessionData } from '@/actions/session'
import { FileText, Loader2 } from 'lucide-react'

interface TranscriptAnalysisFormProps {
  onAnalysisStart: () => void
  onAnalysisComplete: (analysis: Analysis) => void
  onAnalysisError: (error: string) => void
  isAnalyzing: boolean
}

export function TranscriptAnalysisForm({
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  isAnalyzing
}: TranscriptAnalysisFormProps) {
  const [transcript, setTranscript] = useState('')
  const [additionalUrl, setAdditionalUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!transcript.trim()) {
      setError('Please enter a transcript')
      return
    }

    if (transcript.trim().length < 50) {
      setError('Transcript must be at least 50 characters long')
      return
    }

    try {
      onAnalysisStart()
      setError('')

      const response = await analysisApi.analyzeTranscript({
        transcript: transcript.trim(),
        additionalUrl: additionalUrl || undefined
      })
      
      if (response.success && response.data) {
        onAnalysisComplete(response.data)
        // Reset form
        setTranscript('')
        setAdditionalUrl('')
      } else {
        onAnalysisError(response.message || 'Analysis failed')
      }
    } catch (err: any) {
      onAnalysisError(err.response?.data?.message || 'Failed to analyze transcript')
    }
  }

  const wordCount = transcript.trim().split(/\s+/).filter(word => word.length > 0).length

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Transcript Input */}
      <div className="space-y-3">
        <label htmlFor="transcript" className="text-lg font-semibold text-slate-900">
          Sales Call Transcript *
        </label>
        <Textarea
          id="transcript"
          placeholder="Enter the sales call transcript here...&#10;&#10;Example:&#10;John: Hi Sarah, thanks for taking the time to speak with me today. I wanted to discuss how our solution can help your team...&#10;Sarah: Thanks for reaching out, John. We've been looking at several options..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-[300px] text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
          required
        />
        <div className="flex justify-between text-sm text-slate-600">
          <span>Minimum 50 characters</span>
          <span className="font-semibold">{wordCount} words</span>
        </div>
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
        disabled={!transcript.trim() || transcript.trim().length < 50 || isAnalyzing}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            Analyzing Transcript...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-3" />
            Analyze Transcript
          </>
        )}
      </Button>
    </form>
  )
}
