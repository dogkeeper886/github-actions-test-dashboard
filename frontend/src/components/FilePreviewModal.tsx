'use client'

import { FileNode } from '@/lib/fileTree'
import { X } from 'lucide-react'

interface FilePreviewModalProps {
  file: FileNode | null
  onClose: () => void
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file || !file.fileData) return null

  const { fileType, content, url } = file.fileData

  const renderContent = () => {
    // Image files
    if (fileType === 'image' && url) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-100">
          <img
            src={url}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain rounded"
          />
        </div>
      )
    }

    // JSON files
    if (fileType === 'json' || (content && typeof content === 'object')) {
      return (
        <div className="p-4 bg-gray-50 overflow-auto max-h-[70vh]">
          <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      )
    }

    // Text files
    if (fileType === 'text' || typeof content === 'string') {
      return (
        <div className="p-4 bg-gray-50 overflow-auto max-h-[70vh]">
          <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">{String(content)}</pre>
        </div>
      )
    }

    // Fallback for unsupported types
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Preview not available for this file type.</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download File
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">{file.name}</h3>
            <p className="text-sm text-gray-500 truncate">{file.path}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>

        {/* Footer with Download Link */}
        {url && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Download {file.name}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

