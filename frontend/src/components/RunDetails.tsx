'use client'

import { useQuery } from '@tanstack/react-query'
import { workflowsApi } from '@/lib/api'
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, FileText, Image, Code, Archive, ChevronDown, ChevronRight, Terminal, Folder } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useMemo } from 'react'
import { FileTree } from './FileTree'
import { FilePreviewModal } from './FilePreviewModal'
import { buildFileTree, FileNode } from '@/lib/fileTree'

interface RunDetailsProps {
  runId: string
  onBack: () => void
}

function JobLogsSection({ runId, jobId, isExpanded, onToggle }: {
  runId: string
  jobId: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const { data: logs } = useQuery({
    queryKey: ['job-logs', runId, jobId],
    queryFn: () => workflowsApi.getJobLogs(runId, jobId),
    enabled: isExpanded,
  })

  return (
    <div className="border-t border-gray-200 bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-start space-x-3 p-4 hover:bg-gray-50 text-left"
      >
        <Terminal className="h-4 w-4 text-gray-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">View Logs</p>
          <p className="text-xs text-gray-500 mt-0.5">Complete job output</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-600 mt-0.5" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-600 mt-0.5" />
        )}
      </button>
      
      {isExpanded && logs && (
        <div className="px-4 pb-4">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre">{logs}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export function RunDetails({ runId, onBack }: RunDetailsProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set())
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['run-details', runId],
    queryFn: () => workflowsApi.getRunDetails(runId),
  })

  const { data: jobs } = useQuery({
    queryKey: ['run-jobs', runId],
    queryFn: () => workflowsApi.getRunJobs(runId),
  })

  // Build file tree from all files (must be called before any conditional returns)
  const allFiles = useMemo(() => {
    if (!data) return []
    const { files } = data
    const categorizeFile = (file: typeof files.images[0] | typeof files.json[0] | typeof files.text[0] | typeof files.binary[0]) => {
      if (files.images.includes(file as typeof files.images[0])) return 'image'
      if (files.json.includes(file as typeof files.json[0])) return 'json'
      if (files.text.includes(file as typeof files.text[0])) return 'text'
      return 'binary'
    }

    return [...files.images, ...files.json, ...files.text, ...files.binary].map(file => ({
      ...file,
      fileType: categorizeFile(file),
      content: 'content' in file ? file.content : undefined,
      url: 'url' in file ? file.url : undefined
    }))
  }, [data])

  const fileTree = useMemo(() => buildFileTree(allFiles), [allFiles])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to runs</span>
          </button>
        </div>
        
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-300 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
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
            <span>Back to runs</span>
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-red-800 font-medium">Failed to load run details</h3>
          </div>
          <p className="text-red-700 text-sm mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { run, summary } = data

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return <Clock className="h-6 w-6 text-yellow-500" />
    }
    
    switch (conclusion) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'failure':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="h-6 w-6 text-gray-500" />
      default:
        return <Clock className="h-6 w-6 text-blue-500" />
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const toggleJobExpanded = (jobId: number) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  const toggleLogsExpanded = (jobId: number) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedLogs(newExpanded)
  }

  const getStepStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'in_progress') {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
    
    switch (conclusion) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }


  return (
    <div className="p-6 relative">
      {isFetching && !isLoading && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 z-10">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-blue-700">Updating...</span>
        </div>
      )}
      
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to runs</span>
        </button>
      </div>

      {/* Run Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(run.status, run.conclusion)}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Run #{run.runNumber}
              </h1>
              <p className="text-gray-600">
                {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })} • {formatDuration(run.duration)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Commit Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Message:</span> {run.commit.message}</p>
              <p><span className="font-medium">Author:</span> {run.commit.author}</p>
              <p><span className="font-medium">SHA:</span> <code className="bg-gray-100 px-1 rounded">{run.commit.sha.substring(0, 7)}</code></p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Files Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span>{summary.totalFiles} total</span>
              </div>
              <div className="flex items-center space-x-2">
                <Image className="h-4 w-4 text-blue-500" aria-label="Images" />
                <span>{summary.fileTypes.images} images</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-green-500" />
                <span>{summary.fileTypes.json} JSON</span>
              </div>
              <div className="flex items-center space-x-2">
                <Archive className="h-4 w-4 text-purple-500" />
                <span>{summary.fileTypes.text} text</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs */}
      {jobs && jobs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Jobs ({jobs.length})
          </h2>
          
          <div className="space-y-3">
            {jobs.map((job) => {
              const isExpanded = expandedJobs.has(job.id)
              const isLogsExpanded = expandedLogs.has(job.id)
              
              return (
                <div key={job.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Job Header */}
                  <div className="bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleJobExpanded(job.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                        
                        {getStatusIcon(job.status, job.conclusion)}
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{job.name}</h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                            <span>{job.status}</span>
                            {job.conclusion && (
                              <>
                                <span>•</span>
                                <span>{job.conclusion}</span>
                              </>
                            )}
                            {job.started_at && (
                              <>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Job Steps (when expanded) */}
                  {isExpanded && job.steps && job.steps.length > 0 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Steps ({job.steps.length})
                      </h4>
                      <div className="space-y-2">
                        {job.steps.map((step) => (
                          <div
                            key={step.id}
                            className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
                          >
                            {getStepStatusIcon(step.status, step.conclusion)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{step.name}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                                <span>#{step.number}</span>
                                <span>•</span>
                                <span>{step.status}</span>
                                {step.conclusion && (
                                  <>
                                    <span>•</span>
                                    <span>{step.conclusion}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Job Logs (collapsible like steps) */}
                  {isExpanded && job.status === 'completed' && (
                    <JobLogsSection 
                      runId={runId}
                      jobId={job.id}
                      isExpanded={isLogsExpanded}
                      onToggle={() => toggleLogsExpanded(job.id)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Files */}
      {summary.totalFiles > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Folder className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Extracted Files ({summary.totalFiles})
            </h2>
          </div>
          
          <FileTree nodes={fileTree} onFileClick={setSelectedFile} />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files extracted</h3>
            <p className="text-gray-500">
              This run did not produce any extractable artifacts or the artifacts may have expired.
            </p>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />
    </div>
  )
}
