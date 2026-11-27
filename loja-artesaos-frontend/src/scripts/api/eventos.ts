import { API_URL, requisicao } from './client'
import type { Evento } from '../types'

interface EventoApi {
  id: number
  documentId: string
  titulo: string
  descricao: string
  dataEvento: string
  imagem?: { url: string; formats?: Record<string, { url: string } | undefined> | null } | null
}

export interface DadosEvento {
  titulo: string
  descricao: string
  dataEvento: string
  imagem?: number | null 
}

export const EVENTOS_POR_PAGINA = 10

function converter(e: EventoApi): Evento {
  const url = e.imagem?.formats?.medium?.url ?? e.imagem?.url
  return {
    id: e.id,
    documentId: e.documentId,
    titulo: e.titulo,
    descricao: e.descricao,
    dataEvento: e.dataEvento,
    imagemUrl: url ? (url.startsWith('http') ? url : `${API_URL}${url}`) : null,
  }
}

export async function listarEventos(pagina: number): Promise<{ eventos: Evento[]; ultimaPagina: boolean }> {
  const params = new URLSearchParams({
    'populate[imagem]': 'true',
    sort: 'dataEvento:desc',
    'pagination[page]': String(pagina),
    'pagination[pageSize]': String(EVENTOS_POR_PAGINA),
  })
  const resposta = await requisicao<{ data: EventoApi[]; meta: { pagination: { page: number; pageCount: number } } }>(
    `/api/eventos?${params}`,
  )
  const { page, pageCount } = resposta.meta.pagination
  return { eventos: resposta.data.map(converter), ultimaPagina: page >= pageCount }
}

export function criarEvento(dados: DadosEvento, token: string): Promise<void> {
  return requisicao<void>('/api/eventos', { method: 'POST', body: { data: dados }, token })
}

export function atualizarEvento(documentId: string, dados: DadosEvento, token: string): Promise<void> {
  return requisicao<void>(`/api/eventos/${encodeURIComponent(documentId)}`, { method: 'PUT', body: { data: dados }, token })
}

export function excluirEvento(documentId: string, token: string): Promise<void> {
  return requisicao<void>(`/api/eventos/${encodeURIComponent(documentId)}`, { method: 'DELETE', token })
}
