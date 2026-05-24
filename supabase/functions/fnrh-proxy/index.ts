const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const FNRH_URL =
    Deno.env.get('FNRH_URL') ?? 'https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v2'
  const FNRH_USUARIO = Deno.env.get('FNRH_USUARIO') ?? ''
  const FNRH_CHAVE = Deno.env.get('FNRH_CHAVE') ?? ''
  const FNRH_CPF_SOLICITANTE = Deno.env.get('FNRH_CPF_SOLICITANTE') ?? ''

  let path = '(unknown)'
  let method = 'GET'

  try {
    const payload = await req.json()
    path = payload.path
    method = payload.method ?? 'GET'
    const rawBody = payload.body

    const isCheckout = path.endsWith('/checkout')

    let fetchBody: string | undefined
    let contentType = 'application/json'

    if (isCheckout) {
      // Envia a string ISO diretamente como text/plain
      fetchBody = new Date().toISOString()
      contentType = 'text/plain'
    } else if (rawBody !== undefined) {
      fetchBody = JSON.stringify(rawBody)
    }

    console.error('[fnrh-proxy] REQUEST:', method, path)
    console.error('[fnrh-proxy] CONTENT-TYPE:', contentType)
    console.error('[fnrh-proxy] BODY_SENT:', fetchBody ?? '(sem body)')

    const fnrhRes = await fetch(`${FNRH_URL}${path}`, {
      method,
      headers: {
        'Content-Type': contentType,
        Authorization: `Basic ${btoa(`${FNRH_USUARIO}:${FNRH_CHAVE}`)}`,
        cpf_solicitante: FNRH_CPF_SOLICITANTE,
      },
      ...(fetchBody !== undefined ? { body: fetchBody } : {}),
    })

    console.log('[fnrh-proxy] ← status:', fnrhRes.status)

    const text = await fnrhRes.text()
    console.log('[fnrh-proxy] ← body raw:', text.slice(0, 500))

    let data: unknown = null
    if (text.trim()) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    return new Response(
      JSON.stringify({ ok: fnrhRes.ok, status: fnrhRes.status, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    console.error('[fnrh-proxy] EXCEPTION', path, method, err?.message ?? err)
    return new Response(
      JSON.stringify({ ok: false, status: 500, data: err?.message ?? 'internal error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
