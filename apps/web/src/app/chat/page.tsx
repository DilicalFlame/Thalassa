'use client'

import ChatInterface from '@/components/chat/ChatInterface'
import { usePageTransition } from '@/hooks/useAnimations'

export default function ChatPage() {
  const pageRef = usePageTransition<HTMLDivElement>()

  return (
    <div ref={pageRef} className='min-h-screen bg-white dark:bg-slate-950'>
      <ChatInterface />
    </div>
  )
}
