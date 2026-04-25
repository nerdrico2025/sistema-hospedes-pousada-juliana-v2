import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  loading?: boolean
  children: React.ReactNode
}

const variantClasses = {
  primary: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-500 hover:border-sky-600',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 hover:border-gray-400',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 hover:border-emerald-600',
  warning: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600',
  danger: 'bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  loading, 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {Icon && !loading && <Icon className="w-4 h-4 mr-2" />}
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}