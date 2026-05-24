import React, { useEffect, useState } from 'react'
import { X, Printer, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Hospede, Hospedagem, Quarto } from '../types'
import FichaHospede from './FichaHospede'

interface Props {
  hospedeId: string
  hospedagemId: string
  onClose: () => void
}

export default function FichaModal({ hospedeId, hospedagemId, onClose }: Props) {
  const [hospede, setHospede] = useState<Hospede | null>(null)
  const [hospedagem, setHospedagem] = useState<Hospedagem | null>(null)
  const [quartoNumero, setQuartoNumero] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const [{ data: h, error: eH }, { data: hosp, error: eHosp }] = await Promise.all([
          supabase.from('pousadajuliana_hospedes').select('*').eq('id', hospedeId).single(),
          supabase.from('pousadajuliana_hospedagens').select('*').eq('id', hospedagemId).single(),
        ])
        if (eH) throw eH
        if (eHosp) throw eHosp

        setHospede(h as Hospede)
        setHospedagem(hosp as Hospedagem)

        if ((hosp as Hospedagem).quarto_id) {
          const { data: q } = await supabase
            .from('pousadajuliana_quartos')
            .select('numero')
            .eq('id', (hosp as Hospedagem).quarto_id)
            .single()
          if (q) setQuartoNumero(String((q as Quarto).numero))
        }
      } catch (e: any) {
        setErro(e.message || 'Erro ao carregar dados da ficha.')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [hospedeId, hospedagemId])

  const handleImprimir = () => window.print()

  return (
    <>
      {/* Estilos de impressão — inline para garantir aplicação */}
      <style>{`
        @media print {
          body > *:not(#portal-impressao) { display: none !important; }
          #portal-impressao { display: block !important; position: static !important; }
          #modal-overlay, .modal-botoes { display: none !important; }
          #modal-body { overflow: visible !important; }
          #ficha-impressao {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
          }
          #ficha-impressao * {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #ficha-impressao section, #ficha-impressao div {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        id="modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>

          {/* Header fixo */}
          <div className="modal-botoes flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Ficha do Hóspede</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImprimir}
                disabled={loading || !!erro}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Corpo com scroll */}
          <div id="modal-body" className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                <p className="text-sm">Carregando ficha…</p>
              </div>
            )}

            {!loading && erro && (
              <div className="text-center py-12 text-red-600">
                <p className="font-medium">Erro ao carregar a ficha</p>
                <p className="text-sm mt-1 text-red-500">{erro}</p>
              </div>
            )}

            {!loading && !erro && hospede && hospedagem && (
              <FichaHospede
                hospede={hospede}
                hospedagem={hospedagem}
                quarto={quartoNumero}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
