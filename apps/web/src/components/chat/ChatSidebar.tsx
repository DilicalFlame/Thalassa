'use client'

import { useState } from 'react'
import type { Session } from '@/types/chat'

interface ChatSidebarProps {
  sessions: Session[]
  currentSession: Session | null
  onSelectSession: (session: Session) => void
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => void
  isOpen: boolean
  onToggle: () => void
}

export default function ChatSidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  const [deletingSession, setDeletingSession] = useState<string | null>(null)

  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation()
    setDeletingSession(sessionId)
    try {
      await onDeleteSession(sessionId)
    } finally {
      setDeletingSession(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 1) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getSessionPreview = (session: Session) => {
    // Truncate session ID for display
    return `Session ${session.id.slice(0, 8)}...`
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className='fixed inset-0 z-40 lg:hidden'>
          <div
            className='fixed inset-0 bg-slate-600 bg-opacity-75 dark:bg-slate-900 dark:bg-opacity-75'
            onClick={onToggle}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-50/70 shadow-lg backdrop-blur-lg transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 dark:bg-slate-900/70 dark:from-slate-900 dark:to-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'} `}
      >
        <div className='flex h-full flex-col border-r border-slate-200 dark:border-slate-800'>
          {/* Header */}
          <div className='flex items-center justify-between p-4'>
            <h2 className='text-lg font-semibold text-slate-800 dark:text-slate-200'>
              Chat History
            </h2>
            <button
              onClick={onToggle}
              className='p-2 text-slate-500 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:text-slate-200'
              title='Close sidebar'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className='border-b border-t border-slate-200 p-4 dark:border-slate-700'>
            <button
              onClick={onNewSession}
              className='flex w-full items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              title='New Chat'
            >
              <svg
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              New Chat
            </button>
          </div>

          {/* Sessions List */}
          <div className='flex-1 overflow-y-auto'>
            {sessions.length === 0 ? (
              <div className='p-4 text-center text-slate-500 dark:text-slate-400'>
                <svg
                  className='mx-auto mb-3 h-12 w-12 text-cyan-300 dark:text-cyan-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
                <p className='text-sm'>No chat sessions yet</p>
                <button
                  onClick={onNewSession}
                  className='mt-2 text-sm text-blue-600 hover:text-cyan-700 dark:text-blue-400 dark:hover:text-cyan-300'
                >
                  Start your first chat
                </button>
              </div>
            ) : (
              <div className='space-y-1 p-2'>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative cursor-pointer rounded-lg p-3 transition-colors ${
                      currentSession?.id === session.id
                        ? 'border border-cyan-200 bg-cyan-50 dark:border-cyan-600 dark:bg-cyan-900/30'
                        : 'hover:bg-cyan-50 dark:hover:bg-slate-700/50'
                    } `}
                    onClick={() => onSelectSession(session)}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-slate-900 dark:text-slate-100'>
                          {getSessionPreview(session)}
                        </p>
                        <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        disabled={deletingSession === session.id}
                        className='p-1 text-slate-400 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:text-red-400'
                        title='Delete session'
                      >
                        {deletingSession === session.id ? (
                          <svg
                            className='h-4 w-4 animate-spin'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='border-t border-cyan-200 p-4 dark:border-slate-600'>
            <div className='text-center text-xs text-slate-500 dark:text-slate-400'>
              Argo AI Assistant
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
