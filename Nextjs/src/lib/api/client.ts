import axios from 'axios'
import { apiUrl } from '@/config/frontend-config'
import { getSessionData } from '@/actions/session'

const API_BASE_URL = apiUrl

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add user data
api.interceptors.request.use(
  async (config) => {
    // Get user data from session
    const sessionResult = await getSessionData();
    
    // Add user data to request headers
    config.headers['X-User-Data'] = JSON.stringify({
      userId: sessionResult.data.id,
      email: sessionResult.data.email,
      companyId: sessionResult.data.companyId
    });
    
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

export default api

