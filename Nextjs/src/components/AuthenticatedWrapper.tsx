'use client'

import { useState, useEffect } from 'react'
import { AuthorizationMessage } from './AuthorizationMessage'

interface AuthenticatedWrapperProps {
  children: React.ReactNode
}

export function AuthenticatedWrapper({ children }: AuthenticatedWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/call-analyzer/api/user/session')
        const data = await response.json()
        
        if (data.success && data.data.companyId) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Failed to check authentication:', error)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show authorization message if not authenticated
  if (!isAuthenticated) {
    return <AuthorizationMessage />
  }

  // Show the authenticated content
  return <>{children}</>
}
