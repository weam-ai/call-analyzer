/**
 * Utility functions for URL manipulation
 */

/**
 * Gets the base URL from the current window location
 * Examples:
 * - http://localhost:3000/call-analyzer -> http://localhost:3000
 * - https://dev.weam.ai/call-analyzer -> https://dev.weam.ai
 * - https://app.example.com/some/path -> https://app.example.com
 */
export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return ''
  }
  
  const { protocol, hostname, port } = window.location
  
  // Handle different port scenarios
  const portString = port && port !== '80' && port !== '443' ? `:${port}` : ''
  
  return `${protocol}//${hostname}${portString}`
}

/**
 * Redirects to the base URL
 */
export function redirectToBaseUrl(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  const baseUrl = getBaseUrl()
  if (baseUrl) {
    window.location.href = baseUrl
  }
}
