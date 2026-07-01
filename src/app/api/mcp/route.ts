import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Ferramentas (tools) que o agente do GPT Maker pode chamar
const TOOLS = [
  {
    name: 'buscar_produto',
    description: 'Busca um produto (planta, vaso ou insumo) pelo nome. Retorna SKU, preço, categoria, cuidados e imagens.',
    inputSchema: {
      type: 'object',
      properties: {
        nome: {
          type: 'string',
          description: 'Nome ou parte do nome do produto mencionado pelo cliente, ex: "costela de adao"',
        },
      },
      required: ['nome'],
    },
  },
  {
    name: 'registrar_atendimento',
    description:
      'Salva no CRM um resumo do atendimento com o cliente. Chame UMA vez, ao final da conversa, quando já souber o que o cliente queria. Preencha com os dados que o cliente forneceu durante o papo.',
    inputSchema: {
      type: 'object',
      properties: {
        telefone: {
          type: 'string',
          description: 'Telefone/WhatsApp do cliente. Se não souber, envie "não informado".',
        },
        nome: {
          type: 'string',
          description: 'Nome do cliente, se ele informou.',
        },
        email: {
          type: 'string',
          description: 'E-mail do cliente, se ele informou.',
        },
        endereco: {
          type: 'string',
          description: 'Endereço de entrega do cliente, se informado.',
        },
        produto_interesse: {
          type: 'string',
          description: 'Produto que o cliente quis (planta, vaso, terra, fertilizante). Ex: "Costela-de-adão".',
        },
        sku: {
          type: 'string',
          description: 'Código (SKU) do produto, caso você o tenha encontrado com a ferramenta buscar_produto. Opcional.',
        },
        status: {
          type: 'string',
          description: 'Situação do cliente: "novo", "interessado", "comprou" ou "perdido".',
        },
        resumo: {
          type: 'string',
          description: 'Resumo curto da conversa, em 1 ou 2 frases.',
        },
      },
      required: ['telefone', 'resumo'],
    },
  },
]

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { jsonrpc, id, method, params } = body

  // Método: initialize - o GPT Maker "se apresenta" ao MCP
  if (method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'loja-plantas-mcp', version: '1.1.0' },
      },
    })
  }

  // Método: tools/list - o GPT Maker pergunta quais ferramentas existem
  if (method === 'tools/list') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    })
  }

  // Método: tools/call - o GPT Maker de fato chama uma ferramenta
  if (method === 'tools/call') {
    const { name, arguments: args } = params

    if (name === 'buscar_produto') {
      const resultado = await buscarProduto(args.nome)
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(resultado) }],
        },
      })
    }

    if (name === 'registrar_atendimento') {
      const resultado = await registrarAtendimento(args)
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(resultado) }],
        },
      })
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Ferramenta desconhecida: ${name}` },
    })
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Método desconhecido: ${method}` },
  })
}

// Função que faz a busca real no Supabase, com tolerância a variações de digitação
async function buscarProduto(nomeBuscado: string) {
  const supabase = createServiceClient()

  // Busca por aproximação (ilike = case-insensitive, % = qualquer texto antes/depois)
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('*')
    .ilike('nome', `%${nomeBuscado}%`)
    .eq('ativo', true)
    .limit(5)

  if (error) {
    return { encontrado: false, erro: error.message }
  }

  if (!produtos || produtos.length === 0) {
    return { encontrado: false, mensagem: 'Produto não encontrado no catálogo.' }
  }

  // URL base do Supabase Storage, onde as imagens dos produtos estão hospedadas
  const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/produtos`

  // Para cada produto encontrado, busca também as imagens associadas
  const produtosComImagens = await Promise.all(
    produtos.map(async (produto) => {
      const { data: imagens } = await supabase
        .from('imagens_produto')
        .select('arquivo, ordem')
        .eq('sku', produto.sku)
        .order('ordem', { ascending: true })

      // Adiciona a URL pública completa de cada imagem, além do nome do arquivo
      const imagensComUrl = (imagens || []).map((img) => ({
        ...img,
        url: `${SUPABASE_STORAGE_URL}/${img.arquivo}`,
      }))

      return { ...produto, imagens: imagensComUrl }
    })
  )

  return { encontrado: true, produtos: produtosComImagens }
}

// Dados que o agente pode enviar ao registrar um atendimento
interface AtendimentoArgs {
  telefone?: string
  nome?: string
  email?: string
  endereco?: string
  produto_interesse?: string
  sku?: string
  status?: string
  resumo?: string
}

const STATUS_VALIDOS = ['novo', 'interessado', 'comprou', 'perdido']

// Salva uma linha nova na tabela atendimentos (o "caderno" do CRM)
async function registrarAtendimento(args: AtendimentoArgs) {
  const supabase = createServiceClient()

  // Garante que o status seja sempre um dos valores aceitos
  const status = STATUS_VALIDOS.includes((args.status || '').toLowerCase())
    ? (args.status as string).toLowerCase()
    : 'novo'

  const { data, error } = await supabase
    .from('atendimentos')
    .insert({
      telefone: args.telefone?.trim() || 'não informado',
      nome: args.nome?.trim() || null,
      email: args.email?.trim() || null,
      endereco: args.endereco?.trim() || null,
      produto_interesse: args.produto_interesse?.trim() || null,
      sku: args.sku?.trim() || null,
      status,
      resumo: args.resumo?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    return { salvo: false, erro: error.message }
  }

  return { salvo: true, id: data.id, mensagem: 'Atendimento registrado no CRM.' }
}
