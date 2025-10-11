'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Link, 
  FileText, 
  Mic, 
  Settings, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertCircle,
  Brain,
  BarChart3,
  CheckCircle2
} from 'lucide-react'
import { Analysis } from '@/types/analysis'
import { apiUrl } from '@/config/frontend-config'
import { getSessionData } from '@/actions/session'

interface ComprehensiveAnalysisWizardProps {
  onAnalysisComplete: (analysis: Analysis) => void
  onAnalysisError: (error: string) => void
  isAnalyzing: boolean
  onAnalysisStart?: () => void
}

interface WizardData {
  // Step 1: Call Data
  callDataType: 'audio' | 'fathom' | 'transcript' | null
  audioFile: File | null
  fathomUrl: string
  transcript: string
  
  // Step 2: Product/Service
  productServiceType: 'url' | 'document' | null
  productServiceUrl: string
  productServiceDocument: File | null
  
  // Step 3: Prompt
  promptType: 'default' | 'custom'
  customPrompt: string
}

export function ComprehensiveAnalysisWizard({
  onAnalysisComplete,
  onAnalysisError,
  isAnalyzing,
  onAnalysisStart
}: ComprehensiveAnalysisWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    // Step 1: Call Data
    callDataType: null,
    audioFile: null,
    fathomUrl: '',
    transcript: '',
    
    // Step 2: Product/Service
    productServiceType: 'url',
    productServiceUrl: '',
    productServiceDocument: null,
    
    // Step 3: Prompt
    promptType: 'default',
    customPrompt: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const defaultPrompt = `You are the "Sales Call Analyzer," an advanced analytical tool designed to evaluate and break down recorded sales call transcripts for comprehensive insights...`

  const handleInputChange = (field: keyof WizardData, value: any) => {
    setWizardData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = (field: 'audioFile' | 'productServiceDocument', file: File) => {
    handleInputChange(field, file)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!wizardData.callDataType) {
        newErrors.callDataType = 'Please select a call data type'
      } else {
        if (wizardData.callDataType === 'audio' && !wizardData.audioFile) {
          newErrors.audioFile = 'Please upload an audio file'
        } else if (wizardData.callDataType === 'fathom' && !wizardData.fathomUrl.trim()) {
          newErrors.fathomUrl = 'Please enter a Fathom URL'
        } else if (wizardData.callDataType === 'transcript' && !wizardData.transcript.trim()) {
          newErrors.transcript = 'Please enter a transcript'
        }
      }
    } else if (step === 2) {
      if (!wizardData.productServiceUrl.trim()) {
        newErrors.productServiceUrl = 'Please enter a product/service URL'
      }
    } else if (step === 3) {
      if (wizardData.promptType === 'custom' && !wizardData.customPrompt.trim()) {
        newErrors.customPrompt = 'Please enter a custom prompt'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    // Start analysis
    if (onAnalysisStart) {
      onAnalysisStart()
    }

    try {
      // Get user data from session
      const sessionResult = await getSessionData()
      
      const formData = new FormData()
      
      // Add user data directly from session
      formData.append('userId', sessionResult.data.id || '')
      formData.append('email', sessionResult.data.email || '')
      formData.append('companyId', sessionResult.data.companyId || '')
      
      // Add call data
      formData.append('callDataType', wizardData.callDataType!)
      if (wizardData.audioFile) {
        formData.append('audioFile', wizardData.audioFile)
      }
      if (wizardData.fathomUrl) {
        formData.append('fathomUrl', wizardData.fathomUrl)
      }
      if (wizardData.transcript) {
        formData.append('transcript', wizardData.transcript)
      }

      // Add product/service data
      formData.append('productServiceType', wizardData.productServiceType!)
      if (wizardData.productServiceUrl) {
        formData.append('productServiceUrl', wizardData.productServiceUrl)
      }
      if (wizardData.productServiceDocument) {
        formData.append('productServiceDocument', wizardData.productServiceDocument)
      }

      // Add prompt data
      formData.append('promptType', wizardData.promptType)
      if (wizardData.customPrompt) {
        formData.append('customPrompt', wizardData.customPrompt)
      }

      const response = await fetch(`${apiUrl}/comprehensive/`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success && data.data) {
        onAnalysisComplete(data.data)
        // Reset wizard
        setCurrentStep(1)
        setWizardData({
          callDataType: null,
          audioFile: null,
          fathomUrl: '',
          transcript: '',
          productServiceType: null,
          productServiceUrl: '',
          productServiceDocument: null,
          promptType: 'default',
          customPrompt: ''
        })
      } else {
        onAnalysisError(data.message || 'Analysis failed')
      }
    } catch (error: any) {
      onAnalysisError(error.message || 'Failed to submit analysis')
    }
  }

  const renderStep1 = () => {
    const callDataOptions = [
      {
        id: 'audio',
        title: 'Upload Zoom Audio',
        description: 'Upload .m4a audio file',
        icon: Mic,
        color: 'purple',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        ringColor: 'ring-purple-500'
      },
      {
        id: 'fathom',
        title: 'Fathom Call URL',
        description: 'Paste Fathom call URL',
        icon: Link,
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50',
        ringColor: 'ring-blue-500'
      },
      {
        id: 'transcript',
        title: 'Paste Transcript',
        description: 'Paste full transcript text',
        icon: FileText,
        color: 'green',
        gradient: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50',
        ringColor: 'ring-green-500'
      }
    ]

    const selectedOption = callDataOptions.find(option => option.id === wizardData.callDataType)

    return (
      <div className="space-y-8">
        {/* Upload Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {callDataOptions.map((option) => {
            const Icon = option.icon
            const isSelected = wizardData.callDataType === option.id
            return (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isSelected 
                    ? `ring-2 ${option.ringColor} bg-gradient-to-br ${option.bgGradient} shadow-lg` 
                    : 'hover:shadow-md border-slate-200'
                }`}
                onClick={() => handleInputChange('callDataType', option.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-r ${option.gradient} shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{option.title}</h3>
                  <p className="text-xs text-slate-600 mb-3">{option.description}</p>
                  {isSelected && (
                    <div className="flex items-center justify-center text-green-600 font-semibold text-xs">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Selected
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Selected Option Details */}
        {selectedOption && (
          <div className="max-w-3xl mx-auto">
            <Card className={`ring-2 ${selectedOption.ringColor} bg-gradient-to-br ${selectedOption.bgGradient} shadow-lg`}>
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-r ${selectedOption.gradient} shadow-md`}>
                  <selectedOption.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold mb-2">{selectedOption.title}</CardTitle>
                <CardDescription className="text-sm text-slate-600">{selectedOption.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {selectedOption.id === 'audio' && (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".m4a,audio/m4a"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload('audioFile', file)
                        }
                      }}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="block">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 cursor-pointer">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700 mb-1">Click to upload audio file</p>
                        <p className="text-xs text-slate-500">Supports .m4a files</p>
                      </div>
                    </label>
                    {wizardData.audioFile && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center text-green-700 mb-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-semibold truncate">{wizardData.audioFile.name}</span>
                        </div>
                        <p className="text-xs text-green-600">
                          File size: {(wizardData.audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    {errors.audioFile && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-600 font-semibold text-sm">{errors.audioFile}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedOption.id === 'fathom' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="https://fathom.video/share/..."
                        value={wizardData.fathomUrl}
                        onChange={(e) => handleInputChange('fathomUrl', e.target.value)}
                        className="h-10 text-sm pl-10 border-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                      <p className="text-blue-700 text-xs">
                        <strong>Tip:</strong> Paste your Fathom call URL to automatically extract the transcript and analysis.
                      </p>
                    </div>
                    {errors.fathomUrl && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-600 font-semibold text-sm">{errors.fathomUrl}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedOption.id === 'transcript' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Textarea
                        placeholder="Paste your sales call transcript here..."
                        value={wizardData.transcript}
                        onChange={(e) => handleInputChange('transcript', e.target.value)}
                        rows={4}
                        className="text-sm border-2 border-slate-300 focus:border-green-500 focus:ring-green-500 pl-10 pt-3 rounded-lg resize-none"
                      />
                    </div>
                    {wizardData.transcript && (
                      <div className="flex items-center justify-between bg-green-50 rounded-lg p-2 border border-green-200">
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-semibold text-xs">Transcript ready</span>
                        </div>
                        <span className="text-green-600 font-medium text-xs">
                          {wizardData.transcript.length} characters
                        </span>
                      </div>
                    )}
                    <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                      <p className="text-green-700 text-xs">
                        <strong>Tip:</strong> Paste the complete transcript including all participants' dialogue for the best analysis results.
                      </p>
                    </div>
                    {errors.transcript && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-600 font-semibold text-sm">{errors.transcript}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {errors.callDataType && (
          <div className="text-center">
            <div className="inline-flex items-center p-6 bg-red-50 rounded-xl border-2 border-red-200">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <p className="text-red-600 font-semibold text-lg">{errors.callDataType}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderStep2 = () => {
    return (
      <div className="space-y-8">
        {/* Product/Service URL Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="ring-2 ring-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-r from-orange-500 to-amber-500 shadow-md">
                <Link className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-lg font-bold mb-2">Product/Service URL</CardTitle>
              <CardDescription className="text-sm text-slate-600">Enter your website URL</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="https://www.example.com"
                    value={wizardData.productServiceUrl}
                    onChange={(e) => handleInputChange('productServiceUrl', e.target.value)}
                    className="h-10 text-sm pl-10 border-2 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  />
                </div>
                {errors.productServiceUrl && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600 font-semibold text-sm">{errors.productServiceUrl}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderStep3 = () => {
    const promptOptions = [
      {
        id: 'default',
        title: 'Default Prompt',
        description: 'Comprehensive sales call analysis with demographic insights',
        icon: Settings,
        color: 'green',
        gradient: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50',
        ringColor: 'ring-green-500'
      },
      {
        id: 'custom',
        title: 'Custom Prompt',
        description: 'Enter your own analysis prompt',
        icon: FileText,
        color: 'purple',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        ringColor: 'ring-purple-500'
      }
    ]

    const selectedOption = promptOptions.find(option => option.id === wizardData.promptType)

    return (
      <div className="space-y-8">
        {/* Prompt Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {promptOptions.map((option) => {
            const Icon = option.icon
            const isSelected = wizardData.promptType === option.id
            return (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isSelected 
                    ? `ring-2 ${option.ringColor} bg-gradient-to-br ${option.bgGradient} shadow-lg` 
                    : 'hover:shadow-md border-slate-200'
                }`}
                onClick={() => handleInputChange('promptType', option.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-r ${option.gradient} shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{option.title}</h3>
                  <p className="text-xs text-slate-600 mb-3">{option.description}</p>
                  {isSelected && (
                    <div className="flex items-center justify-center text-green-600 font-semibold text-xs">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Selected
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Selected Option Details */}
        {selectedOption && (
          <div className="max-w-3xl mx-auto">
            <Card className={`ring-2 ${selectedOption.ringColor} bg-gradient-to-br ${selectedOption.bgGradient} shadow-lg`}>
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-r ${selectedOption.gradient} shadow-md`}>
                  <selectedOption.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold mb-2">{selectedOption.title}</CardTitle>
                <CardDescription className="text-sm text-slate-600">{selectedOption.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {selectedOption.id === 'default' && (
                  <div className="space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 mb-2">AI Sales Call Analyzer</h4>
                          <p className="text-sm text-slate-600">
                            Advanced analytical tool designed to evaluate and break down recorded sales call transcripts for comprehensive insights.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium">Prospect demographic analysis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-medium">Sales team performance evaluation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            <span className="text-xs font-medium">Sales opportunity analysis</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            <span className="text-xs font-medium">Call quality assessment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-xs font-medium">Product/service gap analysis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedOption.id === 'custom' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Textarea
                        placeholder="Enter your custom analysis prompt here..."
                        value={wizardData.customPrompt}
                        onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                        rows={6}
                        className="text-sm border-2 border-slate-300 focus:border-purple-500 focus:ring-purple-500 pl-10 pt-3 rounded-lg resize-none"
                      />
                    </div>
                    {wizardData.customPrompt && (
                      <div className="flex items-center justify-between bg-green-50 rounded-lg p-2 border border-green-200">
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-semibold text-xs">Custom prompt ready</span>
                        </div>
                        <span className="text-green-600 font-medium text-xs">
                          {wizardData.customPrompt.length} characters
                        </span>
                      </div>
                    )}
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-purple-700 text-xs">
                        <strong>Tip:</strong> Define your own analysis criteria and focus areas. Be specific about what insights you want to extract from the sales call transcript.
                      </p>
                    </div>
                    {errors.customPrompt && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-600 font-semibold text-sm">{errors.customPrompt}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {errors.promptType && (
          <div className="text-center">
            <div className="inline-flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <p className="text-red-600 font-semibold text-sm">{errors.promptType}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Analyze</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">Review your selections and run the analysis</p>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Analysis Summary</CardTitle>
          <CardDescription className="text-lg text-slate-600">
            Everything is ready for your comprehensive sales call analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Call Data */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  {wizardData.callDataType === 'audio' && <Mic className="w-5 h-5 text-white" />}
                  {wizardData.callDataType === 'fathom' && <Link className="w-5 h-5 text-white" />}
                  {wizardData.callDataType === 'transcript' && <FileText className="w-5 h-5 text-white" />}
                </div>
                <h4 className="text-lg font-bold text-slate-800">Call Data</h4>
              </div>
              <div className="space-y-3">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                  {wizardData.callDataType === 'audio' && 'Audio File'}
                  {wizardData.callDataType === 'fathom' && 'Fathom URL'}
                  {wizardData.callDataType === 'transcript' && 'Transcript'}
                </Badge>
                {wizardData.audioFile && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">{wizardData.audioFile.name}</p>
                    <p className="text-xs text-green-600">{(wizardData.audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
                {wizardData.fathomUrl && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 truncate">{wizardData.fathomUrl}</p>
                  </div>
                )}
                {wizardData.transcript && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">{wizardData.transcript.length} characters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product/Service */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  {wizardData.productServiceType === 'url' && <Link className="w-5 h-5 text-white" />}
                  {wizardData.productServiceType === 'document' && <FileText className="w-5 h-5 text-white" />}
                </div>
                <h4 className="text-lg font-bold text-slate-800">Product/Service</h4>
              </div>
              <div className="space-y-3">
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                  {wizardData.productServiceType === 'url' && 'URL'}
                  {wizardData.productServiceType === 'document' && 'Document'}
                </Badge>
                {wizardData.productServiceUrl && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 truncate">{wizardData.productServiceUrl}</p>
                  </div>
                )}
                {wizardData.productServiceDocument && (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm font-medium text-indigo-800">{wizardData.productServiceDocument.name}</p>
                    <p className="text-xs text-indigo-600">{(wizardData.productServiceDocument.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Analysis Prompt</h4>
              </div>
              <div className="space-y-3">
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                  {wizardData.promptType === 'default' && 'Default'}
                  {wizardData.promptType === 'custom' && 'Custom'}
                </Badge>
                {wizardData.promptType === 'default' && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">Comprehensive Analysis</p>
                    <p className="text-xs text-green-600">AI-powered sales call analyzer</p>
                  </div>
                )}
                {wizardData.promptType === 'custom' && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-800">{wizardData.customPrompt.length} characters</p>
                    <p className="text-xs text-purple-600">Custom prompt</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step Content */}
      <Card className="mb-8">
        <CardContent className="p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            {[
              { step: 1, icon: Upload, label: 'Upload Data' },
              { step: 2, icon: Settings, label: 'Configure' },
              { step: 3, icon: BarChart3, label: 'Analyze' },
              { step: 4, icon: CheckCircle2, label: 'Complete' }
            ].map(({ step, icon: Icon, label }) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step <= currentStep 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-300 ${
                    step < currentStep ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isAnalyzing}
              className="h-9 px-4 text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border-slate-300 hover:border-slate-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button 
                onClick={handleNext}
                className="h-9 px-6 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isAnalyzing}
                className="h-9 px-6 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
