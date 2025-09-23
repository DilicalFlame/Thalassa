'use client'

import { useState, useEffect } from 'react'
import ChatSidebar from './ChatSidebar'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import DarkModeToggle from '../DarkModeToggle'
import { chatService } from '@/services/chatService'
import type { Session, Message } from '@/types/chat'
import { useFadeIn, useScaleIn } from '@/hooks/useAnimations'
import { hapticUtils } from '@/lib/haptics'

export default function ChatInterface() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const containerRef = useFadeIn<HTMLDivElement>(0, 'none')
  const headerRef = useFadeIn<HTMLDivElement>(0.2, 'down')
  const welcomeRef = useScaleIn<HTMLDivElement>(0.6)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id)
    }
  }, [currentSession])

  const loadSessions = async () => {
    try {
      setConnectionError(null)
      const sessionData = await chatService.getSessions()
      setSessions(sessionData.sessions)
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      setConnectionError(
        'Unable to connect to the AI service. Please make sure the backend server is running.'
      )
      setIsConnected(false)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      setIsLoading(true)
      const history = await chatService.getHistory(sessionId)
      setMessages(history.history)
    } catch (error) {
      // Handle 404 errors gracefully for new sessions with no history
      if (error instanceof Error && error.message.includes('404')) {
        console.log(
          'No history found for session (this is normal for new sessions)'
        )
        setMessages([])
      } else {
        console.error('Failed to load messages:', error)
        setMessages([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createNewSession = async () => {
    try {
      // Haptic feedback for creating new session
      hapticUtils.buttonPress()

      const newSession = await chatService.createSession()
      const session: Session = {
        id: newSession.session_id,
        created_at: new Date().toISOString(),
      }
      setSessions((prev) => [session, ...prev])
      setCurrentSession(session)
      setMessages([])
      setConnectionError(null)
      setIsConnected(true)

      // Success haptic feedback
      hapticUtils.success()
    } catch (error) {
      console.error('Failed to create session:', error)
      setConnectionError(
        'Failed to create new session. Please check your connection to the AI service.'
      )
      setIsConnected(false)

      // Error haptic feedback
      hapticUtils.error()
    }
  }

  const selectSession = (session: Session) => {
    // Haptic feedback for session selection
    hapticUtils.itemSelect()
    setCurrentSession(session)
  }

  const deleteSession = async (sessionId: string) => {
    try {
      // Haptic feedback for deletion
      hapticUtils.itemDelete()

      await chatService.deleteSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      // Error haptic feedback
      hapticUtils.error()
    }
  }

  const sendMessage = async (message: string) => {
    if (!currentSession) {
      await createNewSession()
      return
    }

    try {
      setIsLoading(true)

      // Haptic feedback for sending message
      hapticUtils.sendMessage()

      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Send to API
      const response = await chatService.sendMessage(currentSession.id, message)

      // Update messages with the full history from response
      setMessages(response.history)

      // Haptic feedback for receiving response
      hapticUtils.receiveMessage()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove the optimistically added user message on error
      setMessages((prev) => prev.slice(0, -1))
      setConnectionError(
        'Failed to send message. Please check your connection to the AI service.'
      )
      setIsConnected(false)

      // Haptic feedback for error
      hapticUtils.error()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className='flex h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800'
    >
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={selectSession}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className='relative flex min-w-0 flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <div
          ref={headerRef}
          className='flex items-center justify-between border-b border-cyan-200 bg-gradient-to-r from-blue-600 to-cyan-600 p-4 shadow-sm dark:border-slate-600 dark:from-slate-700 dark:to-slate-600'
        >
          <div className='flex items-center space-x-3'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='rounded-md p-2 text-white hover:bg-blue-700 lg:hidden dark:hover:bg-slate-600'
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
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>
            <h1 className='text-xl font-semibold text-white'>
              {currentSession ? 'Argo AI Chat' : 'Select or Create a Session'}
            </h1>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='hidden'>
              <DarkModeToggle />
            </div>
          </div>
        </div>

        {/* Connection Error Banner */}
        {connectionError && (
          <div className='border-b border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <svg
                  className='mr-3 h-5 w-5 text-red-400 dark:text-red-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
                <div>
                  <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                    Connection Error
                  </h3>
                  <p className='text-sm text-red-700 dark:text-red-300'>
                    {connectionError}
                  </p>
                </div>
              </div>
              <div className='flex space-x-2'>
                <button
                  onClick={loadSessions}
                  className='rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-800/50 dark:text-red-200 dark:hover:bg-red-800/70'
                >
                  Retry
                </button>
                <button
                  onClick={() => setConnectionError(null)}
                  className='rounded-md p-1 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300'
                >
                  <svg
                    className='h-4 w-4'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          {currentSession ? (
            <ChatMessages messages={messages} isLoading={isLoading} />
          ) : (
            <div className='flex h-full items-center justify-center text-center'>
              <div ref={welcomeRef} className='max-w-md'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-slate-700 dark:to-slate-600'>
                  <svg
                    className='h-8 w-8 text-blue-600 dark:text-blue-400'
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
                </div>
                <h3 className='mb-2 text-lg font-medium text-slate-800 dark:text-slate-200'>
                  Welcome to Argo AI
                </h3>
                <p className='mb-4 text-slate-600 dark:text-slate-400'>
                  Start a conversation about oceanographic data. Ask questions
                  about Argo floats, temperature, salinity, and more.
                </p>
                <button
                  onClick={createNewSession}
                  className='inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-700 dark:to-cyan-700 dark:hover:from-blue-800 dark:hover:to-cyan-800'
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        {currentSession && (
          <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
        )}

        {/* Connection Status - Bottom Right */}
        <div className='absolute bottom-2 right-6 z-20'>
          {connectionError ? (
            <div className='flex items-center space-x-2'>
              <span className='inline-flex items-center rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 shadow-lg dark:bg-red-900/30 dark:text-red-300'>
                <svg
                  className='mr-1.5 h-3 w-3'
                  fill='currentColor'
                  viewBox='0 0 8 8'
                >
                  <circle cx={4} cy={4} r={3} />
                </svg>
                Disconnected
              </span>
              <button
                onClick={loadSessions}
                className='rounded-md bg-red-100 p-2 text-sm text-red-800 shadow-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                title='Retry connection'
              >
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
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
              </button>
            </div>
          ) : isConnected ? (
            <span className='inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-lg dark:bg-emerald-900/30 dark:text-emerald-300'>
              <svg
                className='mr-1.5 h-3 w-3'
                fill='currentColor'
                viewBox='0 0 8 8'
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              Connected
            </span>
          ) : (
            <span className='inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-lg dark:bg-amber-900/30 dark:text-amber-300'>
              <svg
                className='mr-1.5 h-3 w-3'
                fill='currentColor'
                viewBox='0 0 8 8'
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              Connecting...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
