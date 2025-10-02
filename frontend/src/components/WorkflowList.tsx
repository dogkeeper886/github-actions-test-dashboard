'use client'

import { useQuery } from '@tanstack/react-query'
import { workflowsApi, type Workflow } from '@/lib/api'
import { CheckCircle, XCircle, Clock, AlertCircle, Activity, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface WorkflowCardProps {
  workflow: Workflow
  onClick: () => void
}

function WorkflowCard({ workflow, onClick }: WorkflowCardProps) {
  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return <Clock className="h-5 w-5 text-yellow-500" />
    }
    
    switch (conclusion) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failure':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Activity className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return 'border-yellow-200 bg-yellow-50'
    }
    
    switch (conclusion) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'failure':
        return 'border-red-200 bg-red-50'
      case 'cancelled':
        return 'border-gray-200 bg-gray-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div
      onClick={onClick}
      className={`
        border rounded-lg p-6 cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-300
        ${getStatusColor(
          workflow.latestRun?.status || 'unknown',
          workflow.latestRun?.conclusion || null
        )}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            {workflow.latestRun && getStatusIcon(
              workflow.latestRun.status,
              workflow.latestRun.conclusion
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {workflow.name}
            </h3>
          </div>
          
          {workflow.latestRun ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">
                  #{workflow.latestRun.runNumber}
                </span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(workflow.latestRun.createdAt), { addSuffix: true })}
                </span>
                <span>•</span>
                <span>
                  {formatDuration(workflow.latestRun.duration)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No runs yet</p>
          )}
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className={getSuccessRateColor(workflow.stats.successRate)}>
              {workflow.stats.successRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {workflow.stats.totalRuns} runs
          </p>
        </div>
      </div>
    </div>
  )
}

interface WorkflowListProps {
  onWorkflowSelect: (workflowId: number, workflowName: string) => void
}

export function WorkflowList({ onWorkflowSelect }: WorkflowListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.getWorkflows,
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-red-800 font-medium">Failed to load workflows</h3>
          </div>
          <p className="text-red-700 text-sm mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  if (!data?.workflows?.length) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500">
            No workflows have been discovered yet. The system may still be collecting data.
          </p>
        </div>
      </div>
    )
  }

  // Sort workflows: failed first, then by latest run time
  const sortedWorkflows = [...data.workflows].sort((a, b) => {
    // Failed workflows first
    const aFailed = a.latestRun?.conclusion === 'failure'
    const bFailed = b.latestRun?.conclusion === 'failure'
    
    if (aFailed && !bFailed) return -1
    if (!aFailed && bFailed) return 1
    
    // Then by latest run time
    const aTime = a.latestRun ? new Date(a.latestRun.createdAt).getTime() : 0
    const bTime = b.latestRun ? new Date(b.latestRun.createdAt).getTime() : 0
    
    return bTime - aTime
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Workflows ({data.workflows.length})
        </h2>
        <p className="text-gray-600">
          Click on a workflow to view its run history and details
        </p>
      </div>
      
      <div className="space-y-4">
        {sortedWorkflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            onClick={() => onWorkflowSelect(workflow.id, workflow.name)}
          />
        ))}
      </div>
    </div>
  )
}
