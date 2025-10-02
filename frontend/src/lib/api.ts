// API client for GitHub Actions Dashboard backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// API types based on our backend responses
export interface Workflow {
  id: number
  name: string
  status: string
  latestRun: {
    id: string
    status: string
    conclusion: string | null
    createdAt: string
    runNumber: number
    duration: number
  } | null
  stats: {
    totalRuns: number
    successRate: number
    avgDuration: number | null
  }
}

export interface WorkflowRun {
  id: string
  runNumber: number
  status: string
  conclusion: string | null
  createdAt: string
  duration: number
  commit: {
    sha: string
    message: string
    author: string
  }
  branch: string
  event: string
  fileSummary: {
    totalFiles: number
    fileTypes: {
      images: number
      json: number
      text: number
      binary: number
    }
  }
}

export interface RunDetails {
  run: {
    id: string
    runNumber: number
    status: string
    conclusion: string | null
    createdAt: string
    duration: number
    commit: {
      sha: string
      message: string
      author: string
    }
  }
  summary: {
    totalFiles: number
    fileTypes: {
      images: number
      json: number
      text: number
      binary: number
    }
  }
  files: {
    images: Array<{
      id: string
      originalPath: string
      url: string
      size: number
      artifactName: string
    }>
    json: Array<{
      id: string
      originalPath: string
      content: unknown
      size: number
      artifactName: string
    }>
    text: Array<{
      id: string
      originalPath: string
      content: string
      size: number
      artifactName: string
    }>
    binary: Array<{
      id: string
      originalPath: string
      url: string
      size: number
      artifactName: string
    }>
  }
}

export interface RefreshStatus {
  status: string
  pollInterval: number
  nextPollIn: string
  lastSync: string | null
  isRunning: boolean
}

export interface JobStep {
  id: number
  job_id: number
  name: string
  status: string
  conclusion: string | null
  number: number
  started_at: string | null
  completed_at: string | null
}

export interface Job {
  id: number
  run_id: number
  name: string
  status: string
  conclusion: string | null
  started_at: string
  completed_at: string | null
  url: string
  html_url: string
  steps: JobStep[]
}

// API functions
export const workflowsApi = {
  getWorkflows: (): Promise<{ workflows: Workflow[] }> =>
    apiClient.get('/workflows'),
    
  getWorkflowRuns: (workflowId: number, params?: { page?: number; limit?: number; status?: string }): Promise<{ runs: WorkflowRun[]; pagination: unknown }> => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    
    const query = searchParams.toString()
    return apiClient.get(`/workflows/${workflowId}/runs${query ? `?${query}` : ''}`)
  },
    
  getRunDetails: (runId: string): Promise<RunDetails> =>
    apiClient.get(`/runs/${runId}/files`),
    
  getRunJobs: (runId: string): Promise<Job[]> =>
    apiClient.get(`/runs/${runId}/jobs`),
    
  getJobLogs: (runId: string, jobId: number): Promise<string> =>
    apiClient.get(`/runs/${runId}/jobs/${jobId}/logs`),
    
  refreshData: (): Promise<unknown> =>
    apiClient.post('/refresh/collect'),
    
  getRefreshStatus: (): Promise<RefreshStatus> =>
    apiClient.get('/refresh/status'),
}
