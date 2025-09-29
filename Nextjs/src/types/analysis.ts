export interface Analysis {
  _id: string
  userId: string
  serviceType: 'audio' | 'fathom' | 'transcript'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input: {
    // Step 1: Call Data Input (only one can be used)
    audioFile?: {
      originalName: string
      fileName: string
      fileSize: number
      mimeType: string
      duration?: number
    }
    fathomUrl?: string
    transcript?: string
    
    // Step 2: Product/Service Information (only one can be used)
    productServiceUrl?: string
    productServiceDocument?: {
      originalName: string
      fileName: string
      fileSize: number
      mimeType: string
      content?: string // Extracted text content
    }
    
    // Step 3: Prompt Selection
    promptType?: 'default' | 'custom'
    customPrompt?: string
    selectedPrompt?: string // The actual prompt used for analysis
  }
  processing: {
    transcript?: {
      text?: string
      confidence?: number
      language?: string
      duration?: number
      wordCount?: number
    }
    scrapedContent?: {
      text?: string
      url?: string
      title?: string
      wordCount?: number
    }
    llmAnalysis?: {
      prompt?: string
      response?: string
      tokensUsed?: {
        input?: number
        output?: number
        total?: number
      }
      cost?: number
      model?: string
      processingTime?: number
    }
  }
  results?: {
    // Call Overview
    callDescription?: string
    summary?: string
    callRating?: number // 1-10 scale
    
    // Demographic Information
    prospectDemographics?: {
      teamSize?: string
      workVolume?: string
      location?: string
      previousExperience?: string
      likelihoodOfClosing?: string
      website?: string
      businessSummary?: string
    }
    
    // Sales Team Performance
    salesPerformance?: {
      responsiveness?: string
      satisfaction?: string
      engagement?: string
    }
    
    // Analysis Results
    keyInsights?: string[]
    recommendations?: string[]
    otherNotableFindings?: string[]
    
    // Sales Opportunity Analysis
    salesOpportunities?: {
      productServiceGap?: string[]
      upsellingOpportunities?: Array<{
        opportunity: string
        relevance: number // 1-5
        likelihood: number // 1-5
        revenueImpact: number // 1-5
      }>
      crossSellingOpportunities?: Array<{
        opportunity: string
        relevance: number // 1-5
        likelihood: number // 1-5
        revenueImpact: number // 1-5
      }>
    }
    
    // Legacy fields for backward compatibility
    actionItems?: string[]
    sentiment?: {
      overall?: 'positive' | 'neutral' | 'negative'
      confidence?: number
      breakdown?: {
        positive?: number
        neutral?: number
        negative?: number
      }
    }
    topics?: string[]
    participants?: Array<{
      name?: string
      role?: string
      speakingTime?: number
      keyPoints?: string[]
    }>
    riskFactors?: string[]
    opportunities?: string[]
  }
  metadata: {
    processingTime: number
    fileSize?: number
    createdAt: string
    completedAt?: string
    error?: {
      message: string
      code: string
      stack: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface AnalysisStats {
  overview: {
    totalAnalyses: number
    completedAnalyses: number
    failedAnalyses: number
    totalCost: number
    avgProcessingTime: number
  }
  byService: Array<{
    _id: string
    count: number
    avgCost: number
  }>
}

export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  lastLogin?: string
  preferences: {
    analysisSettings: {
      defaultService: 'audio' | 'phantom' | 'transcript'
      autoDeleteFiles: boolean
      analysisDepth: 'basic' | 'detailed' | 'comprehensive'
    }
  }
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: User
    token: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{
    field: string
    message: string
  }>
}
