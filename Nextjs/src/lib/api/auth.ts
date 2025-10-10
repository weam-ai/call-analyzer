import api from './client'
import { AuthResponse, ApiResponse } from '@/types/analysis'

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

