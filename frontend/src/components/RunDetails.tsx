'use client'

import { useQuery } from '@tanstack/react-query'
import { workflowsApi, type Job } from '@/lib/api'
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, FileText, Image, Code, Archive, Download, Eye, ChevronDown, ChevronRight, Terminal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface RunDetailsProps {
  runId: string
  onBack: () => void
}

export function RunDetails({ runId, onBack }: RunDetailsProps) {
  const [selectedFile, setSelectedFile] = useState<{ id: string; originalPath: string; size: number; artifactName: string; content?: unknown; url?: string } | null>(null)
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set())
  const [selectedJobForLogs, setSelectedJobForLogs] = useState<number | null>(null)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['run-details', runId],
    queryFn: () => workflowsApi.getRunDetails(runId),
  })

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['run-jobs', runId],
    queryFn: () => workflowsApi.getRunJobs(runId),
  })

  const { data: logs } = useQuery({
    queryKey: ['job-logs', runId, selectedJobForLogs],
    queryFn: () => workflowsApi.getJobLogs(runId, selectedJobForLogs!),
    enabled: selectedJobForLogs !== null,
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

  const { run, summary, files } = data

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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

  const FileSection = ({ title, icon: Icon, files: sectionFiles, type }: { 
    title: string
    icon: React.ComponentType<{ className?: string }>
    files: Array<{ id: string; originalPath: string; size: number; artifactName: string; content?: unknown; url?: string }>
    type: string 
  }) => {
    if (sectionFiles.length === 0) return null

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Icon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            {title} ({sectionFiles.length})
          </h3>
        </div>
        
        <div className="space-y-2">
          {sectionFiles.map((file) => (
            <div
              key={file.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.originalPath}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.artifactName}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {(type === 'json' || type === 'text') && file.content !== undefined && (
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  )}
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      aria-label={`Download ${file.originalPath}`}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

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
              const isLogSelected = selectedJobForLogs === job.id
              
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
                      
                      {job.status === 'completed' && (
                        <button
                          onClick={() => setSelectedJobForLogs(isLogSelected ? null : job.id)}
                          className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded ${
                            isLogSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Terminal className="h-4 w-4" />
                          <span>{isLogSelected ? 'Hide Logs' : 'View Logs'}</span>
                        </button>
                      )}
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
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Job Logs Panel */}
      {selectedJobForLogs && logs && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Job Logs: {jobs?.find(j => j.id === selectedJobForLogs)?.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedJobForLogs(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre">{logs}</pre>
          </div>
        </div>
      )}

      {/* Files */}
      {summary.totalFiles > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Extracted Files
          </h2>
          
          <FileSection title="Images" icon={Image} files={files.images} type="images" />
          <FileSection title="JSON Files" icon={Code} files={files.json} type="json" />
          <FileSection title="Text Files" icon={FileText} files={files.text} type="text" />
          <FileSection title="Binary Files" icon={Archive} files={files.binary} type="binary" />
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

      {/* File Content Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedFile.originalPath}
              </h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                {typeof selectedFile.content === 'string' 
                  ? selectedFile.content 
                  : JSON.stringify(selectedFile.content, null, 2)
                }
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
