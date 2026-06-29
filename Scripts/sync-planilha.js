const { google } = require('googleapis')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SPREADSHEET_ID = '1CBpRu15-gJMFJeWGGnGf3TGbcgH8dQghyEtHQ-x4yVk'
const SHEET_NAME = 'Página1'
const CREDENTIALS_PATH = path.join(__dirname, '../google-credentials.json')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sincronizar() {
  console.log('🌿 Iniciando sincronização planilha → Supabase...')
  console.log(`📋 Planilha: ${SPREADSHEET_ID}`)
  console.log(`🗄️  Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log('')

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  console.log('📖 Lendo dados da planilha...')
  let rows
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
    })
    rows = response.data.values
  } catch (err) {
    console.error('❌ Erro ao ler planilha:', err.message)
    process.exit(1)
  }

  if (!rows || rows.length < 2) {
    console.error('❌ Planilha vazia ou sem dados além do cabeçalho.')
    process.exit(1)
  }

  const cabecalho = rows[0].map(c => c.toLowerCase().trim())
  console.log(`📊 Cabeçalho detectado: ${cabecalho.join(' | ')}`)
  console.log(`📦 Total de linhas encontradas: ${rows.length - 1}`)
  console.log('')

  const produtos = []
  const erros = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const linha = i + 1
    const sku = (row[0] || '').trim()
    const nome = (row[1] || '').trim()
    const nome_cientifico = (row[2] || '').trim()
    const categoria = (row[3] || '').trim()
    const cuidados = (row[4] || '').trim()
    const precoRaw = (row[5] || '').toString().trim().replace(',', '.')
    const ativoRaw = (row[6] || 'true').toString().trim().toLowerCase()

    if (!sku) { erros.push(`Linha ${linha}: SKU vazio — ignorada`); continue }
    if (!nome) { erros.push(`Linha ${linha} (${sku}): Nome vazio — ignorada`); continue }

    const preco = parseFloat(precoRaw)
    if (isNaN(preco)) { erros.push(`Linha ${linha} (${sku}): Preço inválido — ignorada`); continue }

    const ativo = ativoRaw === 'true' || ativoRaw === 'sim' || ativoRaw === '1'
    produtos.push({ sku, nome, nome_cientifico, categoria, cuidados, preco, ativo })
  }

  if (erros.length > 0) {
    console.warn(`⚠️  ${erros.length} linha(s) com problema:`)
    erros.forEach(e => console.warn(`   - ${e}`))
    console.log('')
  }

  console.log(`✅ ${produtos.length} produtos válidos para sincronizar`)
  console.log('')

  const LOTE = 50
  let atualizados = 0
  let falharam = 0

  for (let i = 0; i < produtos.length; i += LOTE) {
    const lote = produtos.slice(i, i + LOTE)
    const loteNum = Math.floor(i / LOTE) + 1
    const totalLotes = Math.ceil(produtos.length / LOTE)
    process.stdout.write(`⏳ Enviando lote ${loteNum}/${totalLotes} (${lote.length} produtos)...`)

    const { error } = await supabase
      .from('produtos')
      .upsert(lote, { onConflict: 'sku' })

    if (error) {
      console.log(' ❌')
      console.error(`   Erro no lote ${loteNum}:`, error.message)
      falharam += lote.length
    } else {
      console.log(' ✅')
      atualizados += lote.length
    }
  }

  console.log('')
  console.log('═══════════════════════════════════')
  console.log('📊 RESUMO DA SINCRONIZAÇÃO')
  console.log('═══════════════════════════════════')
  console.log(`✅ Produtos sincronizados: ${atualizados}`)
  if (falharam > 0) console.log(`❌ Produtos com falha: ${falharam}`)
  if (erros.length > 0) console.log(`⚠️  Linhas ignoradas:  ${erros.length}`)
  console.log('═══════════════════════════════════')
  console.log('')
  if (falharam === 0 && erros.length === 0) {
    console.log('🎉 Sincronização concluída com sucesso!')
  } else {
    console.log('⚠️  Sincronização concluída com avisos.')
  }
}

sincronizar().catch(err => {
  console.error('❌ Erro inesperado:', err.message)
  process.exit(1)
})