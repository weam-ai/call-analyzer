'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { analysisApi } from '@/lib/api'
import { Analysis } from '@/types/analysis'
import { formatFileSize } from '@/lib/utils'
import { Upload, FileAudio, X, Loader2 } from 'lucide-react'

interface AudioAnalysisFormProps {
  onAnalysisStart: () => void
  onAnalysisComplete: (analysis: Analysis) => void
  onAnalysisError: (error: string) => void
  isAnalyzing: boolean
}

export function AudioAnalysisForm({
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  isAnalyzing
}: AudioAnalysisFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [additionalUrl, setAdditionalUrl] = useState('')
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac']
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid audio file (MP3, WAV, M4A, AAC, OGG, FLAC)')
        return
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }

      setSelectedFile(file)
      setError('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']
    },
    multiple: false
  })

  const removeFile = () => {
    setSelectedFile(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Please select an audio file')
      return
    }

    try {
      onAnalysisStart()
      setError('')

      const formData = new FormData()
      formData.append('audioFile', selectedFile)
      if (additionalUrl) {
        formData.append('additionalUrl', additionalUrl)
      }

      const response = await analysisApi.analyzeAudio(formData)
      
      if (response.success && response.data) {
        onAnalysisComplete(response.data)
        // Reset form
        setSelectedFile(null)
        setAdditionalUrl('')
      } else {
        onAnalysisError(response.message || 'Analysis failed')
      }
    } catch (err: any) {
      onAnalysisError(err.response?.data?.message || 'Failed to analyze audio')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* File Upload */}
      <div className="space-y-4">
        <label className="text-lg font-semibold text-slate-900">Audio File *</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-300 hover:border-slate-400'
          } ${selectedFile ? 'border-green-500 bg-green-50' : ''}`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="space-y-4">
              <FileAudio className="w-16 h-16 mx-auto text-green-600" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-800">{selectedFile.name}</p>
                <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeFile}
                className="mt-4 bg-white hover:bg-slate-50"
              >
                <X className="w-4 h-4 mr-2" />
                Remove File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-16 h-16 mx-auto text-slate-400" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-700">
                  {isDragActive ? 'Drop the audio file here' : 'Drag & drop an audio file here'}
                </p>
                <p className="text-sm text-slate-500">
                  or click to select (MP3, WAV, M4A, AAC, OGG, FLAC)
                </p>
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
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

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!selectedFile || isAnalyzing}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            Analyzing Audio...
          </>
        ) : (
          <>
            <FileAudio className="w-5 h-5 mr-3" />
            Analyze Audio Call
          </>
        )}
      </Button>
    </form>
  )
}
