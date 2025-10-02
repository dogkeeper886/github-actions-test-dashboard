'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowsApi } from '@/lib/api'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export function RefreshButton() {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const queryClient = useQueryClient()

  const refreshMutation = useMutation({
    mutationFn: workflowsApi.refreshData,
    onSuccess: () => {
      // Invalidate all queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-runs'] })
      queryClient.invalidateQueries({ queryKey: ['run-details'] })
      queryClient.invalidateQueries({ queryKey: ['refresh-status'] })
      
      setLastRefresh(new Date())
    },
    onError: (error: Error & { response?: { status: number } }) => {
      // Check if it's an "in progress" error
      if (error?.response?.status === 409) {
        console.log('Refresh already in progress')
      }
    }
  })

  const handleRefresh = () => {
    refreshMutation.mutate()
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleRefresh}
        disabled={refreshMutation.isPending}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${refreshMutation.isPending
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        <RefreshCw 
          className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} 
        />
        <span>
          {refreshMutation.isPending ? 'Refreshing...' : 'Refresh Data'}
        </span>
      </button>

      {/* Status indicator */}
      {refreshMutation.isSuccess && (
        <div className="flex items-center space-x-1 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Updated</span>
        </div>
      )}
      
      {refreshMutation.isError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <XCircle className="h-4 w-4" />
          <span>
            {(refreshMutation.error as Error & { response?: { status: number } })?.response?.status === 409 
              ? 'Already refreshing...' 
              : 'Failed'}
          </span>
        </div>
      )}

      {lastRefresh && (
        <span className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
