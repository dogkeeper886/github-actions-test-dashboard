"use client";

import React from "react";
import { FileNode } from "@/lib/fileTree";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FilePreviewModalProps {
  file: FileNode | null;
  onClose: () => void;
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function renderFileContent(
  file: FileNode,
  fileType: string,
  content: string | object | undefined,
  url?: string,
) {
  // Image files
  if (fileType === "image" && url) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100">
        <img
          src={url}
          alt={file.name}
          className="max-w-full max-h-[70vh] object-contain rounded"
        />
      </div>
    );
  }

  // JSON files
  if (fileType === "json" || (content && typeof content === "object")) {
    return (
      <div className="p-4 bg-gray-50 overflow-auto max-h-[70vh]">
        <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  }

  // Markdown files
  if (file.name.endsWith(".md") && typeof content === "string") {
    return (
      <div className="p-4 bg-white overflow-auto max-h-[70vh] prose prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Text files
  if (fileType === "text" || typeof content === "string") {
    return (
      <div className="p-4 bg-gray-50 overflow-auto max-h-[70vh]">
        <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
          {content}
        </pre>
      </div>
    );
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
  );
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file || !file.fileData) return null;

  const { fileType, url } = file.fileData;
  const content = file.fileData.content as string | object | undefined;

  const handleDownload = () => {
    if (!content) return;

    let blob: Blob;

    if (fileType === "json" || typeof content === "object") {
      blob = new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      });
    } else if (typeof content === "string") {
      blob = new Blob([content], { type: "text/plain" });
    } else {
      return;
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {file.name}
            </h3>
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

        <div className="flex-1 overflow-hidden">
          {renderFileContent(file, fileType, content, url) as React.ReactNode}
        </div>

        {/* Footer with Download Link */}
        {(url || content) && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
            {url ? (
              <a
                href={url}
                download
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <DownloadIcon />
                Download {file.name}
              </a>
            ) : (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <DownloadIcon />
                Download {file.name}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
