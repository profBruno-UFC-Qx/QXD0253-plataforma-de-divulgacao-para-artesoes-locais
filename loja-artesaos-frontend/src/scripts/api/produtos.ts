import { API_URL, requisicao } from './client'
import { getToken } from '../auth/sessao'
import type { Categoria, Produto } from '../types'

interface ImagemApi {
  url: string
  formats?: Record<string, { url: string } | undefined> | null
}

interface ProdutoApi {
  id: number
  documentId: string
  nome: string
  descricao?: string | null
  preco: number
  peso?: number | null
  categoria?: Categoria | null
  imagem?: ImagemApi | null
  createdAt: string
  artesao?: { documentId: string; nome: string } | null
}

interface Lista<T> {
  data: T[]
  meta: { pagination: { page: number; pageCount: number; total: number } }
}

export const TAMANHO_PAGINA = 12

function absoluta(url: string): string {
  return url.startsWith('http') ? url : `${API_URL}${url}`
}

function converter(p: ProdutoApi): Produto {
  const miniatura = p.imagem?.formats?.medium?.url ?? p.imagem?.formats?.small?.url ?? p.imagem?.url
  return {
    id: p.id,
    documentId: p.documentId,
    nome: p.nome,
    descricao: p.descricao ?? '',
    preco: Number(p.preco),
    peso: p.peso == null ? null : Number(p.peso),
    categoria: p.categoria ?? null,
    imagemUrl: p.imagem ? absoluta(p.imagem.url) : null,
    miniaturaUrl: miniatura ? absoluta(miniatura) : null,
    criadoEm: p.createdAt,
    artesao: p.artesao ?? null,
  }
}

export interface FiltrosProdutos {
  pagina: number
  categoriaId?: string | null
  busca?: string
}

export async function listarProdutos(filtros: FiltrosProdutos): Promise<{ produtos: Produto[]; ultimaPagina: boolean }> {
  const params = new URLSearchParams({
    'populate[categoria]': 'true',
    'populate[imagem]': 'true',
    sort: 'createdAt:desc',
    'pagination[page]': String(filtros.pagina),
    'pagination[pageSize]': String(TAMANHO_PAGINA),
  })
  if (filtros.categoriaId) params.set('filters[categoria][documentId][$eq]', filtros.categoriaId)
  if (filtros.busca) params.set('filters[nome][$containsi]', filtros.busca)

  const resposta = await requisicao<Lista<ProdutoApi>>(`/api/produtos?${params}`)
  const { page, pageCount } = resposta.meta.pagination
  return { produtos: resposta.data.map(converter), ultimaPagina: page >= pageCount }
}

export async function buscarProduto(documentId: string): Promise<Produto> {
  const params = new URLSearchParams({ 'populate[categoria]': 'true', 'populate[imagem]': 'true' })
  const resposta = await requisicao<{ data: ProdutoApi }>(`/api/produtos/${encodeURIComponent(documentId)}?${params}`, {
    token: getToken() ?? undefined,
  })
  return converter(resposta.data)
}

export async function listarCategorias(): Promise<Categoria[]> {
  const resposta = await requisicao<{ data: Categoria[] }>('/api/categorias?sort=nome:asc&pagination[pageSize]=100')
  return resposta.data
}

export const PRODUTOS_POR_PAGINA = 10

export interface PaginaDeProdutos {
  produtos: Produto[]
  paginaAtual: number
  totalPaginas: number
  total: number
}

export async function listarMeusProdutos(
  filtros: { pagina: number; busca?: string },
  token: string,
): Promise<PaginaDeProdutos> {
  const params = new URLSearchParams({
    'populate[categoria]': 'true',
    'populate[imagem]': 'true',
    sort: 'createdAt:desc',
    'pagination[page]': String(filtros.pagina),
    'pagination[pageSize]': String(PRODUTOS_POR_PAGINA),
  })
  if (filtros.busca) params.set('filters[nome][$containsi]', filtros.busca)

  const resposta = await requisicao<Lista<ProdutoApi>>(`/api/produtos/meus?${params}`, { token })
  const { page, pageCount, total } = resposta.meta.pagination
  return { produtos: resposta.data.map(converter), paginaAtual: page, totalPaginas: pageCount, total }
}

export interface DadosProduto {
  nome: string
  descricao: string
  preco: number
  peso: number 
  categoria: string 
  imagem?: number 
}

export function criarProduto(dados: DadosProduto, token: string): Promise<void> {
  return requisicao<void>('/api/produtos', { method: 'POST', body: { data: dados }, token })
}

export function atualizarProduto(documentId: string, dados: DadosProduto, token: string): Promise<void> {
  return requisicao<void>(`/api/produtos/${encodeURIComponent(documentId)}`, { method: 'PUT', body: { data: dados }, token })
}

export function excluirProduto(documentId: string, token: string): Promise<void> {
  return requisicao<void>(`/api/produtos/${encodeURIComponent(documentId)}`, { method: 'DELETE', token })
}
