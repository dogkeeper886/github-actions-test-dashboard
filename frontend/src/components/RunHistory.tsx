'use client'

import { useQuery } from '@tanstack/react-query'
import { workflowsApi, type WorkflowRun } from '@/lib/api'
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, FileText, Image, Code, Archive, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface RunCardProps {
  run: WorkflowRun
  onClick: () => void
}

function RunCard({ run, onClick }: RunCardProps) {
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
        return <Clock className="h-5 w-5 text-blue-500" />
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

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div
      onClick={onClick}
      className={`
        border rounded-lg p-4 cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-300
        ${getStatusColor(run.status, run.conclusion)}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {getStatusIcon(run.status, run.conclusion)}
            <span className="font-semibold text-gray-900">
              #{run.runNumber}
            </span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
            </span>
            <span className="text-sm text-gray-500">
              {formatDuration(run.duration)}
            </span>
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {run.commit.message}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>by {run.commit.author}</span>
              <span>•</span>
              <span>{run.branch}</span>
              <span>•</span>
              <span>{run.event}</span>
              <span>•</span>
              <span className="font-mono">{run.commit.sha.substring(0, 7)}</span>
            </div>
          </div>
          
          {run.fileSummary.totalFiles > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{run.fileSummary.totalFiles} files</span>
              </div>
              {run.fileSummary.fileTypes.images > 0 && (
                <div className="flex items-center space-x-1">
                  <Image className="h-4 w-4" aria-label="Images" />
                  <span>{run.fileSummary.fileTypes.images}</span>
                </div>
              )}
              {run.fileSummary.fileTypes.json > 0 && (
                <div className="flex items-center space-x-1">
                  <Code className="h-4 w-4" />
                  <span>{run.fileSummary.fileTypes.json}</span>
                </div>
              )}
              {run.fileSummary.fileTypes.text > 0 && (
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{run.fileSummary.fileTypes.text}</span>
                </div>
              )}
              {run.fileSummary.fileTypes.binary > 0 && (
                <div className="flex items-center space-x-1">
                  <Archive className="h-4 w-4" />
                  <span>{run.fileSummary.fileTypes.binary}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface RunHistoryProps {
  workflowId: number
  workflowName: string
  onBack: () => void
  onRunSelect: (runId: string) => void
}

export function RunHistory({ workflowId, workflowName, onBack, onRunSelect }: RunHistoryProps) {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['workflow-runs', workflowId, page, statusFilter],
    queryFn: () => workflowsApi.getWorkflowRuns(workflowId, {
      page,
      limit: 20,
      status: statusFilter === 'all' ? undefined : statusFilter
    }),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to workflows</span>
          </button>
        </div>
        
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
                <div className="h-5 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to workflows</span>
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-red-800 font-medium">Failed to load runs</h3>
          </div>
          <p className="text-red-700 text-sm mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  const runs = data?.runs || []
  const pagination = data?.pagination as { page: number; limit: number; total: number; totalPages: number } | undefined

  return (
    <div className="p-6 relative">
      {isFetching && !isLoading && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 z-10">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-blue-700">Updating...</span>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to workflows</span>
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {workflowName}
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {pagination ? `${pagination.total} total runs` : 'Loading runs...'}
          </p>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All runs</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="queued">Queued</option>
          </select>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No runs found</h3>
          <p className="text-gray-500">
            No workflow runs match the current filter.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {runs.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                onClick={() => onRunSelect(run.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
