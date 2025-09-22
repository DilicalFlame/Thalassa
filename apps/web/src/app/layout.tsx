import type { Metadata } from 'next'
import './globals.css'
import React from 'react'
import Navigation from '@/components/Navigation'

interface IRootLayout {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: 'Thalassa - Ocean Data Explorer',
  description:
    'Explore oceanographic data with AI-powered insights and interactive visualizations',
  authors: [{ name: 'Devesh Kumar', url: 'https://dilicalflame.me' }],
}

export default function RootLayout({ children }: IRootLayout) {
  return (
    <html lang='en'>
      <body suppressHydrationWarning>
        <Navigation />
        {children}
      </body>
    </html>
  )
}
