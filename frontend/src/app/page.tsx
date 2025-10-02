'use client'

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { WorkflowList } from '@/components/WorkflowList'
import { RunHistory } from '@/components/RunHistory'
import { RunDetails } from '@/components/RunDetails'
import { RefreshButton } from '@/components/RefreshButton'

type View = 'workflows' | 'runs' | 'details'

interface ViewState {
  view: View
  workflowId?: number
  workflowName?: string
  runId?: string
}

export default function Dashboard() {
  const [viewState, setViewState] = useState<ViewState>({ view: 'workflows' })

  const handleWorkflowSelect = (workflowId: number, workflowName?: string) => {
    setViewState({ 
      view: 'runs', 
      workflowId, 
      workflowName: workflowName || `Workflow ${workflowId}` 
    })
  }

  const handleRunSelect = (runId: string) => {
    setViewState({ 
      ...viewState, 
      view: 'details', 
      runId 
    })
  }

  const handleBackToWorkflows = () => {
    setViewState({ view: 'workflows' })
  }

  const handleBackToRuns = () => {
    setViewState({ 
      view: 'runs', 
      workflowId: viewState.workflowId,
      workflowName: viewState.workflowName 
    })
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header with refresh button */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {viewState.view === 'workflows' && (
                <h1 className="text-xl font-semibold text-gray-900">
                  All Workflows
                </h1>
              )}
              {viewState.view === 'runs' && (
                <h1 className="text-xl font-semibold text-gray-900">
                  {viewState.workflowName} - Runs
                </h1>
              )}
              {viewState.view === 'details' && (
                <h1 className="text-xl font-semibold text-gray-900">
                  Run Details
                </h1>
              )}
            </div>
            
            <RefreshButton />
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white">
          {viewState.view === 'workflows' && (
            <WorkflowList 
              onWorkflowSelect={(id, name) => handleWorkflowSelect(id, name)} 
            />
          )}
          
          {viewState.view === 'runs' && viewState.workflowId && (
            <RunHistory
              workflowId={viewState.workflowId}
              workflowName={viewState.workflowName || ''}
              onBack={handleBackToWorkflows}
              onRunSelect={handleRunSelect}
            />
          )}
          
          {viewState.view === 'details' && viewState.runId && (
            <RunDetails
              runId={viewState.runId}
              onBack={handleBackToRuns}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}