'use client'

import { useEffect, useRef } from 'react'
import type { Message } from '@/types/chat'
import MarkdownRenderer from './MarkdownRenderer'
import { useStaggerChildren, useFadeIn } from '@/hooks/useAnimations'

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export default function ChatMessages({
  messages,
  isLoading,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useStaggerChildren<HTMLDivElement>(0, 0.1)
  const emptyStateRef = useFadeIn<HTMLDivElement>(0.3, 'up')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      ref={messagesContainerRef}
      className='chat-scrollbar h-full flex-1 space-y-6 overflow-y-auto p-4'
    >
      {messages.length === 0 && !isLoading ? (
        <div
          ref={emptyStateRef}
          className='py-12 text-center text-slate-500 dark:text-slate-400'
        >
          <svg
            className='mx-auto mb-4 h-16 w-16 text-cyan-300 dark:text-cyan-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1}
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </svg>
          <p className='mb-2 text-lg font-medium text-slate-700 dark:text-slate-300'>
            Start the conversation
          </p>
          <p className='text-slate-500 dark:text-slate-400'>
            Ask me anything about oceanographic data, Argo floats, or marine
            science!
          </p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                        : 'bg-gradient-to-br from-slate-100 to-cyan-100 text-slate-600 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300'
                    } `}
                  >
                    {message.role === 'user' ? (
                      <svg
                        className='h-5 w-5'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                          clipRule='evenodd'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='h-5 w-5'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path d='M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z' />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`chat-message max-w-full select-text rounded-lg px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : 'border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 text-slate-900 dark:border-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-100'
                    } `}
                  >
                    <div className='select-text whitespace-pre-wrap break-words'>
                      {message.role === 'assistant' ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                  {message.created_at && (
                    <div
                      className={`mt-1 px-1 text-xs text-gray-500 dark:text-gray-400 ${message.role === 'user' ? 'text-right' : 'text-left'} `}
                    >
                      {formatTime(message.created_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className='flex justify-start'>
              <div className='flex max-w-3xl'>
                <div className='mr-3 flex-shrink-0'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-cyan-100 text-sm font-medium text-slate-600 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300'>
                    <svg
                      className='h-5 w-5'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z' />
                    </svg>
                  </div>
                </div>
                <div className='flex flex-col items-start'>
                  <div className='rounded-lg border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 px-4 py-3 shadow-sm dark:border-slate-600 dark:from-slate-800 dark:to-slate-700'>
                    <div className='flex items-center space-x-2'>
                      <div className='flex space-x-1'>
                        <div className='typing-indicator h-2 w-2 rounded-full bg-cyan-400 dark:bg-cyan-500'></div>
                        <div
                          className='typing-indicator h-2 w-2 rounded-full bg-cyan-400 dark:bg-cyan-500'
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                        <div
                          className='typing-indicator h-2 w-2 rounded-full bg-cyan-400 dark:bg-cyan-500'
                          style={{ animationDelay: '0.4s' }}
                        ></div>
                      </div>
                      <span className='text-sm text-slate-600 dark:text-slate-300'>
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
