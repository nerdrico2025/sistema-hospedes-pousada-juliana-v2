import React from 'react'
import { Waves, Mountain } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  headerRight?: React.ReactNode
}

export default function Layout({ children, title, headerRight }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50">
      <header className="bg-white shadow-sm border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Waves className="h-8 w-8 text-sky-500" />
                <Mountain className="h-4 w-4 text-emerald-500 absolute -bottom-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pousada Juliana</h1>
                <p className="text-sm text-gray-500">Ilha Grande - RJ</p>
              </div>
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-sky-500 to-emerald-500 mx-auto rounded-full"></div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}