'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  FileText, 
  Clock, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

export function Sidebar() {
  const [stats] = useState({
    totalAnalyses: 12,
    completedAnalyses: 10,
    failedAnalyses: 2,
    totalCost: 0.0456,
    avgProcessingTime: 45
  })

  const [recentAnalyses] = useState([
    { id: '1', type: 'audio', status: 'completed', name: 'Q4 Sales Call #1', time: '2 min ago' },
    { id: '2', type: 'phantom', status: 'processing', name: 'Client Meeting Transcript', time: '5 min ago' },
    { id: '3', type: 'transcript', status: 'completed', name: 'Demo Call Analysis', time: '1 hour ago' },
    { id: '4', type: 'audio', status: 'failed', name: 'Team Sync Call', time: '2 hours ago' },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'audio':
        return 'bg-purple-100 text-purple-800'
      case 'phantom':
        return 'bg-indigo-100 text-indigo-800'
      case 'transcript':
        return 'bg-teal-100 text-teal-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <aside className="w-80 bg-muted/30 p-6 space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
          <CardDescription>Your analysis overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedAnalyses}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedAnalyses}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="font-medium">${stats.totalCost.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg. Time</span>
              <span className="font-medium">{stats.avgProcessingTime}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Analyses</CardTitle>
          <CardDescription>Your latest analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                {getStatusIcon(analysis.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{analysis.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${getServiceColor(analysis.type)}`}>
                      {analysis.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{analysis.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common analysis tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Upload Audio
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analyze URL
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage</CardTitle>
          <CardDescription>Your current plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyses this month</span>
              <span>12 / 50</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }} />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>API calls</span>
              <span>1,234 / 10,000</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '12%' }} />
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full">
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    </aside>
  )
}
