import axios from 'axios'
import { Analysis, AnalysisStats, AuthResponse, ApiResponse } from '@/types/analysis'
import { apiUrl } from '@/config/frontend-config'

const API_BASE_URL = apiUrl

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (no auth required)
api.interceptors.request.use(
  (config) => {
    // No authentication required - all requests are public
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors without redirecting to login
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { name, email, password })
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  updateProfile: async (data: any): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.put('/auth/profile', data)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword })
    return response.data
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout')
    return response.data
  },
}

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

export default api
