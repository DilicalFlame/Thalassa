'use client'

import { useState, useRef, useEffect } from 'react'
import { useFadeIn, useHoverScale } from '@/hooks/useAnimations'
import { useSpeechToText } from '@/hooks/useSpeechToText'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled: boolean
  messageCount: number
}

export default function ChatInput({
  onSendMessage,
  disabled,
  messageCount,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useFadeIn<HTMLDivElement>(0.3, 'up')
  const sendButtonRef = useHoverScale<HTMLButtonElement>(1.05)
  const micButtonRef = useHoverScale<HTMLButtonElement>(1.05)

  const { isRecording, isProcessing, startRecording, stopRecording, error } =
    useSpeechToText({
      onTranscriptionComplete: (transcript) => {
        if (transcript.trim()) {
          onSendMessage(transcript.trim())
        }
      },
      onError: (error) => {
        console.error('Speech-to-text error:', error)
        // You can add toast notification here if you have a toast system
      },
    })

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleMicClick = async () => {
    try {
      if (isRecording) {
        stopRecording()
      } else {
        await startRecording()
      }
    } catch (error) {
      console.error('Error in handleMicClick:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const suggestedQuestions = [
    "What's the average temperature in the Arabian Sea?",
    'Show me salinity data from the Pacific Ocean',
    'What are Argo floats and how do they work?',
    'Find temperature anomalies in the last month',
  ]

  return (
    <div
      ref={containerRef}
      className='border-t border-cyan-200 bg-gradient-to-r from-white to-cyan-50 dark:border-slate-600 dark:from-slate-800 dark:to-slate-700'
    >
      {/* Suggested Questions */}
      {messageCount === 0 && (
        <div className='border-b border-cyan-100 px-4 py-3 dark:border-slate-600'>
          <div className='flex flex-wrap gap-2'>
            <span className='mr-2 text-sm text-slate-600 dark:text-slate-400'>
              Try asking:
            </span>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setMessage(question)}
                className='inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-sm text-slate-700 transition-colors hover:bg-cyan-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                disabled={disabled}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className='px-4 py-4'>
        <div className='flex items-end space-x-3'>
          <div className='flex-1'>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask me about oceanographic data, Argo floats, or marine science...'
              disabled={disabled}
              rows={1}
              className='chat-input max-h-32 w-full resize-none rounded-lg border border-cyan-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-500/20'
              style={{ minHeight: '50px' }}
            />
          </div>

          {/* Microphone Button */}
          <button
            ref={micButtonRef}
            type='button'
            onClick={handleMicClick}
            disabled={disabled}
            className={`flex-shrink-0 rounded-lg p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                : isProcessing
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500'
            }`}
            style={{
              height: '50px',
              minHeight: '50px',
              alignSelf: 'flex-end',
              transform: 'translateY(-7px)',
            }}
            title={
              isRecording
                ? 'Stop recording'
                : isProcessing
                  ? 'Processing...'
                  : 'Start voice recording'
            }
          >
            {isProcessing ? (
              <svg
                className='h-5 w-5 animate-spin'
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
            ) : isRecording ? (
              <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
                <rect x='6' y='6' width='12' height='12' rx='2' />
              </svg>
            ) : (
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
                  d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
                />
              </svg>
            )}
          </button>

          {/* Send Button */}
          <button
            ref={sendButtonRef}
            type='submit'
            disabled={!message.trim() || disabled}
            className='flex-shrink-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 p-3 text-white transition-colors hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:from-blue-700 dark:to-cyan-700 dark:hover:from-blue-800 dark:hover:to-cyan-800'
            style={{
              height: '50px',
              minHeight: '50px',
              alignSelf: 'flex-end',
              transform: 'translateY(-7px)',
            }}
          >
            {disabled ? (
              <svg
                className='h-5 w-5 animate-spin'
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
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                />
              </svg>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className='mt-2 text-sm text-red-600 dark:text-red-400'>
            {error}
          </div>
        )}

        {/* Hint text */}
        <div className='mt-2 text-xs text-slate-500 dark:text-slate-400'>
          Press Enter to send, Shift+Enter for new line • Click microphone to
          use voice input
        </div>
      </form>
    </div>
  )
}
