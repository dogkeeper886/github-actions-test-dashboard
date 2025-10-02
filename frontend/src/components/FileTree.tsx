'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Download, Eye } from 'lucide-react'
import { FileNode, getFileIcon, getFolderIcon } from '@/lib/fileTree'

interface FileTreeProps {
  nodes: FileNode[]
  onFileClick: (node: FileNode) => void
  level?: number
}

export function FileTree({ nodes, onFileClick, level = 0 }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isExpanded = expandedFolders.has(node.path)
        const isFolder = node.type === 'folder'

        return (
          <div key={node.path}>
            {/* Folder or File Row */}
            <div
              className={`flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-gray-50 ${
                isFolder ? 'cursor-pointer' : ''
              }`}
              style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
              onClick={() => isFolder && toggleFolder(node.path)}
            >
              {/* Expand/Collapse Icon for Folders */}
              {isFolder && (
                <button className="text-gray-500 hover:text-gray-700">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Folder/File Icon */}
              <span className="text-lg">
                {isFolder
                  ? getFolderIcon(isExpanded)
                  : getFileIcon(node.name, node.fileData?.fileType || '')}
              </span>

              {/* File/Folder Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{node.name}</p>
                {!isFolder && node.fileData && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(node.fileData.size)} • {node.fileData.artifactName}
                  </p>
                )}
              </div>

              {/* File Actions */}
              {!isFolder && node.fileData && (
                <div className="flex items-center space-x-1">
                  {/* View Button for images/json/text */}
                  {(node.fileData.fileType === 'image' ||
                    node.fileData.fileType === 'json' ||
                    node.fileData.fileType === 'text' ||
                    node.fileData.content !== undefined) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFileClick(node)
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Preview file"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}

                  {/* Download Button */}
                  {node.fileData.url && (
                    <a
                      href={node.fileData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Render Children for Expanded Folders */}
            {isFolder && isExpanded && node.children && node.children.length > 0 && (
              <FileTree nodes={node.children} onFileClick={onFileClick} level={level + 1} />
            )}
          </div>
        )
      })}
    </div>
  )
}

