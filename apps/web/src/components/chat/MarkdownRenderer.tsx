'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const isBlock = className?.includes('language-')
            return isBlock ? (
              <pre className='my-2 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100'>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className='rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-sm text-cyan-900'
                {...props}
              >
                {children}
              </code>
            )
          },
          h1: ({ children }) => (
            <h1 className='mb-4 mt-6 text-2xl font-bold text-slate-800'>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className='mb-3 mt-5 text-xl font-bold text-slate-800'>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className='mb-2 mt-4 text-lg font-bold text-slate-700'>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className='mb-3 leading-relaxed'>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className='mb-3 list-inside list-disc space-y-1'>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className='mb-3 list-inside list-decimal space-y-1'>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className='leading-relaxed'>{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              className='text-cyan-600 underline hover:text-cyan-800'
              target='_blank'
              rel='noopener noreferrer'
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className='my-3 rounded-r border-l-4 border-cyan-300 bg-cyan-50 py-2 pl-4 italic text-slate-700'>
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className='font-bold text-slate-800'>{children}</strong>
          ),
          em: ({ children }) => <em className='italic'>{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
