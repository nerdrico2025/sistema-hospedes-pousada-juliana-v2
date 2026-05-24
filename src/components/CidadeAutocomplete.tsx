import React, { useState, useEffect, useRef, useId } from 'react'
import { MapPin, ChevronDown, X } from 'lucide-react'
import { useMunicipios, Municipio } from '../hooks/useMunicipios'

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

interface Props {
  value: string
  onChange: (ibge: string, estado: string) => void
  error?: string
}

export default function CidadeAutocomplete({ value, onChange, error }: Props) {
  const { municipios, loading, error: fetchError } = useMunicipios()
  const [uf, setUf] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  // Sync label when value is reset externally
  useEffect(() => {
    if (!value) {
      setQuery('')
      return
    }
    if (municipios.length === 0) return
    const found = municipios.find((m) => String(m.ibge) === value)
    if (found) setQuery(`${found.nome} — ${found.estado}`)
  }, [value, municipios])

  const filtered: Municipio[] =
    query.length >= 2
      ? municipios
          .filter(
            (m) =>
              (!uf || m.estado === uf) &&
              m.nome.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 60)
      : []

  const handleSelect = (m: Municipio) => {
    setQuery(`${m.nome} — ${m.estado}`)
    setOpen(false)
    onChange(String(m.ibge), m.estado)
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setHighlighted(0)
    setOpen(true)
    if (!e.target.value) onChange('', '')
  }

  const handleClear = () => {
    setQuery('')
    onChange('', '')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[highlighted] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const showDropdown = open && query.length >= 2
  const showEmpty = showDropdown && filtered.length === 0 && !loading

  return (
    <div className="space-y-3">
      {/* Filtro por UF */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Estado (UF)</label>
        <div className="relative">
          <select
            value={uf}
            onChange={(e) => {
              setUf(e.target.value)
              setHighlighted(0)
              // reset selected city if it's from another state
              if (value) {
                const m = municipios.find((c) => String(c.ibge) === value)
                if (m && e.target.value && m.estado !== e.target.value) {
                  setQuery('')
                  onChange('', '')
                }
              }
            }}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-white shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Todos os estados</option>
            {UFS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Campo com autocomplete */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Cidade de Residência</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query.length >= 2) setOpen(true) }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={
              loading
                ? 'Carregando cidades do IBGE…'
                : fetchError
                ? 'Erro ao carregar cidades'
                : uf
                ? `Buscar cidade em ${uf}…`
                : 'Digite o nome da cidade'
            }
            disabled={loading || fetchError}
            className={`
              block w-full rounded-lg border px-3 py-2 pl-10 pr-8 shadow-sm
              placeholder-gray-400 transition-colors duration-200
              focus:outline-none focus:ring-1
              disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'}
            `}
          />
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!query && !loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          )}

          {/* Dropdown */}
          {showDropdown && filtered.length > 0 && (
            <ul
              id={listboxId}
              ref={listRef}
              role="listbox"
              className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {filtered.map((m, i) => (
                <li
                  key={m.ibge}
                  role="option"
                  aria-selected={i === highlighted}
                  onMouseDown={() => handleSelect(m)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`
                    flex items-center justify-between px-4 py-2 cursor-pointer text-sm
                    ${i === highlighted ? 'bg-sky-50 text-sky-800' : 'text-gray-800 hover:bg-gray-50'}
                  `}
                >
                  <span>{m.nome}</span>
                  <span className="text-xs text-gray-400 font-mono">{m.estado}</span>
                </li>
              ))}
            </ul>
          )}

          {showEmpty && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-4 py-3 text-sm text-gray-500">
              Nenhuma cidade encontrada para "{query}"
              {uf ? ` em ${uf}` : ''}.
            </div>
          )}

          {query.length === 1 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-100 bg-white shadow-md px-4 py-3 text-xs text-gray-400">
              Digite ao menos 2 caracteres para buscar…
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {fetchError && (
          <p className="text-xs text-amber-600">
            Não foi possível carregar a lista de cidades. Verifique a conexão.
          </p>
        )}
      </div>
    </div>
  )
}
