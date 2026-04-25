import React, { useState } from 'react'
import { Calendar } from 'lucide-react'

interface DateInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  min?: string
  className?: string
}

export default function DateInput({ 
  label, 
  value, 
  onChange, 
  error, 
  placeholder = "dd/mm/aaaa",
  min,
  className = '' 
}: DateInputProps) {
  const [inputType, setInputType] = useState<'text' | 'date'>('text')

  const formatDateInput = (input: string) => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '')
    
    // Aplica a máscara dd/mm/aaaa
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
  }

  const convertToISODate = (dateStr: string) => {
    // Se já está no formato ISO (yyyy-mm-dd), retorna como está
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr
    }
    
    // Converte dd/mm/aaaa para yyyy-mm-dd
    const parts = dateStr.split('/')
    if (parts.length === 3 && parts[2].length === 4) {
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]
      return `${year}-${month}-${day}`
    }
    return dateStr
  }

  const convertFromISODate = (isoDate: string) => {
    // Se está no formato ISO, converte para dd/mm/aaaa
    if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = isoDate.split('-')
      return `${day}/${month}/${year}`
    }
    return isoDate
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value)
    
    // Se tem 10 caracteres (dd/mm/aaaa), tenta converter para ISO
    if (formatted.length === 10) {
      // Valida se a data está no formato correto antes de converter
      const parts = formatted.split('/')
      if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1])
        const year = parseInt(parts[2])
        
        // Validação básica de data
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
          const isoDate = convertToISODate(formatted)
          onChange(isoDate)
        } else {
          onChange(formatted)
        }
      } else {
        onChange(formatted)
      }
    } else {
      onChange(formatted)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const displayValue = inputType === 'text' ? convertFromISODate(value) : value

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type={inputType}
          value={displayValue}
          onChange={inputType === 'text' ? handleTextChange : handleDateChange}
          onFocus={() => {
            // Em dispositivos móveis, mantém como text para facilitar digitação
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            if (!isMobile) {
              setInputType('date')
            }
          }}
          onBlur={() => setInputType('text')}
          placeholder={placeholder}
          min={min}
          maxLength={inputType === 'text' ? 10 : undefined}
          className={`
            block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 
            placeholder-gray-400 shadow-sm transition-colors duration-200
            focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}