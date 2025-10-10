export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'status-pending'
    case 'processing':
      return 'status-processing'
    case 'completed':
      return 'status-completed'
    case 'failed':
      return 'status-failed'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getServiceColor(service: string): string {
  switch (service) {
    case 'audio':
      return 'service-audio'
    case 'fathom':
      return 'service-fathom'
    case 'phantom':
      return 'service-phantom'
    case 'transcript':
      return 'service-transcript'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

