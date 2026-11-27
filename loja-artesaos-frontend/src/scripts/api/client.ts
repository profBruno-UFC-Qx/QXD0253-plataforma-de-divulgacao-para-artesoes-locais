// Endereço do Strapi. Para mudar, crie um arquivo .env com VITE_API_URL=https://seu-servidor
export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:1337').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(mensagem: string, status: number) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RespostaDeErro {
  error?: { message?: string }
}

interface OpcoesRequisicao {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown 
  token?: string
}

export async function requisicao<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const ehFormulario = opcoes.body instanceof FormData
  const headers: Record<string, string> = ehFormulario ? {} : { 'Content-Type': 'application/json' }
  if (opcoes.token) headers.Authorization = `Bearer ${opcoes.token}`

  let corpo: BodyInit | undefined
  if (opcoes.body !== undefined) corpo = ehFormulario ? (opcoes.body as FormData) : JSON.stringify(opcoes.body)

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { method: opcoes.method ?? 'GET', headers, body: corpo })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se o Strapi está rodando.', 0)
  }

  const dados: unknown = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    const mensagem = (dados as RespostaDeErro | null)?.error?.message ?? 'Erro inesperado no servidor.'
    throw new ApiError(mensagem, resposta.status)
  }

  return dados as T
}
