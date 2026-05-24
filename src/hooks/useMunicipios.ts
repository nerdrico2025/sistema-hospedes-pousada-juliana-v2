import { useState, useEffect } from 'react'

export interface Municipio {
  ibge: number
  nome: string
  estado: string
}

const CACHE_KEY = 'ibge_municipios_v1'
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 dias

function getCache(): Municipio[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function setCache(data: Municipio[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

export function useMunicipios() {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cached = getCache()
    if (cached) {
      setMunicipios(cached)
      setLoading(false)
      return
    }

    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((raw: any[]) => {
        const list: Municipio[] = raw.map((m) => ({
          ibge: m.id,
          nome: m.nome,
          estado: m.microrregiao?.mesorregiao?.UF?.sigla ?? '',
        }))
        setCache(list)
        setMunicipios(list)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  return { municipios, loading, error }
}
