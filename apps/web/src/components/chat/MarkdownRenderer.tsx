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
            <h1 className='mb-4 mt-6 text-2xl font-bold text-slate-800 dark:text-slate-200'>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className='mb-3 mt-5 text-xl font-bold text-slate-800 dark:text-slate-200'>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className='mb-2 mt-4 text-lg font-bold text-slate-700 dark:text-slate-300'>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className='mb-3 leading-relaxed text-slate-700 dark:text-slate-300'>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className='mb-3 list-inside list-disc space-y-1 text-slate-700 dark:text-slate-300'>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className='mb-3 list-inside list-decimal space-y-1 text-slate-700 dark:text-slate-300'>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className='leading-relaxed text-slate-700 dark:text-slate-300'>
              {children}
            </li>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className='text-cyan-600 underline hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200'
              target='_blank'
              rel='noopener noreferrer'
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className='my-3 rounded-r border-l-4 border-cyan-300 bg-cyan-50 py-2 pl-4 italic text-slate-700 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-slate-300'>
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className='font-bold text-slate-800 dark:text-slate-200'>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className='italic text-slate-700 dark:text-slate-300'>
              {children}
            </em>
          ),
          table: ({ children }) => (
            <div className='my-4 w-full overflow-x-auto'>
              <table className='w-full border-collapse border-2 border-cyan-200 bg-white dark:border-slate-600 dark:bg-slate-800'>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className='bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-slate-700 dark:to-slate-600'>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className='divide-y divide-cyan-200 dark:divide-slate-600'>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className='hover:bg-cyan-50 dark:hover:bg-slate-700/50'>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className='border border-cyan-200 px-4 py-3 text-center font-semibold text-white dark:border-slate-600'>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className='border border-cyan-200 px-4 py-3 text-center text-slate-700 dark:border-slate-600 dark:text-slate-300'>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
