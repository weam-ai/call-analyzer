import api from './client'
import { Analysis, AnalysisStats, ApiResponse } from '@/types/analysis'

// Analysis API
export const analysisApi = {
  // Get all analyses
  getAnalyses: async (params?: {
    page?: number
    limit?: number
    serviceType?: string
    status?: string
  }): Promise<ApiResponse<{ analyses: Analysis[]; pagination: any }>> => {
    const response = await api.get('/analysis', { params })
    return response.data
  },

  // Get specific analysis
  getAnalysis: async (id: string): Promise<ApiResponse<Analysis>> => {
    const response = await api.get(`/analysis/${id}`)
    return response.data
  },

  // Audio analysis
  analyzeAudio: async (formData: FormData): Promise<ApiResponse<Analysis>> => {
    const response = await api.post('/analysis/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Fathom analysis
  analyzeFathom: async (data: {
    url: string
    additionalUrl?: string
    additionalDocument?: string
  }): Promise<ApiResponse<Analysis>> => {
    const response = await api.post('/analysis/fathom', data)
    return response.data
  },

  // Phantom analysis (backward compatibility)
  analyzePhantom: async (data: {
    url: string
    additionalUrl?: string
    additionalDocument?: string
  }): Promise<ApiResponse<Analysis>> => {
    const response = await api.post('/analysis/phantom', data)
    return response.data
  },

  // Transcript analysis
  analyzeTranscript: async (data: {
    transcript: string
    additionalUrl?: string
    additionalDocument?: string
  }): Promise<ApiResponse<Analysis>> => {
    const response = await api.post('/analysis/transcript', data)
    return response.data
  },

  // Delete analysis
  deleteAnalysis: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/analysis/${id}`)
    return response.data
  },

  // Get analysis statistics
  getStats: async (): Promise<ApiResponse<AnalysisStats>> => {
    const response = await api.get('/analysis/stats/overview')
    return response.data
  },
}

