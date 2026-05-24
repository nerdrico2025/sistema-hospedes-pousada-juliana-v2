import React, { useState } from 'react'
import { Hospede, Hospedagem } from '../types'

interface Props {
  hospede: Hospede
  hospedagem: Hospedagem
  quarto?: string | null
}

function fmt(iso: string | undefined | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fmtCPF(cpf: string): string {
  const n = cpf.replace(/\D/g, '')
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || cpf
}

function fmtPhone(tel: string): string {
  const n = tel.replace(/\D/g, '')
  return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || tel
}

const GENERO_MAP: Record<string, string> = {
  HOMEM: 'Masculino',
  MULHER: 'Feminino',
  OUTRO: 'Outros',
  NAOINFORMADO: 'Prefiro não informar',
}

export default function FichaHospede({ hospede, hospedagem, quarto }: Props) {
  const [logoErro, setLogoErro] = useState(false)

  const hoje = new Date()
  const dataEmissao = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`

  return (
    <div
      id="ficha-impressao"
      className="bg-white text-black font-sans"
      style={{ width: '210mm', minHeight: '297mm', padding: '16mm 16mm 12mm 16mm', boxSizing: 'border-box' }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ width: 120, height: 80, flexShrink: 0 }}>
          {logoErro ? (
            <div
              className="flex items-center justify-center bg-sky-100 rounded font-bold text-sky-800 text-sm text-center leading-tight"
              style={{ width: 120, height: 80 }}
            >
              POUSADA<br />JULIANA
            </div>
          ) : (
            <img
              src="/logo_pousada_juliana.png"
              alt="Pousada Juliana"
              style={{ width: 120, height: 80, objectFit: 'contain' }}
              onError={() => setLogoErro(true)}
            />
          )}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            Ficha de Registro de Hóspede
          </p>
          <p className="text-sm text-gray-600 mt-1">Data de emissão: {dataEmissao}</p>
        </div>
      </div>

      <hr className="border-gray-400 mb-5" />

      {/* Dados do hóspede */}
      <section style={{ pageBreakInside: 'avoid' }} className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">
          Dados do Hóspede
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Campo label="Nome Completo" valor={hospede.nome_completo} colSpan />
          <Campo label="CPF" valor={fmtCPF(hospede.cpf)} />
          <Campo label="Data de Nascimento" valor={fmt(hospede.data_nascimento)} />
          <Campo label="Telefone" valor={fmtPhone(hospede.telefone)} />
          <Campo label="E-mail" valor={hospede.email} colSpan />
          <Campo
            label="País de Nacionalidade"
            valor={hospede.pais_nacionalidade_id || '—'}
          />
          <Campo
            label="Gênero"
            valor={GENERO_MAP[hospede.genero_id ?? ''] ?? hospede.genero_id ?? '—'}
          />
        </div>
      </section>

      {/* Dados da hospedagem */}
      <section style={{ pageBreakInside: 'avoid' }} className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">
          Dados da Hospedagem
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Campo label="Data de Entrada Prevista" valor={fmt(hospedagem.data_entrada)} />
          <Campo label="Data de Saída Prevista" valor={fmt(hospedagem.data_saida)} />
          <Campo
            label="Número de Pessoas"
            valor={hospedagem.numero_pessoas != null ? String(hospedagem.numero_pessoas) : '—'}
          />
          {hospedagem.quarto_id && quarto && (
            <Campo label="Quarto" valor={quarto} />
          )}
        </div>
      </section>

      {/* Observações */}
      <section style={{ pageBreakInside: 'avoid' }} className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-200 pb-1">
          Observações
        </p>
        <div
          className="w-full"
          style={{
            border: '1px dashed #9ca3af',
            borderRadius: 4,
            minHeight: '5rem',
            padding: '8px',
          }}
        />
      </section>

      {/* Assinatura */}
      <section style={{ pageBreakInside: 'avoid' }}>
        <hr className="border-gray-400 mb-4" />
        <div className="flex items-end justify-between text-sm">
          <p>Assinatura do hóspede: ___________________________</p>
          <p>Data: _____ / _____ / _______</p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Documento emitido pela Pousada Juliana
        </p>
      </section>
    </div>
  )
}

function Campo({
  label,
  valor,
  colSpan,
}: {
  label: string
  valor: string
  colSpan?: boolean
}) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-gray-900 mt-0.5">{valor}</p>
    </div>
  )
}
