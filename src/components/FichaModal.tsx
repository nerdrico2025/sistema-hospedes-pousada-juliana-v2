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

  const handleImprimir = () => {
    if (!hospede || !hospedagem) return

    const fmt = (iso: string | undefined | null) => {
      if (!iso) return '—'
      const [y, m, d] = iso.split('-')
      return `${d}/${m}/${y}`
    }
    const fmtCPF = (cpf: string) =>
      cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || cpf
    const fmtPhone = (tel: string) =>
      tel.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || tel
    const GENERO: Record<string, string> = {
      HOMEM: 'Masculino', MULHER: 'Feminino', OUTRO: 'Outros', NAOINFORMADO: 'Prefiro não informar',
    }
    const hoje = new Date()
    const dataEmissao = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`

    const campo = (label: string, valor: string, colSpan = false) => `
      <div style="${colSpan ? 'grid-column: span 2' : ''}">
        <p style="font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#374151;margin:0 0 2px">${label}</p>
        <p style="font-size:11pt;color:#111827;margin:0">${valor}</p>
      </div>`

    const fichaHTML = `
      <div style="width:210mm;min-height:297mm;padding:16mm 16mm 12mm;box-sizing:border-box;font-family:sans-serif;color:#000;background:#fff">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <img src="/logo_pousada_juliana.png" alt="Pousada Juliana" style="width:120px;height:80px;object-fit:contain" onerror="this.style.display='none'" />
          <div style="text-align:right">
            <p style="font-size:16pt;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0">Ficha de Registro de Hóspede</p>
            <p style="font-size:10pt;color:#4b5563;margin:4px 0 0">Data de emissão: ${dataEmissao}</p>
          </div>
        </div>
        <hr style="border:0;border-top:1px solid #9ca3af;margin-bottom:16px" />

        <section style="margin-bottom:16px;page-break-inside:avoid">
          <p style="font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin:0 0 10px">Dados do Hóspede</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 32px;font-size:11pt">
            ${campo('Nome Completo', hospede.nome_completo, true)}
            ${campo('CPF', fmtCPF(hospede.cpf))}
            ${campo('Data de Nascimento', fmt(hospede.data_nascimento))}
            ${campo('Telefone', fmtPhone(hospede.telefone))}
            ${campo('E-mail', hospede.email || '—', true)}
            ${campo('País de Nacionalidade', hospede.pais_nacionalidade_id || '—')}
            ${campo('Gênero', GENERO[hospede.genero_id ?? ''] ?? hospede.genero_id ?? '—')}
          </div>
        </section>

        <section style="margin-bottom:16px;page-break-inside:avoid">
          <p style="font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin:0 0 10px">Dados da Hospedagem</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 32px;font-size:11pt">
            ${campo('Data de Entrada Prevista', fmt(hospedagem.data_entrada))}
            ${campo('Data de Saída Prevista', fmt(hospedagem.data_saida))}
            ${campo('Número de Pessoas', hospedagem.numero_pessoas != null ? String(hospedagem.numero_pessoas) : '—')}
            ${quartoNumero ? campo('Quarto', quartoNumero) : ''}
          </div>
        </section>

        <section style="margin-bottom:24px;page-break-inside:avoid">
          <p style="font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin:0 0 8px">Observações</p>
          <div style="border:1px dashed #9ca3af;border-radius:4px;min-height:5rem;padding:8px"></div>
        </section>

        <section style="page-break-inside:avoid">
          <hr style="border:0;border-top:1px solid #9ca3af;margin-bottom:16px" />
          <div style="display:flex;justify-content:space-between;font-size:11pt">
            <p style="margin:0">Assinatura do hóspede: ___________________________</p>
            <p style="margin:0">Data: _____ / _____ / _______</p>
          </div>
          <p style="text-align:center;font-size:9pt;color:#9ca3af;margin-top:24px">Documento emitido pela Pousada Juliana</p>
        </section>
      </div>`

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Ficha do Hóspede</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}</style></head><body>${fichaHTML}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  return (
    <>
      {/* Overlay */}
      <div
        id="modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>

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
          <div id="modal-body" className="flex-1 overflow-y-auto overflow-x-auto p-6">
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
