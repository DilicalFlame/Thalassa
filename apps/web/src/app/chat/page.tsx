'use client'

import ChatInterface from '@/components/chat/ChatInterface'
import { usePageTransition } from '@/hooks/useAnimations'

export default function ChatPage() {
  const pageRef = usePageTransition<HTMLDivElement>()

  return (
    <div
      ref={pageRef}
      className='min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900'
    >
      <ChatInterface />
    </div>
  )
}
