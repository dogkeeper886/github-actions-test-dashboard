// Utility functions for building and managing file tree structures

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  fileData?: {
    id: string
    size: number
    artifactName: string
    content?: unknown
    url?: string
    fileType: string
  }
}

export function buildFileTree(files: Array<{
  id: string
  originalPath: string
  size: number
  artifactName: string
  content?: unknown
  url?: string
  fileType?: string
}>): FileNode[] {
  const root: FileNode[] = []

  files.forEach((file) => {
    const parts = file.originalPath.split('/')
    let currentLevel = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      const existingNode = currentLevel.find((node) => node.name === part)

      if (existingNode) {
        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        }

        if (isFile) {
          newNode.fileData = {
            id: file.id,
            size: file.size,
            artifactName: file.artifactName,
            content: file.content,
            url: file.url,
            fileType: file.fileType || 'unknown',
          }
        }

        currentLevel.push(newNode)

        if (!isFile && newNode.children) {
          currentLevel = newNode.children
        }
      }
    })
  })

  return root
}

export function getFileIcon(fileName: string, fileType: string): string {
  if (fileType === 'image' || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(fileName)) {
    return '🖼️'
  }
  if (fileType === 'json' || /\.json$/i.test(fileName)) {
    return '📄'
  }
  if (fileType === 'text' || /\.(txt|log|md)$/i.test(fileName)) {
    return '📝'
  }
  if (/\.(zip|tar|gz)$/i.test(fileName)) {
    return '📦'
  }
  return '📄'
}

export function getFolderIcon(isExpanded: boolean): string {
  return isExpanded ? '📂' : '📁'
}

