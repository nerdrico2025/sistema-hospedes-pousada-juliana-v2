import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface ActionBoxProps {
  title: string
  description: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange'
  children: React.ReactNode
}

const colorClasses = {
  blue: {
    border: 'border-sky-200 hover:border-sky-300',
    bg: 'bg-sky-50 hover:bg-sky-100',
    icon: 'text-sky-500',
    title: 'text-sky-800'
  },
  green: {
    border: 'border-emerald-200 hover:border-emerald-300',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    icon: 'text-emerald-500',
    title: 'text-emerald-800'
  },
  orange: {
    border: 'border-orange-200 hover:border-orange-300',
    bg: 'bg-orange-50 hover:bg-orange-100',
    icon: 'text-orange-500',
    title: 'text-orange-800'
  }
}

export default function ActionBox({ title, description, icon: Icon, color, children }: ActionBoxProps) {
  const colors = colorClasses[color]
  
  return (
    <div className={`border-2 ${colors.border} ${colors.bg} rounded-xl p-6 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 h-full flex flex-col`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-md mb-4">
          <Icon className={`h-8 w-8 ${colors.icon}`} />
        </div>
        <h3 className={`text-xl font-bold ${colors.title} mb-2`}>{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        {children}
      </div>
    </div>
  )
}