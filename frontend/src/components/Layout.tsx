'use client'

import { ReactNode } from 'react'
import { Activity, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { workflowsApi } from '@/lib/api'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { data: statusData } = useQuery({
    queryKey: ['refresh-status'],
    queryFn: workflowsApi.getRefreshStatus,
    refetchInterval: 30 * 1000, // Check status every 30 seconds
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  GitHub Actions Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Workflow results and artifacts
                </p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-4">
              {statusData && (
                <div className="flex items-center space-x-2 text-sm">
                  {statusData.isRunning ? (
                    <>
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Running</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Next: {statusData.nextPollIn}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>Stopped</span>
                    </div>
                  )}
                  {statusData.lastSync && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        Last sync: {new Date(statusData.lastSync).toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
